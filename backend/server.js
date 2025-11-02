import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Serveur backend Hifadhui
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { sequelize } from './config/database.js';
import authRoutes from './routes/auth.js';
import { createAdmin } from './scripts/create-admin.js';
import adminRoutes from './routes/admin.js';
import fileRoutes from './routes/files.js';
import dossierRoutes from './routes/dossiers.js';
import shareRoutes from './routes/shares.js';
import bulkActionsRoutes from './routes/bulkActions.js';
import contactRoutes from './routes/contact.js';
import messagesRoutes from './routes/messages.js';
import webhooksRoutes from './routes/webhooks.js';
import notificationsRoutes from './routes/notifications.js';
import userActivityRoutes from './routes/user/activity.js';
import userProfileRoutes from './routes/user/profile.js';
import adminUserActivityRoutes from './routes/admin/userActivity.js';
import cronRoutes from './routes/cron.js';
import certificatesRoutes from './routes/certificates.js';
import verifyRoutes from './routes/verify.js';
import { startAutomaticCleanup } from './utils/dataCleanup.js';
import SchedulerService from './services/schedulerService.js';
import emailService from './services/emailService.js';

// Importation des modèles et associations depuis l'index des modèles
import passport from './config/passport.js';
const app = express();
const PORT = process.env.PORT || 5000;

// Configuration trust proxy pour express-rate-limit
app.set('trust proxy', 1);

// Logs de démarrage (diagnostic)
console.log('🟢 [BOOT] Démarrage du serveur Hifadhui');
console.log('🟢 [BOOT] NODE_ENV =', process.env.NODE_ENV);
console.log('🟢 [BOOT] VERCEL =', process.env.VERCEL ? '1' : '0');
console.log('🟢 [BOOT] DATABASE_URL défini =', Boolean(process.env.DATABASE_URL));
console.log('🟢 [BOOT] DB_HOST =', process.env.DB_HOST || '(non défini)');

// Middlewares de sécurité
console.log('🔧 [SECURITY] Configuration Helmet avec CSP désactivée temporairement pour OAuth');

// Middleware pour ajouter des headers permissifs pour OAuth
app.use((req, res, next) => {
  // Ajouter des headers permissifs pour OAuth
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: *; font-src 'self' *; connect-src 'self' *;");
  
  next();
});

app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Désactivé temporairement pour déboguer OAuth
}));

// Configuration CORS pour gérer les preflight requests
app.use(cors({
  origin: [
    'http://localhost:3000',
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

// Middleware pour gérer les données sendBeacon (text/plain)
app.use('/api/v1/user/activity', express.text({ type: 'text/plain' }));

// Configuration des sessions (nécessaire pour OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'hifadhui-oauth-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000 // 10 minutes (juste pour OAuth)
  }
}));

// Initialisation Passport
app.use(passport.initialize());
app.use(passport.session());

// Attacher les services à app.locals pour les rendre disponibles dans les routes
app.locals.emailService = emailService;
console.log('📧 [BOOT] EmailService attaché à app.locals');

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

// Servir les fichiers statiques (uploads)
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
app.use('/api/v1/admin/users', adminUserActivityRoutes); // Routes d'activité admin
app.use('/api/v1/user', userActivityRoutes); // Routes d'activité utilisateur
app.use('/api/v1/user/profile', userProfileRoutes); // Routes de profil utilisateur
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/files', shareRoutes); // Routes de partage sous /files (publiques)
app.use('/api/v1/dossiers', dossierRoutes);
app.use('/api/v1/bulk-actions', bulkActionsRoutes);
app.use('/api/v1/share', shareRoutes); // Route publique pour accéder aux fichiers partagés
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/cron', cronRoutes); // Routes cron pour keep-alive
app.use('/api/v1/certificates', certificatesRoutes); // Routes certificats d'authenticité
app.use('/api/v1/verify', verifyRoutes); // Routes de vérification publique


