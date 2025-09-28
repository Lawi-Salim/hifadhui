import NotificationService from '../services/notificationService.js';

// Stockage temporaire des tentatives échouées (en production, utiliser Redis)
const failedAttempts = new Map();
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

class SecurityMonitor {
  
  /**
   * Middleware pour surveiller les tentatives de connexion échouées
   */
  static trackFailedLogin(req, res, next) {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Vérifier si c'est une erreur de connexion
      if (res.statusCode === 401 && data.error && data.error.includes('incorrect')) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const email = req.body.email;
        
        SecurityMonitor.recordFailedAttempt(ip, userAgent, email);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Enregistrer une tentative de connexion échouée
   */
  static recordFailedAttempt(ip, userAgent, email = null) {
    const now = Date.now();
    const key = `${ip}:${email || 'unknown'}`;
    
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
    
    // Notifier si seuil atteint
    if (recentAttempts.length >= MAX_ATTEMPTS) {
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
}

// Nettoyer les anciennes tentatives toutes les 5 minutes
setInterval(() => {
  SecurityMonitor.cleanupOldAttempts();
}, 5 * 60 * 1000);

export default SecurityMonitor;
