import { startServer } from './app.js';

let cachedApp = null;

export default async function handler(req, res) {
  if (!cachedApp) {
    cachedApp = await startServer();
  }
  return cachedApp(req, res);
}

// Le chargement des variables d'environnement est maintenant géré dans app.js

// Démarrer le serveur
const PORT = process.env.PORT || 5001; // Garder 5001 comme fallback

startServer()
  .then(app => {
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📡 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Base de données: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}\n`);
    });

    // Gestion des erreurs non capturées
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      
      server.close(() => {
        process.exit(1);
      });
    });

    // Gestion des erreurs non capturées (synchrones)
    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      
      server.close(() => {
        process.exit(1);
      });
    });

    // Gestion du signal SIGTERM (pour les arrêts propres)
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  })
  .catch(err => {
    console.error('Erreur critique lors du démarrage du serveur:', err);
    process.exit(1);
  });
