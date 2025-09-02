const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const fileRoutes = require('./routes/files');
const certificateRoutes = require('./routes/certificates');
const dossierRoutes = require('./routes/dossiers');
const shareRoutes = require('./routes/shares');

// Importation des modèles et associations depuis l'index des modèles
const { Utilisateur, ActivityLog, File, Dossier, Certificate } = require('./models');


const app = express();
const PORT = process.env.PORT || 5000;

// Configuration trust proxy pour express-rate-limit
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limite chaque IP à 500 requêtes par windowMs
});
app.use(limiter);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (certificats et uploads)
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware silencieux en production
if (process.env.NODE_ENV !== 'production') {
  // Logs uniquement en développement si nécessaire
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/files', shareRoutes); // Routes de partage sous /files
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/dossiers', dossierRoutes);
app.use('/api/v1/share', shareRoutes); // Route publique pour accéder aux fichiers partagés

// Servir les fichiers statiques du frontend React (en production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Toutes les routes non-API servent l'app React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'hifadhwi API est opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl 
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Test de connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérification des modèles sans synchronisation (tables déjà créées)
    console.log('✅ Modèles chargés - utilisation des tables existantes');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur hifadhwi démarré sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
