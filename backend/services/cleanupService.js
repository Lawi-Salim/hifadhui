import { Utilisateur, File, ActivityLog, sequelize } from '../models/index.js';
import { deleteCloudinaryFile } from '../utils/cloudinaryStructure.js';
import emailService from './emailService.js';
import { Op } from 'sequelize';

class CleanupService {
  /**
   * Supprime définitivement les comptes dont la période de grâce a expiré
   */
  async deleteExpiredAccounts() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🧹 [CLEANUP] Début du nettoyage des comptes expirés...');
      
      // Récupérer tous les comptes à supprimer définitivement
      const accountsToDelete = await Utilisateur.getAccountsToDelete();
      
      if (accountsToDelete.length === 0) {
        console.log('✅ [CLEANUP] Aucun compte à supprimer');
        await transaction.commit();
        return { deletedAccounts: 0, errors: [] };
      }
      
      console.log(`🗑️ [CLEANUP] ${accountsToDelete.length} compte(s) à supprimer définitivement`);
      
      const deletedAccounts = [];
      const errors = [];
      
      for (const user of accountsToDelete) {
        try {
          console.log(`🗑️ [CLEANUP] Suppression définitive de: ${user.email}`);
          
          // 1. Récupérer tous les fichiers de l'utilisateur
          const userFiles = await File.findAll({
            where: { owner_id: user.id },
            transaction
          });
          
          console.log(`📁 [CLEANUP] ${userFiles.length} fichier(s) trouvé(s) pour ${user.email}`);
          
          // 2. Supprimer tous les fichiers de Cloudinary
          for (const file of userFiles) {
            try {
              console.log(`🗑️ [CLOUDINARY] Suppression fichier: ${file.filename}`);
              await deleteCloudinaryFile(file.file_url, file.mimetype);
            } catch (cloudinaryError) {
              console.error(`❌ [CLOUDINARY] Erreur suppression ${file.filename}:`, cloudinaryError);
              // Continue même si la suppression Cloudinary échoue
            }
          }
          
          // 3. Supprimer toutes les données de la base (CASCADE va s'occuper des relations)
          console.log(`🗑️ [DATABASE] Suppression données utilisateur: ${user.id}`);
          
          // Les suppressions CASCADE vont automatiquement supprimer :
          // - Files (owner_id référence Utilisateur)
          // - Dossiers (owner_id référence Utilisateur)
          // - ActivityLogs (user_id référence Utilisateur)
          // - PasswordResetTokens (user_id référence Utilisateur)
          
          await user.destroy({ transaction });
          
          console.log(`✅ [CLEANUP] Utilisateur supprimé définitivement: ${user.email}`);
          
          // 4. Envoyer l'email de confirmation de suppression définitive
          try {
            await emailService.sendAccountDeletionConfirmation(user.email, {
              username: user.username,
              deletedAt: new Date(),
              filesCount: userFiles.length
            });
            console.log(`📧 [EMAIL] Email de confirmation envoyé à: ${user.email}`);
          } catch (emailError) {
            console.error('❌ [EMAIL] Erreur envoi email confirmation:', emailError);
            // Ne pas faire échouer la suppression si l'email échoue
          }
          
          deletedAccounts.push({
            email: user.email,
            username: user.username,
            filesCount: userFiles.length,
            deletedAt: new Date()
          });
          
        } catch (userError) {
          console.error(`❌ [CLEANUP] Erreur suppression ${user.email}:`, userError);
          errors.push({
            email: user.email,
            error: userError.message
          });
        }
      }
      
      // Valider la transaction
      await transaction.commit();
      
      console.log(`✅ [CLEANUP] Nettoyage terminé: ${deletedAccounts.length} compte(s) supprimé(s), ${errors.length} erreur(s)`);
      
