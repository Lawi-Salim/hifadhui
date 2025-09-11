import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { getUserFileConfig } from '../utils/cloudinaryStructure.js';

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return getUserFileConfig(req.user, file);
  }
});

// Configuration multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    console.log('=== VALIDATION FICHIER ===');
    console.log('Nom du fichier:', file.originalname);
    console.log('Type MIME:', file.mimetype);
    console.log('Taille:', file.size);
    console.log('Buffer:', file.buffer ? 'Présent' : 'Absent');
    console.log('Stream:', file.stream ? 'Présent' : 'Absent');
    
    // Types de fichiers autorisés
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ Type de fichier accepté');
      cb(null, true);
    } else {
      console.log('❌ Type de fichier refusé:', file.mimetype);
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Middleware de gestion d'erreurs pour multer
const handleUploadError = (error, req, res, next) => {
  console.log('=== ERREUR UPLOAD MIDDLEWARE ===');
  console.log('Type d\'erreur:', error.constructor.name);
  console.log('Message:', error.message);
  console.log('Stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    console.log('Erreur Multer:', error.code);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        message: 'La taille maximale autorisée est de 5MB'
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
      message: 'Formats acceptés : JPG, PNG, PDF'
    });
  }

  // Erreur Cloudinary ou autre
  console.log('Erreur non gérée:', error);
  res.status(500).json({
    error: 'Erreur lors de l\'upload',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

export { upload, handleUploadError };
