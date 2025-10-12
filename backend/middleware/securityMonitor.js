import NotificationService from '../services/notificationService.js';
import { ActivityLog, Report } from '../models/index.js';

// Stockage temporaire des tentatives échouées (en production, utiliser Redis)
const failedAttempts = new Map();
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

class SecurityMonitor {
  
  /**
   * Middleware pour surveiller les tentatives de connexion échouées
   */
  static trackFailedLogin(req, res, next) {
    // Vérifier si l'IP est bloquée AVANT de traiter la requête
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.body.email;
    
    if (SecurityMonitor.isIPBlocked(ip, email)) {
      const blockTimeRemaining = SecurityMonitor.getBlockTimeRemaining(ip, email);
      return res.status(429).json({
        error: 'Trop de tentatives de connexion échouées. Réessayez dans quelques minutes.',
        blocked: true,
        retryAfter: Math.ceil(blockTimeRemaining / 1000), // en secondes
        message: `Votre IP est temporairement bloquée. Réessayez dans ${Math.ceil(blockTimeRemaining / 60000)} minutes.`
      });
    }

    const originalJson = res.json;
    
    res.json = function(data) {
      // Vérifier si c'est une erreur de connexion
      if (res.statusCode === 401 && data.error && data.error.includes('incorrect')) {
        const userAgent = req.get('User-Agent') || 'Unknown';
        
        SecurityMonitor.recordFailedAttempt(ip, userAgent, email).catch(console.error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Enregistrer une tentative de connexion échouée
   */
  static async recordFailedAttempt(ip, userAgent, email = null) {
    const now = Date.now();
    const key = `${ip}:${email || 'unknown'}`;
    
    // 1. Stocker en base de données
    try {
      await ActivityLog.create({
        userId: null, // Pas d'utilisateur car connexion échouée
        actionType: 'failed_login',
        details: {
          ip,
          userAgent,
          email,
          timestamp: new Date()
        }
      });
      
      console.log(`📝 [DB] Échec de connexion enregistré: ${email || 'email inconnu'} depuis ${ip}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'échec de connexion:', error);
    }
    
    // 2. Gestion en mémoire pour détection immédiate
    if (!failedAttempts.has(key)) {
      failedAttempts.set(key, []);
    }
    
    const attempts = failedAttempts.get(key);
    
    // Nettoyer les anciennes tentatives (plus de 15 minutes)
    const recentAttempts = attempts.filter(attempt => 
      now - attempt.timestamp < ATTEMPT_WINDOW
    );
    
    // Ajouter la nouvelle tentative
    recentAttempts.push({
      timestamp: now,
      userAgent,
      email
    });
    
    failedAttempts.set(key, recentAttempts);
    
    console.log(`🚨 [SECURITY] Tentative échouée #${recentAttempts.length} depuis ${ip} pour ${email || 'email inconnu'}`);
    
    // 3. Générer un signalement automatique si seuil atteint
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      await SecurityMonitor.generateFailedLoginReport(ip, userAgent, email, recentAttempts.length);
      
      NotificationService.notifySuspiciousLogin(
        ip, 
        userAgent, 
        recentAttempts.length, 
        email
      );
    } else if (recentAttempts.length === 3) {
      // Notification préventive à 3 tentatives
      NotificationService.notifySuspiciousLogin(
        ip, 
        userAgent, 
        recentAttempts.length, 
        email
      );
    }
  }

  /**
   * Vérifier si une IP est suspecte
   */
  static isSuspiciousIP(ip) {
    const attempts = Array.from(failedAttempts.entries())
      .filter(([key]) => key.startsWith(ip))
      .reduce((total, [, attempts]) => total + attempts.length, 0);
    
    return attempts >= MAX_ATTEMPTS;
  }

  /**
   * Nettoyer les anciennes tentatives (à appeler périodiquement)
   */
  static cleanupOldAttempts() {
    const now = Date.now();
    
    for (const [key, attempts] of failedAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => 
        now - attempt.timestamp < ATTEMPT_WINDOW
      );
      
      if (recentAttempts.length === 0) {
        failedAttempts.delete(key);
      } else {
        failedAttempts.set(key, recentAttempts);
      }
    }
    
    console.log(`🧹 [SECURITY] Nettoyage des tentatives: ${failedAttempts.size} IPs surveillées`);
  }

  /**
   * Obtenir les statistiques de sécurité
   */
  static getSecurityStats() {
    const now = Date.now();
    let totalAttempts = 0;
    let suspiciousIPs = 0;
    
    for (const [key, attempts] of failedAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => 
        now - attempt.timestamp < ATTEMPT_WINDOW
      );
      
      totalAttempts += recentAttempts.length;
      if (recentAttempts.length >= MAX_ATTEMPTS) {
        suspiciousIPs++;
      }
    }
    
    return {
      totalFailedAttempts: totalAttempts,
      suspiciousIPs,
      monitoredIPs: failedAttempts.size,
      windowMinutes: ATTEMPT_WINDOW / (60 * 1000)
    };
  }

  /**
   * Vérifier si une IP est bloquée
   */
  static isIPBlocked(ip, email) {
    const key = `${ip}:${email || 'unknown'}`;
    const attempts = failedAttempts.get(key);
    
    if (!attempts || attempts.length < MAX_ATTEMPTS) {
      return false;
    }
    
    const now = Date.now();
    const recentAttempts = attempts.filter(attempt => 
      now - attempt.timestamp < ATTEMPT_WINDOW
    );
    
    return recentAttempts.length >= MAX_ATTEMPTS;
  }

  /**
   * Obtenir le temps restant de blocage en millisecondes
   */
  static getBlockTimeRemaining(ip, email) {
    const key = `${ip}:${email || 'unknown'}`;
    const attempts = failedAttempts.get(key);
    
    if (!attempts || attempts.length < MAX_ATTEMPTS) {
      return 0;
    }
    
    const now = Date.now();
    const oldestRecentAttempt = attempts
      .filter(attempt => now - attempt.timestamp < ATTEMPT_WINDOW)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    if (!oldestRecentAttempt) {
      return 0;
    }
    
    const blockEndTime = oldestRecentAttempt.timestamp + ATTEMPT_WINDOW;
    return Math.max(0, blockEndTime - now);
  }

  /**
   * Générer un signalement automatique pour tentatives de connexion suspectes
   */
  static async generateFailedLoginReport(ip, userAgent, email, attemptCount) {
    try {
      const report = await Report.create({
        type: 'failed_login_attempts',
        source: 'automatic',
        status: 'pending',
        description: `Tentatives de connexion répétées détectées depuis l'IP ${ip}`,
        evidence: JSON.stringify({
          ip,
          userAgent,
          email,
          attemptCount,
          detectionTime: new Date(),
          threshold: MAX_ATTEMPTS,
          timeWindow: `${ATTEMPT_WINDOW / (60 * 1000)} minutes`
        }),
        metadata: JSON.stringify({
          severity: attemptCount >= 10 ? 'high' : 'medium',
          category: 'security',
          automated: true,
          source_ip: ip,
          target_email: email
        })
      });

      console.log(`🚨 [REPORT GENERATED] Signalement automatique créé pour IP ${ip} (${attemptCount} tentatives)`);
      return report;
    } catch (error) {
      console.error('❌ Erreur lors de la création du signalement:', error);
      return null;
    }
  }
}

// Nettoyer les anciennes tentatives toutes les 5 minutes
setInterval(() => {
  SecurityMonitor.cleanupOldAttempts();
}, 5 * 60 * 1000);

export default SecurityMonitor;
