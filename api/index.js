// Point d'entrée Vercel avec logs détaillés
console.log(' [VERCEL] Chargement du point d\'entrée API Vercel');
console.log(' [VERCEL] Chemin actuel:', __dirname);
console.log(' [VERCEL] Redirection vers backend/server.js');

module.exports = require('../backend/server');

