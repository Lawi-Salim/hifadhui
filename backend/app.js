import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { corsOptions } from './config/cors.js';
import routes from './routes/index.js';
import { sequelize } from './config/database.js';
import { User, Photo } from './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `.env.${env}`);
dotenv.config({ path: envPath });

console.log(`Environnement: ${env}`);
console.log(`Connexion à la base de données: ${process.env.DB_HOST}`);

// Initialisation de l'application Express
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes de l'API
app.use('/api', routes);

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  
  // Erreur de validation Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Une erreur est survenue';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Synchroniser les modèles avec la base de données
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');
    
    // Synchroniser les modèles (sans forcer la récréation des tables)
    await sequelize.sync({ alter: true });
    console.log('Modèles synchronisés avec la base de données.');
    
    return app;
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données:', error);
    process.exit(1);
  }
};

export { app, startServer };
