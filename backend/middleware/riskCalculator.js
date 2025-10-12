/**
 * Calculateur de Score de Risque
 * Analyse les activités utilisateur et calcule un score de 0 à 100
 */

// Configuration des facteurs de risque selon le plan d'action
const RISK_FACTORS = {
  // Upload Suspect
  massUpload: 30,           // >5 fichiers/5min
  invalidFileType: 40,      // Tentative fichier interdit
  
  // Comportement Utilisateur  
  failedLogins: 25,         // >5 échecs/10min
  rapidProfileChange: 20,   // >3 modifs/heure
  
  // Activité Réseau
  apiAbuse: 35,            // >100 req/minute
  
  // Facteurs additionnels
  newAccount: 5,           // Compte <24h
  suspiciousUserAgent: 15, // Bot détecté
  multipleIPs: 10,         // Connexions depuis plusieurs IPs
  offHours: 5              // Activité en dehors des heures normales
};

// Configuration des seuils de détection
const THRESHOLDS = {
  // Upload - Quotas journaliers
  maxFilesPerDay: 10,          // fichiers par jour (gratuit)
  maxFilesPerDayPremium: 1000, // fichiers par jour (premium)
  
  // Upload - Détection spam (garde l'ancien système pour détecter les bots)
  maxFilesPerWindow: 5,        // fichiers
  uploadTimeWindow: 5,         // minutes
  
  // Connexion  
  maxFailedLogins: 5,          // tentatives
  loginTimeWindow: 10,         // minutes
  
  // Profil
  maxProfileChanges: 3,        // modifications
  profileTimeWindow: 60,       // minutes
  
  maxApiRequests: 100,         // requêtes
  apiTimeWindow: 1             // minute
};

/**
 * Fonction principale de calcul du score de risque pour un utilisateur
 */
export async function calculateRiskScore(userId, userActivity = null) {
  try {
    console.log(`🎯 [RISK CALCULATION] Début du calcul pour userId: ${userId}`);
    
    // Si pas d'activité fournie, la récupérer
    if (!userActivity) {
      userActivity = await getUserActivity(userId);
    }
    
    console.log(`📊 [USER ACTIVITY] Données récupérées:`, {
      userId,
      uploadsCount: userActivity.uploads?.length || 0,
      failedLoginsCount: userActivity.failedLogins?.length || 0,
      profileChangesCount: userActivity.profileChanges?.length || 0
    });
    
    let totalScore = 0;
    const now = new Date();
    const reasons = []; // Pour tracer les raisons du score

    // 1. Analyser les uploads suspects
    const uploadAnalysis = await analyzeUploads(userActivity, now, reasons);
    totalScore += uploadAnalysis.score;

    // 2. Analyser les échecs de connexion
    const loginScore = analyzeFailedLogins(userActivity, now, reasons);
    totalScore += loginScore;

    // 3. Analyser les modifications de profil
    const profileScore = analyzeProfileChanges(userActivity, now, reasons);
    totalScore += profileScore;

    // 4. Analyser l'abus d'API
    const apiScore = analyzeApiAbuse(userActivity, now, reasons);
    totalScore += apiScore;

    // 5. Analyser les facteurs additionnels
    const additionalScore = analyzeAdditionalFactors(userActivity, now, reasons);
    totalScore += additionalScore;

    // Limiter le score entre 0 et 100
    const finalScore = Math.min(Math.max(totalScore, 0), 100);

    // Logger le calcul pour debug
    if (finalScore > 20) {
      console.log(`🎯 Score de risque calculé: ${finalScore}/100 pour ${userActivity.userId || 'anonyme'}`);
      console.log(`📋 Raisons: ${reasons.join(', ')}`);
    }

    return finalScore;
  } catch (error) {
    console.error('❌ Erreur dans calculateRiskScore:', error);
    return 0;
  }
}

/**
 * Analyser les uploads suspects
 */
