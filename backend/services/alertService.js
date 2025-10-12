import nodemailer from 'nodemailer';
import { MODERATION_RULES } from '../config/moderationRules.js';

/**
 * Service d'Alertes et Notifications
 * Gère l'envoi de notifications aux administrateurs
 */

class AlertService {
  constructor() {
    this.emailTransporter = null;
    this.notificationQueue = [];
    this.rateLimitCache = new Map(); // Cache pour éviter le spam
    
    this.initializeEmailTransporter();
  }

  /**
   * Initialiser le transporteur email
   */
  async initializeEmailTransporter() {
    try {
      if (MODERATION_RULES.advanced.integrations.email.enabled) {
        this.emailTransporter = nodemailer.createTransporter(
          MODERATION_RULES.advanced.integrations.email.smtp
        );
        
        // Tester la connexion
        await this.emailTransporter.verify();
        console.log('✅ Service email initialisé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service email:', error);
      this.emailTransporter = null;
    }
  }

  /**
   * Envoyer une alerte selon la gravité
   */
  async sendAlert(alertData) {
    try {
      const {
        severity = 'info',
        title,
        message,
        userId,
        reportId,
        evidence = {},
        metadata = {}
      } = alertData;

      // Vérifier le rate limiting pour éviter le spam
      if (!this.checkRateLimit(userId, severity)) {
        console.log(`⏳ Rate limit atteint pour ${userId}, alerte ignorée`);
        return false;
      }

      // Obtenir les canaux de notification selon la gravité
      const channels = MODERATION_RULES.notifications.channels[severity] || ['log'];
      
      const alertPayload = {
        id: this.generateAlertId(),
        timestamp: new Date().toISOString(),
        severity,
        title,
        message,
        userId,
        reportId,
        evidence,
        metadata,
        channels
      };

      // Envoyer sur chaque canal
      const results = await Promise.allSettled([
        this.sendToLog(alertPayload),
        channels.includes('dashboard') ? this.sendToDashboard(alertPayload) : null,
        channels.includes('email') ? this.sendToEmail(alertPayload) : null,
        channels.includes('sms') ? this.sendToSMS(alertPayload) : null
      ].filter(Boolean));

      // Compter les succès
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`📢 Alerte envoyée: ${successCount}/${channels.length} canaux réussis`);
      
      return successCount > 0;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi d\'alerte:', error);
      return false;
    }
  }

  /**
   * Vérifier le rate limiting des notifications
   */
  checkRateLimit(userId, severity) {
    const key = `${userId}_${severity}`;
    const now = Date.now();
    const windowMs = MODERATION_RULES.notifications.rateLimiting.timeWindowHours * 60 * 60 * 1000;
    const maxNotifications = MODERATION_RULES.notifications.rateLimiting.maxPerUser;
    
    if (!this.rateLimitCache.has(key)) {
      this.rateLimitCache.set(key, []);
    }
    
    const userNotifications = this.rateLimitCache.get(key);
    
    // Nettoyer les anciennes notifications
    const validNotifications = userNotifications.filter(time => now - time < windowMs);
    
    if (validNotifications.length >= maxNotifications) {
      return false; // Rate limit atteint
    }
    
    // Ajouter la nouvelle notification
    validNotifications.push(now);
    this.rateLimitCache.set(key, validNotifications);
    
    return true;
  }

  /**
   * Envoyer vers les logs
   */
  async sendToLog(alertPayload) {
    const logLevel = this.getLogLevel(alertPayload.severity);
    const logMessage = `[${alertPayload.severity.toUpperCase()}] ${alertPayload.title}: ${alertPayload.message}`;
    
    console[logLevel](`🚨 ${logMessage}`);
    
    // En production, utiliser un vrai système de logging (Winston, etc.)
    return true;
  }

  /**
   * Envoyer vers le dashboard (WebSocket en temps réel)
   */
  async sendToDashboard(alertPayload) {
    try {
      // TODO: Implémenter WebSocket pour notifications temps réel
      // Pour l'instant, on stocke en mémoire pour récupération via API
      
      this.notificationQueue.push({
        ...alertPayload,
        read: false,
        createdAt: new Date()
      });
      
      // Garder seulement les 100 dernières notifications
      if (this.notificationQueue.length > 100) {
        this.notificationQueue = this.notificationQueue.slice(-100);
      }
      
      console.log(`📊 Notification ajoutée au dashboard: ${alertPayload.title}`);
      return true;
      
    } catch (error) {
      console.error('❌ Erreur dashboard notification:', error);
      return false;
    }
  }

  /**
   * Envoyer par email
   */
  async sendToEmail(alertPayload) {
    try {
      if (!this.emailTransporter) {
        console.log('📧 Service email non configuré, notification ignorée');
        return false;
      }

      const template = MODERATION_RULES.notifications.templates.autoReport;
      const adminEmails = MODERATION_RULES.advanced.integrations.email.adminEmails;
      
      const subject = template.subject
        .replace('{severity}', alertPayload.severity.toUpperCase())
        .replace('{userId}', alertPayload.userId || 'Inconnu');
        
      const body = this.generateEmailBody(alertPayload, template);
      
      const mailOptions = {
        from: MODERATION_RULES.advanced.integrations.email.from,
        to: adminEmails.join(', '),
        subject: subject,
        html: body,
        priority: alertPayload.severity === 'critical' ? 'high' : 'normal'
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`📧 Email envoyé à ${adminEmails.length} administrateurs`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Générer le corps de l'email
   */
  generateEmailBody(alertPayload, template) {
    const riskScore = alertPayload.evidence?.riskScore || 0;
    const timestamp = new Date(alertPayload.timestamp).toLocaleString('fr-FR');
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${this.getSeverityColor(alertPayload.severity)}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin: 0;">🚨 Alerte Hifadhui - ${alertPayload.severity.toUpperCase()}</h2>
            </div>
            
            <h3>${alertPayload.title}</h3>
            <p><strong>Message:</strong> ${alertPayload.message}</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4>Détails:</h4>
              <ul>
                <li><strong>Utilisateur:</strong> ${alertPayload.userId || 'Système'}</li>
                <li><strong>Score de risque:</strong> ${riskScore}/100</li>
                <li><strong>Timestamp:</strong> ${timestamp}</li>
                ${alertPayload.reportId ? `<li><strong>Signalement ID:</strong> ${alertPayload.reportId}</li>` : ''}
              </ul>
            </div>
            
            ${alertPayload.evidence && Object.keys(alertPayload.evidence).length > 0 ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4>Preuves:</h4>
                <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(alertPayload.evidence, null, 2)}</pre>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
              <p>Cette alerte a été générée automatiquement par le système de modération Hifadhui.</p>
              <p><a href="${process.env.FRONTEND_URL}/admin/reports" style="color: #007bff;">Voir les signalements</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Envoyer par SMS (placeholder)
   */
  async sendToSMS(alertPayload) {
    try {
      // TODO: Implémenter service SMS (Twilio, etc.)
      console.log(`📱 SMS notification: ${alertPayload.title} (${alertPayload.severity})`);
      return true;
    } catch (error) {
      console.error('❌ Erreur SMS:', error);
      return false;
    }
  }

  /**
   * Obtenir le niveau de log selon la gravité
   */
  getLogLevel(severity) {
    const levels = {
      info: 'info',
      warning: 'warn',
      critical: 'error',
      emergency: 'error'
    };
    return levels[severity] || 'info';
  }

  /**
   * Obtenir la couleur selon la gravité
   */
  getSeverityColor(severity) {
    const colors = {
      info: '#17a2b8',
      warning: '#ffc107',
      critical: '#dc3545',
      emergency: '#6f42c1'
    };
    return colors[severity] || '#6c757d';
  }

  /**
   * Générer un ID unique pour l'alerte
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir les notifications du dashboard
   */
  getDashboardNotifications(limit = 50) {
    return this.notificationQueue
      .slice(-limit)
      .reverse()
      .map(notification => ({
        ...notification,
        timeAgo: this.getTimeAgo(notification.createdAt)
      }));
  }

  /**
   * Marquer une notification comme lue
   */
  markNotificationAsRead(alertId) {
    const notification = this.notificationQueue.find(n => n.id === alertId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Calculer le temps écoulé
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return 'À l\'instant';
  }

  /**
   * Nettoyer le cache de rate limiting
   */
  cleanupRateLimit() {
    const now = Date.now();
    const windowMs = MODERATION_RULES.notifications.rateLimiting.timeWindowHours * 60 * 60 * 1000;
    
    for (const [key, notifications] of this.rateLimitCache.entries()) {
      const validNotifications = notifications.filter(time => now - time < windowMs);
      if (validNotifications.length === 0) {
        this.rateLimitCache.delete(key);
      } else {
        this.rateLimitCache.set(key, validNotifications);
      }
    }
  }

  /**
   * Obtenir les statistiques des alertes
   */
  getAlertStats() {
    const last24h = this.notificationQueue.filter(
      n => Date.now() - n.createdAt.getTime() < 24 * 60 * 60 * 1000
    );

    const stats = {
      total: this.notificationQueue.length,
      last24h: last24h.length,
      unread: this.notificationQueue.filter(n => !n.read).length,
      bySeverity: {}
    };

    // Compter par gravité
    last24h.forEach(notification => {
      const severity = notification.severity;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });

    return stats;
  }
}

// Créer une instance singleton
export const alertService = new AlertService();

// Nettoyer le cache toutes les heures
setInterval(() => {
  alertService.cleanupRateLimit();
}, 60 * 60 * 1000);

export default alertService;
