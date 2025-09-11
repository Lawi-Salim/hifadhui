const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

console.log('🚀 Serveur backend Hifadhui démarré');

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const fileRoutes = require('./routes/files');
const certificateRoutes = require('./routes/certificates');
const dossierRoutes = require('./routes/dossiers');
const shareRoutes = require('./routes/shares');
const bulkActionsRoutes = require('./routes/bulkActions');

// Importation des modèles et associations depuis l'index des modèles
const { Utilisateur, ActivityLog, File, Dossier, Certificate } = require('./models');


const app = express();
const PORT = process.env.PORT || 5000;

// Configuration trust proxy pour express-rate-limit
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hifadhui.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
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
app.use('/api/v1/bulk-actions', bulkActionsRoutes);
app.use('/api/v1/share', shareRoutes); // Route publique pour accéder aux fichiers partagés

// Servir les fichiers statiques du frontend React (en production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Toutes les routes non-API servent l'app React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Route de test avec logs détaillés
app.get('/api/health', (req, res) => {
  console.log('🏥 [VERCEL] Health check appelé');
  console.log('📊 [VERCEL] Statut serveur: Opérationnel');
  console.log('⏰ [VERCEL] Timestamp:', new Date().toISOString());
  
  res.json({ 
    status: 'OK', 
    message: 'hifadhwi API est opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'Connected',
    admin_created: 'Check logs for details'
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

// Fonction pour créer l'admin par défaut
const createDefaultAdmin = async () => {
  try {
    console.log('🔍 [VERCEL] Vérification de l\'existence d\'un admin...');
    const bcrypt = require('bcryptjs');
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await Utilisateur.findOne({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ [VERCEL] Admin par défaut existe déjà - ID:', existingAdmin.id);
      console.log('📧 [VERCEL] Email admin existant:', existingAdmin.email);
      return;
    }
    
    console.log('🔨 [VERCEL] Création de l\'admin par défaut...');
    // Créer l'admin par défaut
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const newAdmin = await Utilisateur.create({
      nom: 'Admin',
      prenom: 'System',
      email: 'lawi@gmail.com',
      motDePasse: hashedPassword,
      role: 'admin',
      statut: 'actif',
      dateCreation: new Date()
    });
    
    console.log('🎉 [VERCEL] Admin par défaut créé avec succès!');
    console.log('🆔 [VERCEL] ID admin créé:', newAdmin.id);
    console.log('📧 [VERCEL] Email: lawi@gmail.com');
    console.log('🔑 [VERCEL] Mot de passe: 123456');
    console.log('⚠️  [VERCEL] Changez le mot de passe après la première connexion');
    
  } catch (error) {
    console.error('❌ [VERCEL] Erreur lors de la création de l\'admin:', error.message);
    console.error('🔍 [VERCEL] Stack trace:', error.stack);
  }
};

// Pour Vercel, initialiser la base de données sans app.listen()
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Erreur d\'initialisation:', error.message);
  }
};

// Initialiser seulement en production (Vercel)
if (process.env.VERCEL) {
  initializeDatabase();
} else {
  // En développement local, démarrer le serveur normalement
  const startServer = async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données réussie');
      await createDefaultAdmin();
      
      app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      });
    } catch (error) {
      console.error('❌ Erreur de démarrage:', error.message);
      process.exit(1);
    }
  };
  
  startServer();
}

module.exports = app;
