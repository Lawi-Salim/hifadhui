const app = require('../backend/server.js');

// Exécuter le script de création d'admin au démarrage en production
(async () => {
  try {
    console.log('Initialisation de l\'admin par défaut...');
    const createAdmin = require('../backend/scripts/create-admin.js');
    await createAdmin();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation admin:', error);
  }
})();

module.exports = app;
