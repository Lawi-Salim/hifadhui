const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Logs détaillés pour Vercel
console.log('🚀 [VERCEL] Démarrage du serveur backend Hifadhui');
console.log('📍 [VERCEL] NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 [VERCEL] Variables d\'environnement disponibles:');
console.log('   - DB_HOST:', process.env.DB_HOST || '[NON DÉFINI]');
console.log('   - DB_PORT:', process.env.DB_PORT || '[NON DÉFINI]');
console.log('   - DB_NAME:', process.env.DB_NAME || '[NON DÉFINI]');
console.log('   - DB_USER:', process.env.DB_USER || '[NON DÉFINI]');
console.log('   - DB_PASSWORD:', process.env.DB_PASSWORD ? '[DÉFINI - ' + process.env.DB_PASSWORD.length + ' caractères]' : '[NON DÉFINI]');
console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Manquant');
console.log('   - CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Défini' : '❌ Manquant');
console.log('   - FRONTEND_URL:', process.env.FRONTEND_URL || '[NON DÉFINI]');

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

// Démarrage du serveur
const startServer = async () => {
  try {
    console.log('🔗 [VERCEL] Test de connexion à la base de données...');
    // Test de connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ [VERCEL] Connexion à la base de données réussie!');
    console.log('🏗️  [VERCEL] Host DB:', process.env.DB_HOST);
    console.log('🗄️  [VERCEL] Nom DB:', process.env.DB_NAME);
    
    // Vérification des modèles sans synchronisation (tables déjà créées)
    console.log('📋 [VERCEL] Vérification des modèles...');
    console.log('✅ [VERCEL] Modèles chargés - utilisation des tables existantes');
    
    // Créer l'admin par défaut si nécessaire
    console.log('👤 [VERCEL] Gestion de l\'admin par défaut...');
    await createDefaultAdmin();
    
    app.listen(PORT, () => {
      console.log('🎯 [VERCEL] ========================================');
      console.log(`🚀 [VERCEL] Serveur Hifadhui démarré avec succès!`);
      console.log(`📍 [VERCEL] Port: ${PORT}`);
      console.log(`🌍 [VERCEL] Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 [VERCEL] URL API: https://hifadhui.vercel.app/api`);
      console.log('🎯 [VERCEL] ========================================')
    });
  } catch (error) {
    console.error('💥 [VERCEL] ERREUR CRITIQUE de démarrage du serveur!');
    console.error('📋 [VERCEL] Message:', error.message);
    console.error('🔍 [VERCEL] Stack:', error.stack);
    console.error('🔧 [VERCEL] Variables env disponibles:', Object.keys(process.env).filter(key => key.startsWith('DB_')));
    process.exit(1);
  }
};

startServer();

module.exports = app;