async function analyzeUploads(userActivity, now, reasons) {
  let score = 0;
  
  // 1. Vérifier le quota journalier (utilise le comptage réel de la DB)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Compter les uploads réels depuis la base de données
  let realUploadCount = 0;
  try {
    const { File } = await import('../models/index.js');
    const { Op } = await import('sequelize');
    realUploadCount = await File.count({
      where: {
        owner_id: userActivity.userId,
        date_upload: { [Op.gte]: startOfDay }  // Correction: c'est date_upload pas created_at
      }
    });
  } catch (error) {
    console.error('Erreur comptage uploads dans riskCalculator:', error);
    // Fallback sur les données d'activité
    realUploadCount = userActivity.uploads.filter(upload => upload.timestamp >= startOfDay).length;
  }
  
  const maxAllowed = userActivity.isPremium ? THRESHOLDS.maxFilesPerDayPremium : THRESHOLDS.maxFilesPerDay;
  
  if (realUploadCount > maxAllowed) {
    score += RISK_FACTORS.massUpload;
    reasons.push(`Quota journalier dépassé: ${realUploadCount}/${maxAllowed} fichiers`);
  }
  
  // 2. Détection de spam uniquement pour les utilisateurs premium
  if (userActivity.isPremium) {
    const fiveMinutesAgo = new Date(now.getTime() - THRESHOLDS.uploadTimeWindow * 60 * 1000);
    const recentUploads = userActivity.uploads.filter(upload => upload.timestamp > fiveMinutesAgo);
    
    console.log(`🔍 [SPAM DETECTION] Analyse premium pour utilisateur:`, {
      userId: userActivity.userId,
      recentUploads: recentUploads.length,
      threshold: THRESHOLDS.maxFilesPerWindow
    });
    
    if (recentUploads.length > THRESHOLDS.maxFilesPerWindow) {
      score += RISK_FACTORS.massUpload;
      reasons.push(`Upload en masse: ${recentUploads.length} fichiers en ${THRESHOLDS.uploadTimeWindow} minutes`);
      
      console.log(`⚠️  [SPAM DETECTION] Upload en masse détecté (premium):`, {
        userId: userActivity.userId,
        recentUploads: recentUploads.length,
        scoreAdded: RISK_FACTORS.massUpload
      });
    }
  } else {
    console.log(`ℹ️  [SPAM DETECTION] Utilisateur gratuit - détection de spam désactivée (quota journalier suffit)`);
  }
  
  return {
    score,
    uploadsToday: realUploadCount,  // Correction: utiliser realUploadCount
    maxAllowed
  };
}

/**
 * Analyser les échecs de connexion
 */
function analyzeFailedLogins(userActivity, now, reasons) {
  let score = 0;
  
  // Vérifier les échecs récents (dernières 10 minutes)
  const tenMinutesAgo = new Date(now.getTime() - THRESHOLDS.loginTimeWindow * 60 * 1000);
  const recentFailures = userActivity.failedLogins.filter(login => login.timestamp > tenMinutesAgo);
  
  if (recentFailures.length > THRESHOLDS.maxFailedLogins) {
    score += RISK_FACTORS.failedLogins;
    reasons.push(`Échecs de connexion: ${recentFailures.length} tentatives en ${THRESHOLDS.loginTimeWindow}min`);
  }
  
  // Bonus si tentatives depuis plusieurs IPs différentes
  const uniqueIPs = new Set(recentFailures.map(f => f.ip));
  if (uniqueIPs.size > 2) {
    score += RISK_FACTORS.multipleIPs;
    reasons.push(`Connexions multiples: ${uniqueIPs.size} IPs différentes`);
  }
  
  return score;
}

/**
 * Analyser les modifications de profil
 */
function analyzeProfileChanges(userActivity, now, reasons) {
  let score = 0;
  
  // Vérifier les modifications récentes (dernière heure)
  const oneHourAgo = new Date(now.getTime() - THRESHOLDS.profileTimeWindow * 60 * 1000);
  const recentChanges = userActivity.profileChanges.filter(change => change.timestamp > oneHourAgo);
  
  if (recentChanges.length > THRESHOLDS.maxProfileChanges) {
    score += RISK_FACTORS.rapidProfileChange;
    reasons.push(`Modifications rapides: ${recentChanges.length} changements de profil en 1h`);
  }
  
  return score;
}

/**
 * Analyser l'abus d'API
 */
function analyzeApiAbuse(userActivity, now, reasons) {
  let score = 0;
  
  // Vérifier les requêtes récentes (dernière minute)
  const oneMinuteAgo = new Date(now.getTime() - THRESHOLDS.apiTimeWindow * 60 * 1000);
  const recentRequests = userActivity.requests.filter(req => req.timestamp > oneMinuteAgo);
  
  if (recentRequests.length > THRESHOLDS.maxApiRequests) {
    score += RISK_FACTORS.apiAbuse;
    reasons.push(`Abus API: ${recentRequests.length} requêtes en ${THRESHOLDS.apiTimeWindow}min`);
  }
  
  // Analyser les patterns de requêtes
  const requestPattern = analyzeRequestPattern(recentRequests);
  if (requestPattern.isSuspicious) {
    score += 10;
    reasons.push(`Pattern suspect: ${requestPattern.reason}`);
  }
  
  return score;
}

/**
 * Analyser les facteurs additionnels
 */
