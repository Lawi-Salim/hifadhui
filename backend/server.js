import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Serveur backend Hifadhui
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { sequelize } from './config/database.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import fileRoutes from './routes/files.js';
import certificateRoutes from './routes/certificates.js';
import dossierRoutes from './routes/dossiers.js';
import shareRoutes from './routes/shares.js';
import bulkActionsRoutes from './routes/bulkActions.js';

// Importation des modèles et associations depuis l'index des modèles
import { Utilisateur, File, FileShare } from './models/index.js';
import { Op } from 'sequelize';


const app = express();
const PORT = process.env.PORT || 5000;

// Configuration trust proxy pour express-rate-limit
app.set('trust proxy', 1);

// Logs de démarrage (diagnostic)
console.log('🟢 [BOOT] Démarrage du serveur Hifadhwi');
console.log('🟢 [BOOT] NODE_ENV =', process.env.NODE_ENV);
console.log('🟢 [BOOT] VERCEL =', process.env.VERCEL ? '1' : '0');
console.log('🟢 [BOOT] DATABASE_URL défini =', Boolean(process.env.DATABASE_URL));
console.log('🟢 [BOOT] DB_HOST =', process.env.DB_HOST || '(non défini)');

// Middlewares de sécurité avec CSP adaptée pour les partages
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://hifadhui.site"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://hifadhui.site"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Configuration CORS pour gérer les preflight requests
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hifadhui.vercel.app',
    'https://hifadhui.site',
    'https://www.hifadhui.site',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Already-Viewed'],
  preflightContinue: false,
  optionsSuccessStatus: 200
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
// En production sur Vercel, les fichiers uploadés sont stockés dans /tmp et ne sont pas persistants.
// Éviter de servir un dossier inexistant dans /var/task
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Middleware silencieux en production
if (process.env.NODE_ENV !== 'production') {
  // Logs uniquement en développement si nécessaire
  console.log(' [DEBUG] Mode développement activé');
}

// Route spéciale pour les liens de partage - servir toujours l'app React
app.get('/share/:token', async (req, res) => {
  try {
    const token = req.params.token;

    // Vérifier si c'est un bot/crawler (User-Agent) pour les métadonnées Open Graph
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|facebook|twitter|whatsapp|telegram|discord/i.test(userAgent);

    // Vérifier que le token existe et est valide
    const fileShare = await FileShare.findOne({
      where: {
        token: token,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      },
      include: [
        {
          model: File,
          as: 'file',
          include: [{ model: Utilisateur, as: 'fileUser', attributes: ['username'] }]
        },
        { model: Utilisateur, as: 'creator', attributes: ['username'] }
      ]
    });

    if (!fileShare) {
      // Token invalide - servir une page d'erreur simple
      return res.status(404).send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <title>Lien invalide - Hifadhwi</title>
</head>
<body>
    <h1>Lien de partage invalide ou expiré</h1>
    <p>Ce lien n'est plus valide ou a expiré.</p>
</body>
</html>`);
    }

    const file = fileShare.file;
    
    if (isBot) {
      // Bot/Crawler - servir HTML avec métadonnées Open Graph
      const isImage = file.mimetype?.startsWith('image/');
      const isPdf = file.filename?.toLowerCase().endsWith('.pdf');
      const imageUrl = 'https://hifadhui.site/favicon.png';
      const title = `${file.filename} - Partagé par ${file.fileUser.username}`;
      const description = `Fichier ${isPdf ? 'PDF' : isImage ? 'image' : ''} partagé de manière sécurisée via Hifadhwi. Propriétaire: ${file.fileUser.username}`;

      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="${imageUrl}" />
    <link rel="shortcut icon" type="image/png" href="${imageUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://hifadhui.site/share/${token}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="Logo Hifadhwi - Partage sécurisé de fichiers" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:site_name" content="Hifadhwi" />
    <meta property="og:locale" content="fr_FR" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:site" content="@hifadhwi" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="Logo Hifadhwi - Partage sécurisé de fichiers" />
    
    <!-- WhatsApp / Telegram -->
    <meta property="og:image:secure_url" content="${imageUrl}" />
    
    <!-- Refresh automatique vers React App -->
    <meta http-equiv="refresh" content="3;url=/#/share/${token}" />
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <img src="${imageUrl}" alt="Hifadhwi" style="width: 64px; height: 64px; margin-bottom: 20px;" />
        <h1>Fichier partagé via Hifadhwi</h1>
        <p>Ce fichier vous a été partagé par <strong>${file.fileUser.username}</strong></p>
        <p>Redirection automatique en cours...</p>
        <p><a href="/#/share/${token}">Cliquez ici si la redirection ne fonctionne pas</a></p>
    </div>
</body>
</html>`;

      return res.send(html);
    }

    // Utilisateur normal - servir l'app React directement
    const reactAppPath = path.join(__dirname, '../frontend/build/index.html');
    res.sendFile(reactAppPath);

  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées:', error);
    res.status(500).send('<h1>Erreur serveur</h1>');
  }
});


// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/files', shareRoutes); // Routes de partage sous /files pour POST /:id/share
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/dossiers', dossierRoutes);
app.use('/api/v1/share', shareRoutes); // Routes publiques pour accéder aux partages
app.use('/api/v1/bulk', bulkActionsRoutes);

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
    message: 'Hifadhwi API est opérationnelle',
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
    console.log('🔍 [INIT] Vérification de l\'existence d\'un admin...');
    const { default: bcrypt } = await import('bcryptjs');
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await Utilisateur.findOne({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ [INIT] Admin par défaut existe déjà - ID:', existingAdmin.id);
      console.log('📧 [INIT] Email admin existant:', existingAdmin.email);
      return;
    }
    
    console.log('🔨 [INIT] Création de l\'admin par défaut...');
    // Créer l'admin par défaut
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const newAdmin = await Utilisateur.create({
      username: 'Admin System',
      email: 'lawi@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('🎉 [INIT] Admin par défaut créé avec succès!');
    console.log('🆔 [INIT] ID admin créé:', newAdmin.id);
    console.log('📧 [INIT] Email: lawi@gmail.com');
    console.log('🔑 [INIT] Mot de passe: 123456');
    console.log('⚠️  [INIT] Changez le mot de passe après la première connexion');
    
  } catch (error) {
    console.error('❌ [INIT] Erreur lors de la création de l\'admin:', error.message);
    console.error('🔍 [INIT] Stack trace:', error.stack);
  }
};

// Pour Vercel, initialiser la base de données sans app.listen()
const initializeDatabase = async () => {
  try {
    console.log('⏳ [INIT] Tentative de connexion DB...');
    await sequelize.authenticate();
    console.log('✅ [INIT] Connexion à la base de données réussie');
    await createDefaultAdmin();
    console.log('✅ [INIT] Vérification/Création admin terminée');
  } catch (error) {
    console.error('❌ [INIT] Erreur d\'initialisation:', error.message);
  }
};

// Initialiser seulement en production (Vercel)
if (process.env.VERCEL) {
  console.log('🚀 [BOOT] Environnement Vercel détecté: initialisation DB sans app.listen()');
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

export default app;
