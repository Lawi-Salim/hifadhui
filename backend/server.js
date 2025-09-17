import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
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
import contactRoutes from './routes/contact.js';

// Importation des modèles et associations depuis l'index des modèles
import { Utilisateur } from './models/index.js';


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

// Middlewares de sécurité
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
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

// Middleware de gestion des connexions DB pour Vercel
if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  app.use((req, res, next) => {
    // Fermer les connexions après chaque réponse
    res.on('finish', async () => {
      try {
        const pool = sequelize.connectionManager.pool;
        if (pool && pool.numFree() > 0) {
          // Attendre un peu puis nettoyer les connexions libres
          setTimeout(async () => {
            try {
              await pool.clear();
            } catch (error) {
              // Ignorer les erreurs de nettoyage
            }
          }, 1000);
        }
      } catch (error) {
        // Ignorer les erreurs de nettoyage
      }
    });
    next();
  });
}

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
app.use('/api/v1/contact', contactRoutes);

// Route pour les partages publics avec métadonnées Open Graph
app.get('/share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Si c'est une requête avec le paramètre view=app, servir l'app React directement
    if (req.query.view === 'app') {
      if (process.env.NODE_ENV === 'production') {
        return res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
      } else {
        return res.redirect(`http://localhost:3000/share/${token}`);
      }
    }
    
    // Importer les modèles nécessaires
    const { FileShare, File, Utilisateur } = await import('./models/index.js');
    const { Op } = await import('sequelize');
    
    // Trouver le partage actif et non expiré
    const fileShare = await FileShare.findOne({
      where: {
        token: token,
        is_active: true,
        expires_at: {
          [Op.gt]: new Date()
        }
      },
      include: [
        {
          model: File,
          as: 'file',
          include: [
            {
              model: Utilisateur,
              as: 'fileUser',
              attributes: ['username']
            }
          ]
        }
      ]
    });

    if (!fileShare) {
      // Si le partage n'existe pas, servir l'app React normale
      if (process.env.NODE_ENV === 'production') {
        return res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
      } else {
        return res.redirect(`http://localhost:3000/share/${token}`);
      }
    }

    const file = fileShare.file;
    const owner = file.fileUser;
    
    // Déterminer le type de fichier pour l'icône
    const isImage = file.mimetype?.startsWith('image/');
    const isPDF = file.mimetype === 'application/pdf';
    const fileType = isImage ? 'Image' : (isPDF ? 'PDF' : 'Fichier');
    
    // URL de base
    const baseUrl = process.env.FRONTEND_URL || 
                   (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');
    
    // Générer le HTML avec les métadonnées Open Graph
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        <!-- Métadonnées de base -->
        <title>${file.filename} - Partagé par ${owner.username}</title>
        <meta name="description" content="${fileType} partagé de manière sécurisée via Hifadhui. Propriétaire: ${owner.username}" />
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${baseUrl}/share/${token}" />
        <meta property="og:title" content="${file.filename} - Partagé par ${owner.username}" />
        <meta property="og:description" content="${fileType} partagé de manière sécurisée via Hifadhui. Propriétaire: ${owner.username}" />
        <meta property="og:image" content="${baseUrl}/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Hifadhui - Coffre-fort numérique" />
        <meta property="og:site_name" content="Hifadhui" />
        
        <!-- Twitter Card -->
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="${baseUrl}/share/${token}" />
        <meta property="twitter:title" content="${file.filename} - Partagé par ${owner.username}" />
        <meta property="twitter:description" content="${fileType} partagé de manière sécurisée via Hifadhui. Propriétaire: ${owner.username}" />
        <meta property="twitter:image" content="${baseUrl}/og-image.png" />
        <meta property="twitter:image:alt" content="Hifadhui - Coffre-fort numérique" />
        
        <!-- WhatsApp spécifique -->
        <meta property="og:locale" content="fr_FR" />
        
        <!-- Favicon -->
        <link rel="icon" href="${baseUrl}/favicon.png" />
        
        <!-- Redirection meta refresh vers l'app React -->
        <meta http-equiv="refresh" content="1;url=${process.env.NODE_ENV === 'production' ? `${baseUrl}/share/${token}?view=app` : `http://localhost:3000/share/${token}`}" />
      </head>
      <body>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; background: #f8fafc;">
          <img src="${baseUrl}/favicon.png" alt="Hifadhui" style="width: 64px; height: 64px; margin-bottom: 20px;" />
          <h1 style="color: #1e293b; margin-bottom: 10px;">${file.filename}</h1>
          <p style="color: #64748b; margin-bottom: 20px;">Partagé par ${owner.username}</p>
          <p style="color: #94a3b8; font-size: 14px;">Redirection en cours...</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées Open Graph:', error);
    
    // En cas d'erreur, servir l'app React normale
    if (process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    } else {
      res.redirect(`http://localhost:3000/share/${req.params.token}`);
    }
  }
});

// Servir les fichiers statiques du frontend React (en production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Toutes les routes non-API servent l'app React (sauf /share/:token qui est géré au-dessus)
  app.get('*', (req, res) => {
    // Éviter de capturer les routes /share/:token
    if (req.path.startsWith('/share/')) {
      return res.status(404).json({ error: 'Partage non trouvé' });
    }
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
