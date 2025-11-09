import Notification from '../models/Notification.js';
import Utilisateur from '../models/Utilisateur.js';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NotificationService {
  
  // ========================================
  // NOTIFICATIONS ADMIN - UTILISATEURS
  // ========================================
  
  /**
   * Notification lors de l'inscription d'un nouvel utilisateur
   */
  static async notifyNewUserRegistration(newUser) {
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      for (const admin of admins) {
        await Notification.create({
          type: 'user_activity',
          title: 'Nouvel utilisateur inscrit',
          message: `Un nouvel utilisateur s'est inscrit sur la plateforme : ${newUser.username} (${newUser.email})`,
          priority: 'normal',
          userId: admin.id,
          relatedEntityType: 'user',
          relatedEntityId: newUser.id,
          actionUrl: `/admin/users/${newUser.id}`,
          metadata: {
            newUserId: newUser.id,
            username: newUser.username,
            email: newUser.email,
            provider: newUser.provider,
            registrationDate: new Date()
          }
        });
      }

      // console.log(`✅ [NOTIFICATION] Admins notifiés du nouvel utilisateur: ${newUser.username}`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification nouvel utilisateur:', error);
    }
  }

  // ========================================
  // NOTIFICATIONS ADMIN - SÉCURITÉ
  // ========================================
  
  /**
   * Notification pour tentative avec domaine email non autorisé
   */
  static async notifyUnauthorizedDomainAttempt(email, domain, ipAddress, userAgent, action = 'register') {
    console.log(`🚨 [NOTIFICATION-SERVICE] Création notification domaine non autorisé:`, {
      email, domain, ipAddress, action
    });
    
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      console.log(`🚨 [NOTIFICATION-SERVICE] ${admins.length} admin(s) trouvé(s)`);

      for (const admin of admins) {
        console.log(`🚨 [NOTIFICATION-SERVICE] Création notification pour admin: ${admin.username}`);
        
        const notification = await Notification.create({
          type: 'security',
          title: 'Tentative avec domaine non autorisé',
          message: `Tentative d'${action === 'register' ? 'inscription' : action} avec un domaine email non autorisé : ${email} (domaine: ${domain}) depuis l'IP ${ipAddress}.`,
          priority: 'normal',
          userId: admin.id,
          relatedEntityType: 'security_event',
          actionUrl: '/admin/security/domains',
          metadata: {
            email,
            domain,
            ipAddress,
            userAgent,
            action,
            timestamp: new Date(),
            type: 'unauthorized_domain_attempt'
          }
        });
        
        console.log(`✅ [NOTIFICATION-SERVICE] Notification créée avec ID: ${notification.id}`);
      }

      console.log(`🚨 [SECURITY] Admins notifiés de la tentative avec domaine non autorisé: ${domain} (${email})`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification domaine non autorisé:', error);
    }
  }

  /**
   * Notification pour connexions suspectes
   */
  static async notifySuspiciousLogin(ipAddress, userAgent, failedAttempts, email = null) {
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      const severity = failedAttempts >= 5 ? 'urgent' : 'high';
      const title = failedAttempts >= 5 ? 
        'ALERTE SÉCURITÉ - Attaque par force brute détectée' : 
        'Tentatives de connexion suspectes';

      for (const admin of admins) {
        await Notification.create({
          type: 'security',
          title,
          message: `${failedAttempts} tentatives de connexion échouées détectées depuis l'IP ${ipAddress}${email ? ` pour l'email ${email}` : ''}.`,
          priority: severity,
          userId: admin.id,
          relatedEntityType: 'security_event',
          actionUrl: '/admin/security/logs',
          metadata: {
            ipAddress,
            userAgent,
            failedAttempts,
            targetEmail: email,
            timestamp: new Date(),
            type: 'failed_login_attempts'
          }
        });
      }

      console.log(`🚨 [SECURITY] Admins notifiés des tentatives suspectes: ${failedAttempts} échecs depuis ${ipAddress}`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification sécurité:', error);
    }
  }

  // ========================================
  // NOTIFICATIONS ADMIN - SYSTÈME
  // ========================================
  
  /**
   * Notification d'espace disque faible
   */
  static async notifyDiskSpaceAlert(usagePercentage, availableSpace, totalSpace) {
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      const priority = usagePercentage >= 95 ? 'urgent' : 
                      usagePercentage >= 90 ? 'high' : 'normal';

      const title = usagePercentage >= 95 ? 
        'CRITIQUE - Espace disque quasi plein' : 
        'Espace disque faible';

      for (const admin of admins) {
        await Notification.create({
          type: 'storage',
          title,
          message: `L'espace disque est utilisé à ${usagePercentage}%. Espace disponible: ${availableSpace}GB sur ${totalSpace}GB total.`,
          priority,
          userId: admin.id,
          actionUrl: '/admin/system/storage',
          metadata: {
            usagePercentage,
            availableSpace,
            totalSpace,
            usedSpace: totalSpace - availableSpace,
            timestamp: new Date()
          }
        });
      }

      console.log(`💾 [STORAGE] Admins notifiés de l'espace disque: ${usagePercentage}%`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification espace disque:', error);
    }
  }

  /**
   * Notification d'erreur critique
   */
  static async notifyCriticalError(errorMessage, errorStack, context = {}) {
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      for (const admin of admins) {
        await Notification.create({
          type: 'error',
          title: 'Erreur critique système',
          message: `Une erreur critique s'est produite: ${errorMessage}`,
          priority: 'urgent',
          userId: admin.id,
          actionUrl: '/admin/system/logs',
          metadata: {
            errorMessage,
            errorStack,
            context,
            timestamp: new Date(),
            severity: 'critical'
          }
        });
      }

      console.log(`🚨 [ERROR] Admins notifiés de l'erreur critique: ${errorMessage}`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification erreur critique:', error);
    }
  }

  /**
   * Notification de maintenance programmée
   */
  static async notifyScheduledMaintenance(maintenanceDate, duration, description) {
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      for (const admin of admins) {
        await Notification.create({
          type: 'maintenance',
          title: 'Maintenance programmée',
          message: `Maintenance programmée le ${maintenanceDate.toLocaleDateString()} à ${maintenanceDate.toLocaleTimeString()}. Durée estimée: ${duration}. ${description}`,
          priority: 'high',
          userId: admin.id,
          actionUrl: '/admin/maintenance',
          expiresAt: maintenanceDate,
          metadata: {
            maintenanceDate,
            duration,
            description,
            scheduledBy: 'system',
            timestamp: new Date()
          }
        });
      }

      console.log(`🔧 [MAINTENANCE] Admins notifiés de la maintenance: ${maintenanceDate}`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification maintenance:', error);
    }
  }

  // ========================================
  // NOTIFICATIONS ADMIN - STATISTIQUES
  // ========================================
  
  /**
   * Statistiques périodiques (hebdomadaires par défaut)
   */
  static async notifyPeriodicStats(period = 'weekly') {
    try {
      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      // Calculer les statistiques
      const stats = await this.calculateStats(period);

      for (const admin of admins) {
        await Notification.create({
          type: 'system',
          title: `Statistiques ${period === 'weekly' ? 'hebdomadaires' : 'mensuelles'}`,
          message: `Résumé d'activité: ${stats.newUsers} nouveaux utilisateurs, ${stats.totalFiles} fichiers, ${stats.totalStorage} de stockage utilisé.`,
          priority: 'low',
          userId: admin.id,
          actionUrl: '/admin/dashboard/stats',
          metadata: {
            period,
            stats,
            generatedAt: new Date()
          }
        });
      }

      console.log(`📊 [STATS] Admins notifiés des statistiques ${period}`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification statistiques:', error);
    }
  }

  /**
   * Notification utilisateurs inactifs
   */
  static async notifyInactiveUsers(inactiveDays = 30) {
    try {
      const cutoffDate = new Date();
      // Gérer les fractions de jours (pour les tests en minutes)
      if (inactiveDays < 1) {
        const inactiveMilliseconds = inactiveDays * 24 * 60 * 60 * 1000;
        cutoffDate.setTime(cutoffDate.getTime() - inactiveMilliseconds);
      } else {
        cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
      }

      console.log(`😴 [INACTIVE] Recherche utilisateurs inactifs depuis: ${cutoffDate.toISOString()}`);
      console.log(`😴 [INACTIVE] Période d'inactivité: ${inactiveDays} jours`);

      // Trouver les utilisateurs inactifs
      const inactiveUsers = await Utilisateur.findAll({
        where: {
          updatedAt: {
            [Op.lt]: cutoffDate
          },
          role: 'user' // Exclure les admins
        }
      });

      console.log(`😴 [INACTIVE] ${inactiveUsers.length} utilisateur(s) inactif(s) trouvé(s)`);

      if (inactiveUsers.length === 0) {
        console.log(`😴 [INACTIVE] Aucun utilisateur inactif trouvé`);
        return;
      }

      const admins = await Utilisateur.findAll({
        where: { role: 'admin' }
      });

      for (const admin of admins) {
        await Notification.create({
          type: 'user_activity',
          title: 'Utilisateurs inactifs détectés',
          message: inactiveDays < 1 
            ? `${inactiveUsers.length} utilisateur(s) inactif(s) depuis plus de ${Math.round(inactiveDays * 24 * 60)} minutes.`
            : `${inactiveUsers.length} utilisateur(s) inactif(s) depuis plus de ${inactiveDays} jours.`,
          priority: 'normal',
          userId: admin.id,
          actionUrl: '/admin/users/inactive',
          metadata: {
            inactiveCount: inactiveUsers.length,
            inactiveDays,
            inactiveUsers: inactiveUsers.map(u => ({
              id: u.id,
              username: u.username,
              email: u.email,
              lastActivity: u.updatedAt || u.updated_at || u.createdAt || u.created_at
            })),
            timestamp: new Date()
          }
        });
      }

      console.log(`😴 [INACTIVE] Admins notifiés de ${inactiveUsers.length} utilisateurs inactifs`);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erreur notification utilisateurs inactifs:', error);
    }
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================
  
  /**
   * Calculer les statistiques pour une période donnée
   */
  static async calculateStats(period = 'weekly') {
    const startDate = new Date();
    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    try {
      // Nouveaux utilisateurs
      const newUsers = await Utilisateur.count({
        where: {
          created_at: {
            [Op.gte]: startDate
          }
        }
      });

      // Total utilisateurs
      const totalUsers = await Utilisateur.count();

      // Statistiques basiques (à étendre avec d'autres modèles)
      return {
        newUsers,
        totalUsers,
        totalFiles: 0, // À implémenter avec le modèle File
        totalStorage: '0 MB', // À implémenter
        period,
        startDate,
        endDate: new Date()
      };
    } catch (error) {
      console.error('❌ [STATS] Erreur calcul statistiques:', error);
      return {
        newUsers: 0,
        totalUsers: 0,
        totalFiles: 0,
        totalStorage: '0 MB',
        period,
        error: error.message
      };
    }
  }

  /**
   * Vérifier l'espace disque disponible
   */
  static async checkDiskSpace() {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const stats = fs.statSync(uploadsDir);
      // Simulation - dans un vrai projet, utiliser un package comme 'check-disk-space'
      const totalSpace = 100; // GB (à remplacer par la vraie valeur)
      const usedSpace = 75;   // GB (à remplacer par la vraie valeur)
      const usagePercentage = Math.round((usedSpace / totalSpace) * 100);

      if (usagePercentage >= 85) {
        await this.notifyDiskSpaceAlert(usagePercentage, totalSpace - usedSpace, totalSpace);
      }

      return { usagePercentage, availableSpace: totalSpace - usedSpace, totalSpace };
    } catch (error) {
      console.error('❌ [DISK] Erreur vérification espace disque:', error);
      return null;
    }
  }
}

export default NotificationService;
