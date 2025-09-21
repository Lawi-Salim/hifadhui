#!/usr/bin/env node

/**
 * Script CRON pour le nettoyage automatique des comptes
 * 
 * Usage:
 * - Suppression définitive : node cleanup-cron.js --delete
 * - Envoi de rappels : node cleanup-cron.js --remind
 * - Toutes les tâches : node cleanup-cron.js --all
 * - Tâche par défaut (toutes) : node cleanup-cron.js
 */

import dotenv from 'dotenv';
import cleanupService from '../services/cleanupService.js';

// Charger les variables d'environnement
dotenv.config();

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--all';
  
  console.log('🚀 [CRON] Démarrage du script de nettoyage...');
  console.log('📅 [CRON] Timestamp:', new Date().toISOString());
  console.log('⚙️ [CRON] Commande:', command);
  
  try {
    let results;
    
    switch (command) {
      case '--delete':
        console.log('🗑️ [CRON] Mode: Suppression définitive uniquement');
        results = await cleanupService.deleteExpiredAccounts();
        break;
        
      case '--remind':
        console.log('📧 [CRON] Mode: Envoi de rappels uniquement');
        results = await cleanupService.sendReminderEmails();
        break;
        
      case '--all':
      default:
        console.log('🧹 [CRON] Mode: Toutes les tâches de nettoyage');
        results = await cleanupService.runAllCleanupTasks();
        break;
    }
    
    console.log('✅ [CRON] Script terminé avec succès');
    console.log('📊 [CRON] Résultats finaux:', JSON.stringify(results, null, 2));
    
    // Code de sortie 0 = succès
    process.exit(0);
    
  } catch (error) {
    console.error('❌ [CRON] Erreur fatale:', error);
    console.error('📍 [CRON] Stack trace:', error.stack);
    
    // Code de sortie 1 = erreur
    process.exit(1);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  console.log('⚠️ [CRON] Signal SIGINT reçu, arrêt du script...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('⚠️ [CRON] Signal SIGTERM reçu, arrêt du script...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [CRON] Promesse rejetée non gérée:', reason);
  console.error('📍 [CRON] Promesse:', promise);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [CRON] Exception non capturée:', error);
  console.error('📍 [CRON] Stack trace:', error.stack);
  process.exit(1);
});

// Exécuter le script
main();
