import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import sharp from 'sharp';

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

// Middlewares de sécurité
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

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
}

// Route pour les métadonnées Open Graph des partages
app.get('/share/:token/preview', async (req, res) => {
  try {
    const token = req.params.token;
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
      return res.status(404).json({ error: 'Lien de partage invalide ou expiré' });
    }

    const file = fileShare.file;
    const isImage = file.mimetype?.startsWith('image/');
    const isPdf = file.filename?.toLowerCase().endsWith('.pdf');
    
    let imageUrl = 'https://hifadhui.site/favicon-black.png';
    if (isImage && file.file_url) {
      // Utiliser la route sécurisée pour les images dans les métadonnées Open Graph
      imageUrl = `https://hifadhui.site/share/${token}/image`;
    }

    const metadata = {
      title: `${file.filename} - Partagé par ${file.fileUser.username}`,
      description: `Fichier ${isPdf ? 'PDF' : isImage ? 'image' : ''} partagé de manière sécurisée via Hifadhwi. Propriétaire: ${file.fileUser.username}`,
      image: imageUrl,
      url: `https://hifadhui.site/share/${token}`,
      siteName: 'Hifadhwi',
      filename: file.filename,
      username: file.fileUser.username,
      isImage,
      isPdf
    };

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" href="https://hifadhui.site/favicon-black.png" />
    <link rel="shortcut icon" type="image/png" href="https://hifadhui.site/favicon-black.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    
    <!-- Métadonnées Open Graph pour WhatsApp/Facebook -->
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="${metadata.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${metadata.url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${metadata.siteName}" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metadata.title}" />
    <meta name="twitter:description" content="${metadata.description}" />
    <meta name="twitter:image" content="${metadata.image}" />
    
    <title>${metadata.title}</title>
    
    <style>
      body { 
        font-family: Arial, sans-serif; 
        text-align: center; 
        padding: 50px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        min-height: 100vh;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }
      .container {
        background: rgba(255,255,255,0.1);
        padding: 40px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      }
      h1 { margin-bottom: 20px; }
      p { margin-bottom: 30px; opacity: 0.9; }
      a { 
        color: #fff; 
        background: rgba(255,255,255,0.2);
        padding: 12px 24px;
        border-radius: 25px;
        text-decoration: none;
        font-weight: bold;
        transition: all 0.3s ease;
      }
      a:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-2px);
      }
    </style>
    <script>
      // Rediriger les navigateurs normaux vers React
      if (!/bot|crawler|spider|facebook|twitter|whatsapp|telegram|discord/i.test(navigator.userAgent)) {
        window.location.href = '${metadata.url}';
      }
    </script>
</head>
<body>
    <div class="container">
        <h1>📁 Fichier partagé</h1>
        <p>Ce fichier vous a été partagé par <strong>${metadata.username}</strong> via Hifadhwi</p>
        <p><strong>Fichier:</strong> ${metadata.filename}</p>
        <a href="${metadata.url}">Voir le fichier</a>
    </div>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route sécurisée pour servir les images partagées (empêche téléchargement direct)
app.get('/share/:token/image', async (req, res) => {
  try {
    const token = req.params.token;
    console.log(' [DEBUG] Recherche image pour token:', token);
    
    const fileShare = await FileShare.findOne({
      where: {
        token: token,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      },
      include: [{ model: File, as: 'file' }]
    });

    console.log(' [DEBUG] FileShare trouvé:', !!fileShare);
    if (fileShare) {
      console.log(' [DEBUG] Type de fichier:', fileShare.file?.mimetype);
      console.log(' [DEBUG] URL fichier:', fileShare.file?.file_url);
      console.log(' [DEBUG] Is active:', fileShare.is_active);
      console.log(' [DEBUG] Expires at:', fileShare.expires_at);
    } else {
      // Chercher sans les conditions pour voir si le token existe
      const anyShare = await FileShare.findOne({
        where: { token: token },
        include: [{ model: File, as: 'file' }]
      });
      console.log('🖼️ [DEBUG] Token existe (sans conditions):', !!anyShare);
      if (anyShare) {
        console.log('🖼️ [DEBUG] Is active (any):', anyShare.is_active);
        console.log('🖼️ [DEBUG] Expires at (any):', anyShare.expires_at);
        console.log('🖼️ [DEBUG] Current time:', new Date());
      }
    }

    if (!fileShare || !fileShare.file?.mimetype?.startsWith('image/')) {
      console.log('🖼️ [ERROR] Image non trouvée ou pas une image');
      return res.status(404).send('Image non trouvée');
    }

    const file = fileShare.file;
    let imageUrl;

    if (file.file_url.startsWith('http')) {
      imageUrl = file.file_url;
    } else if (file.file_url.startsWith('Hifadhwi/') || /^v\d+\/Hifadhwi\//.test(file.file_url)) {
      imageUrl = `https://res.cloudinary.com/ddxypgvuh/image/upload/${file.file_url}`;
    } else {
      return res.status(404).send('Image non accessible');
    }

    // Récupérer l'image depuis Cloudinary et ajouter un filigrane
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      
      // Créer le filigrane avec Sharp
      const watermarkText = `© ${file.fileUser.username} - Hifadhwi`;
      
      // Créer une image de filigrane en SVG
      const watermarkSvg = `
        <svg width="400" height="100">
          <defs>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.8"/>
            </filter>
          </defs>
          <text x="200" y="50" font-family="Arial Black" font-size="24" font-weight="bold" 
                text-anchor="middle" fill="rgba(255,255,255,0.9)" filter="url(#shadow)" 
                transform="rotate(-30 200 50)">
            ${watermarkText}
          </text>
        </svg>
      `;
      
      // Traiter l'image avec Sharp
      const processedImage = await sharp(Buffer.from(response.data))
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            gravity: 'center',
            blend: 'over'
          }
        ])
        .jpeg({ quality: 85 })
        .toBuffer();

      // Headers de sécurité
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Frame-Options': 'DENY',
        'Content-Disposition': 'inline',
      });

      // Envoyer l'image avec filigrane
      res.send(processedImage);
      
    } catch (streamError) {
      console.error('Erreur lors du traitement de l\'image:', streamError);
      res.status(404).send('Image non accessible');
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    res.status(500).send('Erreur serveur');
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
