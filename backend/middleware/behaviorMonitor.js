import rateLimit from 'express-rate-limit';
import { calculateRiskScore } from './riskCalculator.js';
import { autoModerationService } from '../services/autoModerationService.js';

// Stockage en mémoire des activités utilisateur (en production, utiliser Redis)
const userActivities = new Map();

// Configuration des seuils selon le plan
const THRESHOLDS = {
  // Upload
  maxFilesPerWindow: 5,        // fichiers
  uploadTimeWindow: 5,         // minutes
  
  // Connexion  
  maxFailedLogins: 5,          // tentatives
  loginTimeWindow: 10,         // minutes
  
  // Profil
  maxProfileChanges: 3,        // modifications
  profileTimeWindow: 60,       // minutes
  
  // API
  maxApiRequests: 100,         // requêtes
  apiTimeWindow: 1,            // minute
  
  // Scores
  warningScore: 40,            // Signalement
  criticalScore: 70            // Action immédiate
};

/**
 * Middleware principal de surveillance des comportements
 */
export const behaviorMonitor = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const endpoint = req.path;
    const method = req.method;
    const timestamp = new Date();

    // Ignorer les requêtes non authentifiées (sauf login)
    if (!userId && !endpoint.includes('/auth/login')) {
      return next();
    }

    // Identifier l'utilisateur (par ID ou IP pour les tentatives de connexion)
    const userKey = userId || userIP;

    // Initialiser l'activité utilisateur si nécessaire
    if (!userActivities.has(userKey)) {
      userActivities.set(userKey, {
        userId: userId,
        ip: userIP,
        userAgent: userAgent,
        requests: [],
        uploads: [],
        failedLogins: [],
        profileChanges: [],
        riskScore: 0,
        lastActivity: timestamp,
        isBlocked: false,
        blockUntil: null
      });
    }

    const userActivity = userActivities.get(userKey);

    // Vérifier si l'utilisateur est temporairement bloqué
    if (userActivity.isBlocked && userActivity.blockUntil > timestamp) {
      return res.status(429).json({
        error: 'Compte temporairement suspendu pour activité suspecte',
        unblockAt: userActivity.blockUntil,
        reason: 'Comportement automatique détecté'
      });
    } else if (userActivity.isBlocked && userActivity.blockUntil <= timestamp) {
      // Débloquer l'utilisateur
      userActivity.isBlocked = false;
      userActivity.blockUntil = null;
      console.log(`🔓 Utilisateur ${userKey} débloqué automatiquement`);
    }

    // Enregistrer la requête
    userActivity.requests.push({
      timestamp,
      endpoint,
      method,
      userAgent
    });

    // Nettoyer les anciennes données (garder seulement les dernières heures)
    cleanOldData(userActivity, timestamp);

    // Analyser les différents types d'activités
    analyzeActivity(userActivity, req, timestamp);

    // Calculer le score de risque
    const riskScore = await calculateRiskScore(userActivity.userId, userActivity);
    userActivity.riskScore = riskScore;
    userActivity.lastActivity = timestamp;

    // Prendre des actions selon le score de risque
    handleRiskScore(userActivity, userKey, riskScore, req, res);

    next();
  } catch (error) {
    console.error('❌ Erreur dans behaviorMonitor:', error);
    next(); // Continuer même en cas d'erreur pour ne pas bloquer l'app
  }
};

/**
 * Analyser l'activité spécifique selon le type de requête
 */
function analyzeActivity(userActivity, req, timestamp) {
  const endpoint = req.path;
  const method = req.method;

  // 1. Surveillance des uploads
  if (method === 'POST' && endpoint.includes('/upload')) {
    const uploadData = {
      timestamp,
      fileName: req.body?.fileName || req.file?.originalname || 'unknown',
      fileSize: req.body?.fileSize || req.file?.size || 0,
      fileType: req.body?.fileType || req.file?.mimetype || 'unknown'
    };
    
    userActivity.uploads.push(uploadData);
    
    console.log(`📁 [UPLOAD DETECTED] Upload détecté:`, {
      userId: userActivity.userId,
      endpoint,
      method,
      fileName: uploadData.fileName,
      fileType: uploadData.fileType,
      totalUploads: userActivity.uploads.length,
      timestamp: timestamp.toISOString()
    });
  }

  // 2. Surveillance des échecs de connexion
  if (endpoint.includes('/auth/login')) {
    // On enregistrera l'échec dans le middleware d'authentification
    // Ici on prépare juste la structure
  }

  // 3. Surveillance des modifications de profil
  if ((method === 'PUT' || method === 'PATCH') && endpoint.includes('/user')) {
    userActivity.profileChanges.push({
      timestamp,
      endpoint,
      changes: Object.keys(req.body || {})
    });
    
    console.log(`👤 Modification profil détectée pour ${userActivity.userId}`);
  }
}

/**
 * Nettoyer les données anciennes pour éviter l'accumulation
 */
function cleanOldData(userActivity, currentTime) {
  const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
  
  // Garder seulement les données de la dernière heure
  userActivity.requests = userActivity.requests.filter(req => req.timestamp > oneHourAgo);
  userActivity.uploads = userActivity.uploads.filter(upload => upload.timestamp > oneHourAgo);
  userActivity.failedLogins = userActivity.failedLogins.filter(login => login.timestamp > oneHourAgo);
  userActivity.profileChanges = userActivity.profileChanges.filter(change => change.timestamp > oneHourAgo);
}

