const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de stockage local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// Configuration multer pour stockage local
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Middleware de gestion d'erreurs pour multer local
const handleUploadError = (error, req, res, next) => {
  console.log('=== ERREUR UPLOAD LOCAL ===');
  console.log('Type d\'erreur:', error.constructor.name);
  console.log('Message:', error.message);
  console.log('Stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    console.log('Erreur Multer:', error.code);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        message: 'La taille maximale autorisée est de 10MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Champ de fichier inattendu',
        message: 'Utilisez le champ "document" pour uploader'
      });
    }
  }
  
  if (error.message === 'Type de fichier non autorisé') {
    return res.status(400).json({
      error: 'Type de fichier non autorisé',
      message: 'Formats acceptés: JPG, PNG, PDF, ZIP'
    });
  }

  // Erreur générale
  console.log('Erreur non gérée:', error);
  res.status(500).json({
    error: 'Erreur lors de l\'upload',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = {
  upload,
  handleUploadError
};
