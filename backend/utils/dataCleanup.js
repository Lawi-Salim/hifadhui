/**
 * Service de nettoyage automatique des données
 * Supprime les sessions anciennes pour respecter le RGPD
 */

import { UserSession } from '../models/index.js';
import { Op } from 'sequelize';
import cron from 'node-cron';

/**
 * Supprime les sessions plus anciennes que X jours
 * @param {number} days - Nombre de jours (défaut: 90)
 * @returns {number} - Nombre de sessions supprimées
 */
export const cleanupOldSessions = async (days = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    console.log(`🧹 [CLEANUP] Suppression des sessions antérieures au ${cutoffDate.toISOString()}`);

    const deletedCount = await UserSession.destroy({
      where: {
        // Utiliser la colonne réelle en base (created_at)
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`✅ [CLEANUP] ${deletedCount} sessions supprimées (plus de ${days} jours)`);
    } else {
      console.log(`ℹ️ [CLEANUP] Aucune session ancienne à supprimer`);
    }

    return deletedCount;

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur lors du nettoyage:', error);
    return 0;
  }
};

/**
 * Supprime les sessions d'un utilisateur spécifique (sur demande RGPD)
 * @param {string} userId - ID de l'utilisateur
 * @returns {number} - Nombre de sessions supprimées
 */
export const cleanupUserSessions = async (userId) => {
  try {
    console.log(`🧹 [CLEANUP] Suppression des sessions pour l'utilisateur ${userId}`);

    const deletedCount = await UserSession.destroy({
      where: {
        userId: userId
      }
    });

    console.log(`✅ [CLEANUP] ${deletedCount} sessions supprimées pour l'utilisateur`);
    return deletedCount;

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur lors du nettoyage utilisateur:', error);
    return 0;
  }
};

/**
 * Statistiques avant nettoyage
 */
export const getCleanupStats = async () => {
  try {
    const total = await UserSession.count();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const oldSessions = await UserSession.count({
      where: {
        // Utiliser la colonne réelle en base (created_at)
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    return {
      totalSessions: total,
      oldSessions: oldSessions,
      cutoffDate: cutoffDate
    };

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur stats:', error);
    return null;
  }
};

/**
 * Démarre le nettoyage automatique programmé
 */
export const startAutomaticCleanup = () => {
  // Tous les jours à 2h du matin
  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 [CLEANUP] Démarrage du nettoyage automatique quotidien');
    
    const stats = await getCleanupStats();
    if (stats) {
      console.log(`📊 [CLEANUP] Stats avant nettoyage:`, {
        total: stats.totalSessions,
        àSupprimer: stats.oldSessions
      });
    }

    await cleanupOldSessions(90);
  });

  // Nettoyage hebdomadaire plus agressif (sessions inactives)
  cron.schedule('0 3 * * 0', async () => {
    console.log('🕐 [CLEANUP] Nettoyage hebdomadaire des sessions inactives');
    
    // Supprimer les sessions inactives de plus de 30 jours
    const deletedInactive = await UserSession.destroy({
      where: {
        isActive: false,
        sessionEnd: {
          [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    console.log(`✅ [CLEANUP] ${deletedInactive} sessions inactives supprimées`);
  });

  console.log('🤖 [CLEANUP] Nettoyage automatique programmé:');
  console.log('   📅 Quotidien: 2h00 - Sessions > 90 jours');
  console.log('   📅 Hebdomadaire: 3h00 dimanche - Sessions inactives > 30 jours');
};

/**
 * Nettoyage manuel pour les admins
 */
export const manualCleanup = async () => {
  console.log('🧹 [CLEANUP] Nettoyage manuel déclenché');
  
  const stats = await getCleanupStats();
  console.log('📊 [CLEANUP] Statistiques actuelles:', stats);
  
  const deleted = await cleanupOldSessions(90);
  
  return {
    deleted,
    stats
  };
};
