/**
 * Service de nettoyage automatique des empreintes expirées
 * Utilise node-cron pour exécuter des tâches planifiées
 */

import cron from 'node-cron';
import Empreinte from '../models/Empreinte.js';
import { Op } from 'sequelize';

class EmpreinteCleanupService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Démarre tous les jobs CRON
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ [CRON] Service de nettoyage déjà démarré');
      return;
    }

    console.log('🚀 [CRON] Démarrage du service de nettoyage des empreintes...');

    // Job 1: Marquer les empreintes expirées (toutes les heures)
    const markExpiredJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔍 [CRON] Vérification des empreintes expirées...');
        const count = await Empreinte.markExpiredEmpreintes();
        if (count > 0) {
          console.log(`✅ [CRON] ${count} empreinte(s) marquée(s) comme expirée(s)`);
        } else {
          console.log('✅ [CRON] Aucune empreinte expirée trouvée');
        }
      } catch (error) {
        console.error('❌ [CRON] Erreur lors du marquage des empreintes expirées:', error);
      }
    });

    // Job 2: Supprimer les empreintes expirées depuis plus de 7 jours (tous les jours à 3h du matin)
    const deleteOldExpiredJob = cron.schedule('0 3 * * *', async () => {
      try {
        console.log('🗑️ [CRON] Suppression des empreintes expirées anciennes...');
        const count = await Empreinte.deleteOldExpiredEmpreintes(7);
        if (count > 0) {
          console.log(`✅ [CRON] ${count} empreinte(s) expirée(s) supprimée(s)`);
        } else {
          console.log('✅ [CRON] Aucune empreinte expirée ancienne à supprimer');
        }
      } catch (error) {
        console.error('❌ [CRON] Erreur lors de la suppression des empreintes expirées:', error);
      }
    });

    // Job 3: Statistiques quotidiennes (tous les jours à 8h du matin)
    const dailyStatsJob = cron.schedule('0 8 * * *', async () => {
      try {
        console.log('📊 [CRON] Génération des statistiques quotidiennes...');
        const stats = await this.generateDailyStats();
        console.log('✅ [CRON] Statistiques quotidiennes:', stats);
      } catch (error) {
        console.error('❌ [CRON] Erreur lors de la génération des statistiques:', error);
      }
    });

    this.jobs.push(markExpiredJob, deleteOldExpiredJob, dailyStatsJob);
    this.isRunning = true;

    console.log('✅ [CRON] Service de nettoyage démarré avec succès');
    console.log('📅 [CRON] Jobs planifiés:');
    console.log('   - Marquage des expirées: Toutes les heures');
    console.log('   - Suppression anciennes: Tous les jours à 3h');
    console.log('   - Statistiques: Tous les jours à 8h');
  }

  /**
   * Arrête tous les jobs CRON
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ [CRON] Service de nettoyage déjà arrêté');
      return;
    }

    console.log('🛑 [CRON] Arrêt du service de nettoyage...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('✅ [CRON] Service de nettoyage arrêté');
  }

  /**
   * Génère des statistiques quotidiennes
   */
  async generateDailyStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Empreintes générées aujourd'hui
      const generatedToday = await Empreinte.count({
        where: {
          generated_at: {
            [Op.gte]: today
          }
        }
      });

      // Empreintes utilisées aujourd'hui
      const usedToday = await Empreinte.count({
        where: {
          used_at: {
            [Op.gte]: today
          }
        }
      });

      // Empreintes expirées aujourd'hui
      const expiredToday = await Empreinte.count({
        where: {
          status: 'expire',
          expires_at: {
            [Op.gte]: today,
            [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      // Statistiques globales
      const totalDisponibles = await Empreinte.count({
        where: { status: 'disponible' }
      });

      const totalUtilisees = await Empreinte.count({
        where: { status: 'utilise' }
      });

      const totalExpirees = await Empreinte.count({
        where: { status: 'expire' }
      });

      return {
        date: today.toISOString().split('T')[0],
        today: {
          generated: generatedToday,
          used: usedToday,
          expired: expiredToday
        },
        total: {
          disponibles: totalDisponibles,
          utilisees: totalUtilisees,
          expirees: totalExpirees,
          total: totalDisponibles + totalUtilisees + totalExpirees
        }
      };
    } catch (error) {
      console.error('Erreur génération statistiques:', error);
      throw error;
    }
  }

  /**
   * Exécute manuellement le nettoyage (utile pour les tests)
   */
  async runManualCleanup() {
    console.log('🔧 [MANUAL] Exécution manuelle du nettoyage...');
    
    try {
      // Marquer les expirées
      const markedCount = await Empreinte.markExpiredEmpreintes();
      console.log(`✅ [MANUAL] ${markedCount} empreinte(s) marquée(s) comme expirée(s)`);

      // Supprimer les anciennes
      const deletedCount = await Empreinte.deleteOldExpiredEmpreintes(7);
      console.log(`✅ [MANUAL] ${deletedCount} empreinte(s) supprimée(s)`);

      // Statistiques
      const stats = await this.generateDailyStats();
      console.log('📊 [MANUAL] Statistiques:', stats);

      return {
        marked: markedCount,
        deleted: deletedCount,
        stats
      };
    } catch (error) {
      console.error('❌ [MANUAL] Erreur lors du nettoyage manuel:', error);
      throw error;
    }
  }

  /**
   * Retourne le statut du service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      jobs: [
        {
          name: 'Mark Expired',
          schedule: 'Every hour',
          description: 'Marque les empreintes expirées'
        },
        {
          name: 'Delete Old Expired',
          schedule: 'Daily at 3:00 AM',
          description: 'Supprime les empreintes expirées depuis plus de 7 jours'
        },
        {
          name: 'Daily Stats',
          schedule: 'Daily at 8:00 AM',
          description: 'Génère les statistiques quotidiennes'
        }
      ]
    };
  }
}

// Créer une instance unique (singleton)
const empreinteCleanupService = new EmpreinteCleanupService();

export default empreinteCleanupService;