/**
 * Gérer les actions selon le score de risque
 */
async function handleRiskScore(userActivity, userKey, riskScore, req, res) {
  try {
    console.log(`🎯 [RISK HANDLER] Gestion du score:`, {
      userKey,
      riskScore,
      warningScore: THRESHOLDS.warningScore,
      criticalScore: THRESHOLDS.criticalScore,
      reportGenerated: userActivity.reportGenerated
    });
    
    if (riskScore >= THRESHOLDS.criticalScore) {
      // Score critique : Blocage temporaire
      userActivity.isBlocked = true;
      userActivity.blockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      console.log(`🚨 CRITIQUE: Utilisateur ${userKey} bloqué temporairement (score: ${riskScore})`);
      
      // Générer un signalement urgent
      await autoModerationService.createAutoReport({
        userId: userActivity.userId,
        type: 'system_critical_behavior',
        reason: `Score de risque critique: ${riskScore}/100`,
        severity: 'critical',
        evidence: {
          riskScore,
          recentRequests: userActivity.requests.length,
          recentUploads: userActivity.uploads.length,
          recentProfileChanges: userActivity.profileChanges.length,
          userAgent: userActivity.userAgent
        }
      });
      
    } else if (riskScore >= THRESHOLDS.warningScore) {
      // Score d'avertissement : Signalement automatique
      console.log(`⚠️  ATTENTION: Utilisateur ${userKey} suspect (score: ${riskScore})`);
      
      // Générer un signalement modéré (une seule fois par session)
      if (!userActivity.reportGenerated) {
        console.log(`📝 [AUTO REPORT] Création d'un signalement automatique pour userId: ${userActivity.userId}`);
        
        await autoModerationService.createAutoReport({
          userId: userActivity.userId,
          type: 'system_suspicious_behavior',
          reason: `Comportement suspect détecté (score: ${riskScore}/100)`,
          severity: 'medium',
          evidence: {
            riskScore,
            recentRequests: userActivity.requests.length,
            recentUploads: userActivity.uploads.length,
            recentProfileChanges: userActivity.profileChanges.length
          }
        });
        
        console.log(`✅ [AUTO REPORT] Signalement automatique créé avec succès !`);
        userActivity.reportGenerated = true;
      } else {
        console.log(`⏭️  [AUTO REPORT] Signalement déjà généré pour cette session`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la gestion du score de risque:', error);
  }
}

/**
 * Middleware spécifique pour enregistrer les échecs de connexion
 */
export const trackFailedLogin = async (userIdentifier, req) => {
  try {
    const userIP = req.ip || req.connection.remoteAddress;
    const userKey = userIdentifier || userIP;
    const timestamp = new Date();

    if (!userActivities.has(userKey)) {
      userActivities.set(userKey, {
        userId: null,
        ip: userIP,
        userAgent: req.get('User-Agent') || 'Unknown',
        requests: [],
        uploads: [],
        failedLogins: [],
        profileChanges: [],
        riskScore: 0,
        lastActivity: timestamp,
        isBlocked: false,
        blockUntil: null
      });
    }

    const userActivity = userActivities.get(userKey);
    userActivity.failedLogins.push({
      timestamp,
      ip: userIP,
      userAgent: req.get('User-Agent'),
      attemptedEmail: req.body?.email || 'unknown'
    });

    console.log(`🔒 Échec de connexion enregistré pour ${userKey}: ${userActivity.failedLogins.length} tentatives récentes`);
    
    // Recalculer le score de risque après un échec de connexion
    const riskScore = await calculateRiskScore(userActivity.userId, userActivity);
    userActivity.riskScore = riskScore;
    
    return riskScore;
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement de l\'échec de connexion:', error);
    return 0;
  }
};

/**
 * Obtenir les statistiques d'un utilisateur (pour l'admin)
 */
export const getUserActivityStats = (userId) => {
  const userActivity = userActivities.get(userId);
  if (!userActivity) {
    return null;
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  return {
    userId: userActivity.userId,
    riskScore: userActivity.riskScore,
    isBlocked: userActivity.isBlocked,
    blockUntil: userActivity.blockUntil,
    stats: {
      requestsLastHour: userActivity.requests.filter(r => r.timestamp > oneHourAgo).length,
      uploadsLastFiveMinutes: userActivity.uploads.filter(u => u.timestamp > fiveMinutesAgo).length,
      failedLoginsLastTenMinutes: userActivity.failedLogins.filter(f => f.timestamp > new Date(now.getTime() - 10 * 60 * 1000)).length,
      profileChangesLastHour: userActivity.profileChanges.filter(p => p.timestamp > oneHourAgo).length
    },
    lastActivity: userActivity.lastActivity
  };
};

/**
 * Nettoyer périodiquement les données anciennes (à appeler via un cron job)
 */
export const cleanupOldActivities = () => {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  
  let cleaned = 0;
  for (const [userKey, activity] of userActivities.entries()) {
    if (activity.lastActivity < sixHoursAgo) {
      userActivities.delete(userKey);
      cleaned++;
    }
  }
  
  console.log(`🧹 Nettoyage: ${cleaned} activités utilisateur supprimées`);
  return cleaned;
};

// Nettoyer automatiquement toutes les heures
setInterval(cleanupOldActivities, 60 * 60 * 1000);

export default behaviorMonitor;
