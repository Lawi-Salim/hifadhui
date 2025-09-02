const app = require('../backend/server.js');
const createAdmin = require('../backend/scripts/create-admin.js');

// Exécuter le script create-admin au démarrage
createAdmin().then(() => {
  console.log('✅ Script create-admin exécuté');
}).catch(error => {
  console.error('❌ Erreur create-admin:', error);
});

module.exports = app;