      return {
        deletedAccounts: deletedAccounts.length,
        deletedAccountsDetails: deletedAccounts,
        errors
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [CLEANUP] Erreur générale lors du nettoyage:', error);
      throw error;
    }
  }
  
  /**
   * Envoie des emails de rappel aux comptes qui seront supprimés dans 3 jours
   */
  async sendReminderEmails() {
    try {
      console.log('📧 [REMINDER] Début envoi des emails de rappel...');
      
      // Calculer la date dans 3 jours
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      // Trouver les comptes qui seront supprimés dans 3 jours (±1 heure de marge)
      const startRange = new Date(threeDaysFromNow.getTime() - (60 * 60 * 1000)); // -1 heure
      const endRange = new Date(threeDaysFromNow.getTime() + (60 * 60 * 1000));   // +1 heure
      
      const accountsToRemind = await Utilisateur.findAll({
        where: {
          deleted_at: { [Op.ne]: null },
          deletion_scheduled_at: {
            [Op.between]: [startRange, endRange]
          }
        }
      });
      
      if (accountsToRemind.length === 0) {
        console.log('✅ [REMINDER] Aucun email de rappel à envoyer');
        return { sentReminders: 0, errors: [] };
      }
      
      console.log(`📧 [REMINDER] ${accountsToRemind.length} email(s) de rappel à envoyer`);
      
      const sentReminders = [];
      const errors = [];
      
      for (const user of accountsToRemind) {
        try {
          const daysRemaining = user.getDaysUntilDeletion();
          
          console.log(`📧 [REMINDER] Envoi rappel à: ${user.email} (${daysRemaining} jours restants)`);
          
          await emailService.sendAccountDeletionReminderEmail(
            user.email,
            user.username,
            user.deletion_scheduled_at,
            user.recovery_token,
            daysRemaining
          );
          
          sentReminders.push({
            email: user.email,
            daysRemaining,
            sentAt: new Date()
          });
          
          console.log(`✅ [REMINDER] Rappel envoyé à: ${user.email}`);
          
        } catch (emailError) {
          console.error(`❌ [REMINDER] Erreur envoi rappel à ${user.email}:`, emailError);
          errors.push({
            email: user.email,
            error: emailError.message
          });
        }
      }
      
      console.log(`✅ [REMINDER] Envoi terminé: ${sentReminders.length} rappel(s) envoyé(s), ${errors.length} erreur(s)`);
      
      return {
        sentReminders: sentReminders.length,
        sentRemindersDetails: sentReminders,
        errors
      };
      
    } catch (error) {
      console.error('❌ [REMINDER] Erreur générale lors de l\'envoi des rappels:', error);
      throw error;
    }
  }
  
  /**
   * Nettoie les tentatives d'emails non autorisés anciennes (> 30 jours)
   */
  async cleanupUnauthorizedEmailAttempts() {
    try {
      console.log('🧹 [CLEANUP] Début du nettoyage des tentatives d\'emails non autorisés...');
      
      // Supprimer les tentatives de plus de 30 jours
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const deletedAttempts = await ActivityLog.destroy({
        where: {
          action_type: 'unauthorized_domain_attempt',
          created_at: {
            [Op.lt]: cutoffDate
          }
        }
      });
      
      if (deletedAttempts > 0) {
        console.log(`🗑️ [CLEANUP] ${deletedAttempts} tentatives d'emails non autorisés supprimées (> 30 jours)`);
      } else {
        console.log('✅ [CLEANUP] Aucune tentative d\'email non autorisé à supprimer');
      }
      
      return { deletedAttempts };
      
    } catch (error) {
      console.error('❌ [CLEANUP] Erreur lors du nettoyage des tentatives d\'emails:', error);
      throw error;
    }
  }
  
  /**
   * Exécute toutes les tâches de nettoyage
   */
  async runAllCleanupTasks() {
    console.log('🧹 [CLEANUP SERVICE] Début des tâches de nettoyage...');
    
    const results = {
      timestamp: new Date(),
      deletionResults: null,
      reminderResults: null,
      cleanupResults: null,
      errors: []
    };
    
    try {
      // 1. Supprimer les comptes expirés
      results.deletionResults = await this.deleteExpiredAccounts();
    } catch (error) {
      console.error('❌ [CLEANUP SERVICE] Erreur suppression comptes:', error);
      results.errors.push({
        task: 'deleteExpiredAccounts',
        error: error.message
      });
    }
    
    try {
      // 2. Envoyer les emails de rappel
      results.reminderResults = await this.sendReminderEmails();
    } catch (error) {
      console.error('❌ [CLEANUP SERVICE] Erreur envoi rappels:', error);
      results.errors.push({
        task: 'sendReminderEmails',
        error: error.message
      });
    }
    
    try {
      // 3. Nettoyer les tentatives d'emails non autorisés
      results.cleanupResults = await this.cleanupUnauthorizedEmailAttempts();
    } catch (error) {
      console.error('❌ [CLEANUP SERVICE] Erreur nettoyage tentatives emails:', error);
      results.errors.push({
        task: 'cleanupUnauthorizedEmailAttempts',
        error: error.message
      });
    }
    
    console.log('✅ [CLEANUP SERVICE] Tâches de nettoyage terminées');
    console.log('📊 [CLEANUP SERVICE] Résultats:', {
      deletedAccounts: results.deletionResults?.deletedAccounts || 0,
      sentReminders: results.reminderResults?.sentReminders || 0,
      deletedUnauthorizedAttempts: results.cleanupResults?.deletedAttempts || 0,
      totalErrors: results.errors.length
    });
    
    return results;
  }
}

// Instance singleton
const cleanupService = new CleanupService();

export default cleanupService;
