import cron from 'node-cron';
import NotificationService from './notificationService.js';
import cleanupService from './cleanupService.js';
import { addSystemError } from '../routes/admin.js';
class SchedulerService {
  
  static init() {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🕐 [SCHEDULER] Initialisation des tâches programmées...');
    }
    
    // Intercepter les warnings node-cron
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const message = args.join(' ');
      
      // Capturer les warnings node-cron
      if (message.includes('[NODE-CRON]') && message.includes('missed execution')) {
        const cronWarning = message.match(/missed execution at (.+?)!/);
        const scheduledTime = cronWarning ? cronWarning[1] : 'Unknown time';
        
        addSystemError('node_cron_missed', `Tâche cron manquée à ${scheduledTime}`, {
          severity: 'warning',
          originalMessage: message,
          possibleCause: 'Processus surchargé ou I/O bloquant'
        });
      }
      
      // Appeler la fonction console.warn originale
      originalConsoleWarn.apply(console, args);
    };
    
    // Vérification de l'espace disque toutes les heures
    cron.schedule('0 * * * *', async () => {
      const startTime = new Date();
      
      try {
        // Timeout pour éviter les blocages
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Vérification espace disque trop longue')), 30000)
        );
        
        await Promise.race([
          NotificationService.checkDiskSpace(),
          timeoutPromise
        ]);
        
        if (process.env.NODE_ENV !== 'production') {
          const duration = new Date() - startTime;
          console.log(`✅ [SCHEDULER] Espace disque vérifié en ${duration}ms`);
        }
        
      } catch (error) {
        const duration = new Date() - startTime;
        console.error(`❌ [SCHEDULER] Erreur vérification espace disque (${duration}ms):`, error.message);
        
        // Enregistrer l'erreur dans le système
        addSystemError('cron_disk_space', `Erreur vérification espace disque: ${error.message}`, {
          duration,
          severity: error.message.includes('Timeout') ? 'warning' : 'error',
          task: 'disk_space_check'
        });
        
        // Ne pas notifier les erreurs de timeout pour éviter le spam
        if (!error.message.includes('Timeout')) {
          await NotificationService.notifyCriticalError(
            'Erreur lors de la vérification de l\'espace disque',
            error.stack,
            { task: 'disk_space_check', duration }
          );
        }
      }
    });

    // Vérification des utilisateurs inactifs - Quotidien à 3h du matin
    cron.schedule('0 3 * * *', async () => {
      const startTime = new Date();
      console.log(`😴 [SCHEDULER] Vérification des utilisateurs inactifs (3 mois)... (${startTime.toISOString()})`);
      
      try {
        // Timeout pour éviter les blocages (2 minutes max)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Vérification utilisateurs inactifs trop longue')), 120000)
        );
        
        await Promise.race([
          NotificationService.notifyInactiveUsers(90), // 3 mois = 90 jours
          timeoutPromise
        ]);
        
        const duration = new Date() - startTime;
        console.log(`✅ [SCHEDULER] Utilisateurs inactifs vérifiés en ${duration}ms`);
        
      } catch (error) {
        const duration = new Date() - startTime;
        console.error(`❌ [SCHEDULER] Erreur vérification utilisateurs inactifs (${duration}ms):`, error.message);
        
        // Ne pas notifier les erreurs de timeout pour éviter le spam
        if (!error.message.includes('Timeout')) {
          await NotificationService.notifyCriticalError(
            'Erreur lors de la vérification des utilisateurs inactifs',
            error.stack,
            { task: 'inactive_users_check', duration }
          );
        }
      }
    });

    // Statistiques hebdomadaires - tous les lundis à 9h
    cron.schedule('0 9 * * 1', async () => {
      console.log('📊 [SCHEDULER] Génération des statistiques hebdomadaires...');
      try {
        await NotificationService.notifyPeriodicStats('weekly');
      } catch (error) {
        console.error('❌ [SCHEDULER] Erreur génération statistiques:', error);
        await NotificationService.notifyCriticalError(
          'Erreur lors de la génération des statistiques hebdomadaires',
          error.stack,
          { task: 'weekly_stats' }
        );
      }
    });

    // Statistiques mensuelles - le 1er de chaque mois à 10h
    cron.schedule('0 10 1 * *', async () => {
      console.log('📊 [SCHEDULER] Génération des statistiques mensuelles...');
      try {
        await NotificationService.notifyPeriodicStats('monthly');
      } catch (error) {
        console.error('❌ [SCHEDULER] Erreur génération statistiques mensuelles:', error);
        await NotificationService.notifyCriticalError(
          'Erreur lors de la génération des statistiques mensuelles',
          error.stack,
          { task: 'monthly_stats' }
        );
      }
    });

    // Maintenance préventive - tous les dimanches à 2h
    cron.schedule('0 2 * * 0', async () => {
      console.log('🔧 [SCHEDULER] Notification de maintenance préventive...');
      try {
        const nextMaintenanceDate = new Date();
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 7); // Semaine prochaine
        nextMaintenanceDate.setHours(2, 0, 0, 0); // 2h du matin
        
        await NotificationService.notifyScheduledMaintenance(
          nextMaintenanceDate,
          '2 heures',
          'Maintenance préventive hebdomadaire : nettoyage des logs, optimisation de la base de données et vérification de sécurité.'
        );
      } catch (error) {
        console.error('❌ [SCHEDULER] Erreur notification maintenance:', error);
        await NotificationService.notifyCriticalError(
          'Erreur lors de la notification de maintenance',
          error.stack,
          { task: 'maintenance_notification' }
        );
      }
    });

    // Suppression définitive des comptes expirés - tous les jours à 2h
    cron.schedule('0 2 * * *', async () => {
      const startTime = new Date();
      console.log(`🗑️ [SCHEDULER] Suppression des comptes expirés... (${startTime.toISOString()})`);
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Suppression comptes trop longue')), 300000) // 5 minutes max
        );
        
        const results = await Promise.race([
          cleanupService.deleteExpiredAccounts(),
          timeoutPromise
        ]);
        
        const duration = new Date() - startTime;
        console.log(`✅ [SCHEDULER] Comptes expirés supprimés en ${duration}ms:`, {
          deletedAccounts: results.deletedAccounts,
          errors: results.errors?.length || 0
        });
        
        // Enregistrer les erreurs s'il y en a
        if (results.errors && results.errors.length > 0) {
          addSystemError('cleanup_deletion_errors', `${results.errors.length} erreur(s) lors de la suppression de comptes`, {
            severity: 'warning',
            errors: results.errors,
            task: 'delete_expired_accounts'
          });
        }
        
      } catch (error) {
        const duration = new Date() - startTime;
        console.error(`❌ [SCHEDULER] Erreur suppression comptes expirés (${duration}ms):`, error.message);
        
        addSystemError('cron_cleanup_deletion', `Erreur suppression comptes: ${error.message}`, {
          duration,
          severity: 'error',
          task: 'delete_expired_accounts'
        });
        
        if (!error.message.includes('Timeout')) {
          await NotificationService.notifyCriticalError(
            'Erreur lors de la suppression des comptes expirés',
            error.stack,
            { task: 'delete_expired_accounts', duration }
          );
        }
      }
    });

    // Envoi de rappels de suppression - tous les jours à 9h
    cron.schedule('0 9 * * *', async () => {
      const startTime = new Date();
      console.log(`📧 [SCHEDULER] Envoi des rappels de suppression... (${startTime.toISOString()})`);
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Envoi rappels trop long')), 180000) // 3 minutes max
        );
        
        const results = await Promise.race([
          cleanupService.sendReminderEmails(),
          timeoutPromise
        ]);
        
        const duration = new Date() - startTime;
        console.log(`✅ [SCHEDULER] Rappels envoyés en ${duration}ms:`, {
          sentReminders: results.sentReminders,
          errors: results.errors?.length || 0
        });
        
        // Enregistrer les erreurs s'il y en a
        if (results.errors && results.errors.length > 0) {
          addSystemError('cleanup_reminder_errors', `${results.errors.length} erreur(s) lors de l'envoi de rappels`, {
            severity: 'warning',
            errors: results.errors,
            task: 'send_reminder_emails'
          });
        }
        
      } catch (error) {
        const duration = new Date() - startTime;
        console.error(`❌ [SCHEDULER] Erreur envoi rappels (${duration}ms):`, error.message);
        
        addSystemError('cron_cleanup_reminders', `Erreur envoi rappels: ${error.message}`, {
          duration,
          severity: 'error',
          task: 'send_reminder_emails'
        });
        
        if (!error.message.includes('Timeout')) {
          await NotificationService.notifyCriticalError(
            'Erreur lors de l\'envoi des rappels de suppression',
            error.stack,
            { task: 'send_reminder_emails', duration }
          );
        }
      }
    });

    // Nettoyage des tentatives emails non autorisés - tous les dimanches à 4h
    cron.schedule('0 4 * * 0', async () => {
      const startTime = new Date();
      console.log(`🧹 [SCHEDULER] Nettoyage tentatives emails non autorisés... (${startTime.toISOString()})`);
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Nettoyage tentatives trop long')), 60000) // 1 minute max
        );
        
        const results = await Promise.race([
          cleanupService.cleanupUnauthorizedEmailAttempts(),
          timeoutPromise
        ]);
        
        const duration = new Date() - startTime;
        console.log(`✅ [SCHEDULER] Tentatives nettoyées en ${duration}ms:`, {
          deletedAttempts: results.deletedAttempts
        });
        
      } catch (error) {
        const duration = new Date() - startTime;
        console.error(`❌ [SCHEDULER] Erreur nettoyage tentatives (${duration}ms):`, error.message);
        
        addSystemError('cron_cleanup_attempts', `Erreur nettoyage tentatives: ${error.message}`, {
          duration,
          severity: 'warning',
          task: 'cleanup_unauthorized_attempts'
        });
      }
    });

    console.log('✅ [SCHEDULER] Tâches programmées initialisées :');
    console.log('   💾 Espace disque : toutes les heures');
    console.log('   😴 Utilisateurs inactifs : tous les jours à 3h');
    console.log('   📊 Stats hebdomadaires : lundis à 9h');
    console.log('   📊 Stats mensuelles : 1er du mois à 10h');
    console.log('   🔧 Maintenance : dimanches à 2h');
    console.log('   🗑️ Suppression comptes expirés : tous les jours à 2h');
    console.log('   📧 Rappels de suppression : tous les jours à 9h');
    console.log('   🧹 Nettoyage tentatives emails : dimanches à 4h');
  }

  /**
   * Déclencher manuellement une vérification d'espace disque
   */
  static async triggerDiskSpaceCheck() {
    console.log('💾 [SCHEDULER] Vérification manuelle de l\'espace disque...');
    return await NotificationService.checkDiskSpace();
  }

  /**
   * Déclencher manuellement les statistiques
   */
  static async triggerStats(period = 'weekly') {
    console.log(`📊 [SCHEDULER] Génération manuelle des statistiques ${period}...`);
    return await NotificationService.notifyPeriodicStats(period);
  }

  /**
   * Déclencher manuellement la vérification des utilisateurs inactifs
   */
  static async triggerInactiveUsersCheck(days = 30) {
    console.log(`😴 [SCHEDULER] Vérification manuelle des utilisateurs inactifs (${days} jours)...`);
    return await NotificationService.notifyInactiveUsers(days);
  }

  /**
   * TEMPORAIRE: Générer une notification de test pour déboguer les dates
   */
  static async generateTestInactiveNotification() {
    console.log(`🧪 [TEST] Génération d'une notification de test pour les utilisateurs inactifs...`);
    return await NotificationService.notifyInactiveUsers(0.00347); // 5 minutes pour test
  }

  /**
   * Programmer une maintenance
   */
  static async scheduleMaintenance(date, duration, description) {
    console.log(`🔧 [SCHEDULER] Programmation d'une maintenance pour ${date}...`);
    return await NotificationService.notifyScheduledMaintenance(date, duration, description);
  }

  /**
   * Déclencher manuellement la suppression des comptes expirés
   */
  static async triggerDeleteExpiredAccounts() {
    console.log('🗑️ [SCHEDULER] Suppression manuelle des comptes expirés...');
    return await cleanupService.deleteExpiredAccounts();
  }

  /**
   * Déclencher manuellement l'envoi des rappels de suppression
   */
  static async triggerSendReminders() {
    console.log('📧 [SCHEDULER] Envoi manuel des rappels de suppression...');
    return await cleanupService.sendReminderEmails();
  }

  /**
   * Déclencher manuellement le nettoyage des tentatives emails
   */
  static async triggerCleanupUnauthorizedAttempts() {
    console.log('🧹 [SCHEDULER] Nettoyage manuel des tentatives emails...');
    return await cleanupService.cleanupUnauthorizedEmailAttempts();
  }

  /**
   * Déclencher toutes les tâches de nettoyage manuellement
   */
  static async triggerAllCleanupTasks() {
    console.log('🧹 [SCHEDULER] Exécution manuelle de toutes les tâches de nettoyage...');
    return await cleanupService.runAllCleanupTasks();
  }
}

export default SchedulerService;
