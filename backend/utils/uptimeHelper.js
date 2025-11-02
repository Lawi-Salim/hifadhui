/**
 * Calcul intelligent de l'uptime selon l'environnement
 * - Local : utilise process.uptime() (temps depuis démarrage du serveur)
 * - Vercel : calcule depuis la date de déploiement
 */

// Timestamp de démarrage du serveur (pour environnements non-Vercel)
const SERVER_START_TIME = Date.now();

/**
 * Calcule l'uptime du serveur de manière adaptée à l'environnement
 * @returns {string} Uptime formaté (ex: "5d 12h 30m")
 */
export const calculateUptime = () => {
  let uptimeSeconds;

  if (process.env.VERCEL) {
    // Sur Vercel : calculer depuis la variable d'environnement DEPLOYMENT_TIME
    // ou depuis le timestamp de build
    const deploymentTime = process.env.DEPLOYMENT_TIME 
      ? parseInt(process.env.DEPLOYMENT_TIME) 
      : SERVER_START_TIME; // Fallback sur le start time
    
    uptimeSeconds = Math.floor((Date.now() - deploymentTime) / 1000);
  } else {
    // En local : utiliser process.uptime() (temps depuis démarrage Node.js)
    uptimeSeconds = Math.floor(process.uptime());
  }

  // Formater l'uptime
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
};

/**
 * Obtient l'uptime en secondes
 * @returns {number} Uptime en secondes
 */
export const getUptimeSeconds = () => {
  if (process.env.VERCEL) {
    const deploymentTime = process.env.DEPLOYMENT_TIME 
      ? parseInt(process.env.DEPLOYMENT_TIME) 
      : SERVER_START_TIME;
    
    return Math.floor((Date.now() - deploymentTime) / 1000);
  } else {
    return Math.floor(process.uptime());
  }
};