function analyzeAdditionalFactors(userActivity, now, reasons) {
  let score = 0;
  
  // 1. Compte récent (moins de 24h)
  if (userActivity.userId && isNewAccount(userActivity.userId)) {
    score += RISK_FACTORS.newAccount;
    reasons.push('Compte récent (<24h)');
  }
  
  // 2. User-Agent suspect (bot détecté)
  if (isSuspiciousUserAgent(userActivity.userAgent)) {
    score += RISK_FACTORS.suspiciousUserAgent;
    reasons.push(`User-Agent suspect: ${userActivity.userAgent}`);
  }
  
  // 3. Activité en dehors des heures normales (2h-6h du matin)
  const hour = now.getHours();
  if (hour >= 2 && hour <= 6) {
    score += RISK_FACTORS.offHours;
    reasons.push(`Activité nocturne: ${hour}h`);
  }
  
  return score;
}

/**
 * Analyser le pattern des requêtes pour détecter les bots
 */
function analyzeRequestPattern(requests) {
  if (requests.length < 10) {
    return { isSuspicious: false };
  }
  
  // Vérifier si les requêtes sont trop régulières (bot)
  const intervals = [];
  for (let i = 1; i < requests.length; i++) {
    const interval = requests[i].timestamp - requests[i-1].timestamp;
    intervals.push(interval);
  }
  
  // Calculer la variance des intervalles
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2);
  }, 0) / intervals.length;
  
  // Si la variance est très faible, c'est suspect (requêtes trop régulières)
  if (variance < 100 && avgInterval < 1000) { // Moins de 100ms de variance, intervalle <1s
    return {
      isSuspicious: true,
      reason: `Requêtes trop régulières (variance: ${variance.toFixed(2)}ms)`
    };
  }
  
  // Vérifier si toutes les requêtes vont vers le même endpoint
  const uniqueEndpoints = new Set(requests.map(r => r.endpoint));
  if (uniqueEndpoints.size === 1 && requests.length > 20) {
    return {
      isSuspicious: true,
      reason: `Requêtes répétitives vers ${Array.from(uniqueEndpoints)[0]}`
    };
  }
  
  return { isSuspicious: false };
}

/**
 * Vérifier si c'est un compte récent
 */
function isNewAccount(userId) {
  // TODO: Implémenter la vérification avec la base de données
  // Pour l'instant, on simule
  return false;
}

/**
 * Détecter les User-Agent suspects
 */
function isSuspiciousUserAgent(userAgent) {
  if (!userAgent) return true;
  
  const suspiciousPatterns = [
    /python/i,
    /curl/i,
    /wget/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /automated/i,
    /script/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Obtenir une explication détaillée du score
 */
export async function explainRiskScore(userActivity) {
  const reasons = [];
  const now = new Date();
  
  // Recalculer avec les détails
  const riskScore = await calculateRiskScore(userActivity.userId, userActivity);
  return {
    totalScore: riskScore,
    breakdown: {
      uploads: (await analyzeUploads(userActivity, now, [])).score,
      logins: analyzeFailedLogins(userActivity, now, []),
      profile: analyzeProfileChanges(userActivity, now, []),
      api: analyzeApiAbuse(userActivity, now, []),
      additional: analyzeAdditionalFactors(userActivity, now, [])
    },
    recommendations: generateRecommendations(riskScore)
  };
}

/**
 * Générer des recommandations basées sur le score
 */
function generateRecommendations(score) {
  if (score >= 70) {
    return [
      'Bloquer temporairement l\'utilisateur',
      'Générer un signalement urgent',
      'Notifier l\'administrateur immédiatement',
      'Analyser les logs détaillés'
    ];
  } else if (score >= 40) {
    return [
      'Appliquer un rate limiting strict',
      'Générer un signalement de surveillance',
      'Surveiller de près les prochaines activités',
      'Demander une vérification d\'identité'
    ];
  } else if (score >= 20) {
    return [
      'Surveillance renforcée',
      'Logging détaillé des activités',
      'Vérification périodique'
    ];
  } else {
    return [
      'Surveillance normale',
      'Aucune action requise'
    ];
  }
}

/**
 * Mettre à jour les seuils de risque (pour l'admin)
 */
export function updateRiskThresholds(newThresholds) {
  Object.assign(THRESHOLDS, newThresholds);
  console.log('✅ Seuils de risque mis à jour:', THRESHOLDS);
}

/**
 * Obtenir la configuration actuelle
 */
export function getRiskConfiguration() {
  return {
    factors: RISK_FACTORS,
    thresholds: THRESHOLDS,
    maxScore: 100
  };
}

export default {
  calculateRiskScore,
  explainRiskScore,
  updateRiskThresholds,
  getRiskConfiguration
};