// Route pour les partages publics - servir l'app React directement
app.get('/share/:token', async (req, res) => {
  const token = req.params.token;
  const userAgent = req.get('User-Agent') || '';
  
  // Détecter les crawlers des réseaux sociaux
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|SkypeUriPreview|Applebot|GoogleBot/i.test(userAgent);
  
  if (isCrawler) {
    // Pour les crawlers, servir du HTML avec métadonnées Open Graph
    try {
      // Utiliser la logique de la route shares pour récupérer les données
      const { Op } = await import('sequelize');
      const { File, FileShare, Utilisateur } = await import('./models/index.js');
      
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
              },
            ]
          },
          {
            model: Utilisateur,
            as: 'creator',
            attributes: ['username']
          }
        ]
      });

      if (!fileShare) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Lien expiré - Hifadhui</title>
            <meta name="description" content="Ce lien de partage a expiré ou n'est plus valide." />
          </head>
          <body>
            <h1>Lien expiré</h1>
            <p>Ce lien de partage a expiré ou n'est plus valide.</p>
          </body>
          </html>
        `);
      }

      // Générer les métadonnées
      const isImage = fileShare.file.mimetype?.startsWith('image/');
      const isPdf = fileShare.file.filename?.toLowerCase().endsWith('.pdf');
      
      let fileType = 'fichier';
      let fileIcon = '📄';
      
      if (isImage) {
        fileType = 'image';
        fileIcon = '🖼️';
      } else if (isPdf) {
        fileType = 'document PDF';
        fileIcon = '📄';
      }

      const title = `${fileIcon} ${fileShare.file.filename} - Partagé par ${fileShare.creator?.username || 'Utilisateur'}`;
      const description = `${fileType} partagé via Hifadhui par ${fileShare.creator?.username || 'Utilisateur'}. Fichier sécurisé avec preuve de propriété.`;
      const shareUrl = `${process.env.FRONTEND_URL || 'https://hifadhui.site'}/share/${token}`;
      const imageUrl = `${process.env.FRONTEND_URL || 'https://hifadhui.site'}/favicon.png`;

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="400" />
    <meta property="og:image:height" content="400" />
    <meta property="og:site_name" content="Hifadhui" />
    <meta property="og:locale" content="fr_FR" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${shareUrl}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${imageUrl}" />
    
    <!-- Redirection automatique vers l'app React -->
    <script>
      window.location.href = "${shareUrl}";
    </script>
    
    <!-- Fallback si JavaScript est désactivé -->
    <meta http-equiv="refresh" content="0; url=${shareUrl}" />
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>${title}</h1>
        <p>${description}</p>
        <p><a href="${shareUrl}">Cliquez ici si vous n'êtes pas redirigé automatiquement</a></p>
    </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);

    } catch (error) {
      console.error('Erreur lors de la génération de la page de partage:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erreur - Hifadhui</title>
        </head>
        <body>
          <h1>Erreur</h1>
          <p>Une erreur s'est produite lors du chargement de cette page.</p>
        </body>
        </html>
      `);
    }
  } else {
    // Pour les utilisateurs normaux, servir l'app React
    if (process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    } else {
      // En développement, rediriger vers le serveur de développement React
      res.redirect(`http://localhost:3000/share/${req.params.token}`);
    }
  }
});

// Servir les fichiers statiques du frontend React (en production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Toutes les autres routes non-API servent l'app React
  app.get('*', (req, res) => {
    // Les routes /share/:token sont déjà gérées au-dessus
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
    message: 'Hifadhui API est opérationnelle',
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


// Pour Vercel, initialiser la base de données sans app.listen()
const initializeDatabase = async () => {
  try {
    console.log('⏳ [INIT] Tentative de connexion DB...');
    await sequelize.authenticate();
    console.log('✅ [INIT] Connexion à la base de données réussie');
    await createAdmin();
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
      
      // Synchroniser les nouveaux modèles (notifications)
      const { Notification } = await import('./models/index.js');
      await Notification.sync({ alter: true });
      console.log('✅ Table notifications synchronisée');
      
      await createAdmin();
      
      app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        
        // Démarrer le nettoyage automatique des données
        startAutomaticCleanup();
        
        // Initialiser les tâches programmées de notifications
        SchedulerService.init();
      });
    } catch (error) {
      console.error('❌ Erreur de démarrage:', error.message);
      process.exit(1);
    }
  };
  
  startServer();
}

export default app;
