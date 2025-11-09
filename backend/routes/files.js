import express from 'express';
import { Op } from 'sequelize';
import { File, Dossier, ActivityLog, Utilisateur } from '../models/index.js';
import Empreinte from '../models/Empreinte.js';
import { sequelize } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import uploadLocal from '../middleware/upload-local.js';
import { behaviorMonitor } from '../middleware/behaviorMonitor.js';
import { checkUploadQuota, getQuotaInfo } from '../middleware/uploadQuota.js';
import crypto from 'crypto';
import { deleteCloudinaryFile } from '../utils/cloudinaryStructure.js';
import { body, validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Route pour récupérer les informations de quota
router.get('/quota', authenticateToken, getQuotaInfo);

// ========================================
// GET /api/v1/files/by-empreinte/:hash
// Récupérer les détails d'un fichier via le hash de l'empreinte (PUBLIC)
// ========================================
router.get('/by-empreinte/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    console.log(`🔍 [FILE BY EMPREINTE] Recherche fichier avec hash: ${hash}`);

    // Trouver l'empreinte
    const empreinte = await Empreinte.findOne({
      where: { hash_pregenere: hash }
    });

    if (!empreinte) {
      return res.status(404).json({
        success: false,
        message: 'Empreinte introuvable'
      });
    }

    // Vérifier si l'empreinte est associée à un fichier
    if (!empreinte.file_id) {
      return res.status(404).json({
        success: false,
        message: 'Aucun fichier associé à cette empreinte'
      });
    }

    // Récupérer le fichier avec ses relations
    const file = await File.findByPk(empreinte.file_id, {
      include: [
        {
          model: Utilisateur,
          as: 'fileUser',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Dossier,
          as: 'fileDossier',
          required: false
        }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier introuvable'
      });
    }

    // Calculer le chemin complet du dossier
    let fullPath = 'Racine';
    if (file.fileDossier) {
      fullPath = await file.fileDossier.getFullPath();
    }

    console.log(`✅ [FILE BY EMPREINTE] Fichier trouvé: ${file.filename}`);

    res.json({
      success: true,
      data: {
        file: {
          id: file.id,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          hash: file.hash,
          signature: file.signature,
          date_upload: file.date_upload,
          file_url: file.file_url,
          dossier: file.fileDossier ? {
            id: file.fileDossier.id,
            nom: file.fileDossier.name_original || file.fileDossier.name,
            fullPath: fullPath
          } : null,
          owner: file.fileUser.username
        },
        empreinte: {
          productId: empreinte.product_id,
          hash: empreinte.hash_pregenere,
          signature: empreinte.signature_pregeneree,
          generatedAt: empreinte.generated_at,
          usedAt: empreinte.used_at
        }
      }
    });

  } catch (error) {
    console.error('❌ [FILE BY EMPREINTE] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fichier',
      error: error.message
    });
  }
});

// Fonction pour corriger l'encodage des caractères spéciaux français mal encodés
const fixEncoding = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Mapping des caractères mal encodés vers les caractères corrects
  const encodingMap = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã§': 'ç',
    'Ã´': 'ô',
    'Ã¢': 'â',
    'Ã®': 'î',
    'Ã¯': 'ï',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã«': 'ë',
    'Ã¶': 'ö',
    'Ã¼': 'ü',
    'Ã±': 'ñ',
    'Ã': 'À',
    'Ã‰': 'É',
    'Ã‡': 'Ç',
    'Ã"': 'Ô',
    'Ã‚': 'Â',
    'ÃŽ': 'Î',
    'Ã™': 'Ù',
    'Ã›': 'Û',
    'Ã‹': 'Ë',
    'Ã–': 'Ö',
    'Ãœ': 'Ü'
  };
  
  let correctedText = text;
  
  // Remplacer tous les caractères mal encodés
  Object.keys(encodingMap).forEach(malformed => {
    const regex = new RegExp(malformed, 'g');
    correctedText = correctedText.replace(regex, encodingMap[malformed]);
  });
  
  return correctedText;
};

// Fonction pour créer un slug à partir d'un nom
const createSlug = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // D'abord corriger l'encodage
  let correctedText = fixEncoding(text);
  
  const accentMap = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ÿ': 'y',
    'ñ': 'n', 'ç': 'c',
    'œ': 'oe', 'æ': 'ae',
    'Œ': 'OE', 'Æ': 'AE',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'Ý': 'Y', 'Ÿ': 'Y',
    'Ñ': 'N', 'Ç': 'C'
  };
  
  // Garder les majuscules, supprimer seulement les accents et remplacer espaces par tirets
  return correctedText
    .split('').map(char => accentMap[char] || char).join('')
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/[^a-zA-Z0-9\-_]+/g, '') // Supprimer caractères spéciaux sauf tirets et underscores
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .replace(/^-+|-+$/g, ''); // Supprimer tirets en début/fin
};

// Fonction pour traiter un fichier unique (création en BDD)
const processSingleFile = async (fileData, user, req, dossierId = null, options = { logActivity: true, empreinte: null }) => {
  const { originalname, path: filePath, size, mimetype } = fileData;
  
  // Si aucun dossier spécifié, utiliser le dossier système par défaut
  if (!dossierId) {
    const systemRoot = await Dossier.getSystemRoot();
    dossierId = systemRoot.id;
  }
  
  // Extraire le chemin Cloudinary relatif depuis l'URL complète
  let file_url;
  
  if (filePath.includes('cloudinary.com')) {
    // URL Cloudinary complète, extraire le public_id
    const uploadIndex = filePath.indexOf('/upload/');
    if (uploadIndex !== -1) {
      file_url = filePath.substring(uploadIndex + 8);
    }
  } else {
    // Ne devrait pas arriver car tous les fichiers passent par Cloudinary maintenant
    throw new Error('Fichier non uploadé sur Cloudinary');
  }
  

  // Utiliser l'empreinte pré-générée si fournie, sinon générer hash/signature
  let fileHash, signature, empreinteId = null;
  
  if (options.empreinte) {
    // Utiliser les données de l'empreinte pré-générée
    fileHash = options.empreinte.hash_pregenere;
    signature = options.empreinte.signature_pregeneree;
    empreinteId = options.empreinte.id;
    
    console.log(`🔖 [UPLOAD] Utilisation empreinte pré-générée: ${options.empreinte.product_id}`);
  } else {
    // Générer hash et signature comme avant (ancien système)
    const timestamp = Date.now();
    fileHash = crypto.createHash('sha256').update(filePath + timestamp).digest('hex');
    const signatureData = `${originalname}-${user.id}-${timestamp}`;
    signature = crypto.createHash('sha256').update(signatureData).digest('hex');
    
    console.log('⚠️ [UPLOAD] Aucune empreinte disponible - Génération hash/signature temporaire');
  }

  const file = await File.create({
    dossier_id: dossierId,
    filename: originalname,
    file_url,
    mimetype,
    size: size,
    hash: fileHash,
    signature: signature,
    empreinte_id: empreinteId,
    owner_id: user.id,
    version: 1
  });
  
  // Si une empreinte a été utilisée, la marquer comme utilisée
  if (options.empreinte) {
    await Empreinte.markAsUsed(options.empreinte.id, file.id);
    console.log(`✅ [UPLOAD] Empreinte ${options.empreinte.product_id} associée au fichier ${file.id}`);
  }


  let action_type = 'FILE_UPLOAD';
  if (file.mimetype.startsWith('image/')) {
    action_type = 'IMAGE_UPLOAD';
  } else if (file.mimetype === 'application/pdf') {
    action_type = 'PDF_UPLOAD';
  } else if (file.mimetype === 'application/zip') {
    action_type = 'ZIP_UPLOAD';
  }

  if (options.logActivity) {
    await ActivityLog.create({
      userId: user.id,
      actionType: action_type,
      details: { fileId: file.id, fileName: file.filename, dossierId: file.dossier_id }
    });
  }

  return file;
};

// @route   GET /api/v1/files/stats
// @desc    Obtenir les statistiques sur les fichiers de l'utilisateur
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalFiles = await File.count({
      where: { owner_id: req.user.id, is_latest: true },
    });

    res.json({ totalFiles });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques:', err.message);
    res.status(500).send('Erreur du serveur');
  }
});

// Route pour uploader un fichier (images/PDFs directement sur Cloudinary)
router.post('/upload', authenticateToken, checkUploadQuota, behaviorMonitor, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { mimetype, path: filePath, buffer } = req.file;
    const isZip = mimetype === 'application/zip';

    if (isZip) {
      return res.status(400).json({ 
        error: 'Les fichiers ZIP ne sont pas supportés sur cette route',
        message: 'Utilisez la route /upload-zip pour les archives'
      });
    }

    // Vérifier les empreintes disponibles
    console.log(`🔍 [UPLOAD] Vérification empreintes disponibles pour user ${req.user.id}`);
    const empreintesDisponibles = await Empreinte.getAvailableEmpreintes(req.user.id, 1);
    
    if (empreintesDisponibles.length === 0) {
      console.log('⚠️ [UPLOAD] Aucune empreinte disponible - Upload refusé');
      return res.status(400).json({
        error: 'Aucune empreinte disponible',
        message: 'Vous devez générer des empreintes avant d\'uploader des fichiers',
        code: 'NO_EMPREINTE_AVAILABLE'
      });
    }

    // Utiliser la première empreinte disponible
    const empreinte = empreintesDisponibles[0];
    console.log(`✅ [UPLOAD] Empreinte disponible trouvée: ${empreinte.product_id}`);

    // Fichier individuel - traiter directement avec l'empreinte
    const { dossier_id } = req.body;
    const file = await processSingleFile(req.file, req.user, req, dossier_id, { 
      logActivity: true, 
      empreinte 
    });
    
    res.status(201).json({
      message: 'Fichier uploadé avec succès',
      file: {
        id: file.id,
        filename: file.filename,
        hash: file.hash,
        signature: file.signature,
        product_id: empreinte.product_id,
        empreinte_id: file.empreinte_id,
        date_upload: file.date_upload,
        version: file.version
      }
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({
      error: "Erreur lors de l'upload du fichier",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Route pour obtenir la liste des fichiers dans un ZIP
router.post('/zip-preview', authenticateToken, uploadLocal.upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { mimetype, path: filePath, buffer } = req.file;
    const isZip = mimetype === 'application/zip' || mimetype === 'application/x-zip-compressed';

    if (!isZip) {
      return res.status(400).json({ 
        error: 'Seuls les fichiers ZIP sont acceptés'
      });
    }

    // Lire le contenu du ZIP (mémoire en prod, disque en dev)
    const zipData = buffer ? buffer : fs.readFileSync(filePath);
    const zip = new AdmZip(zipData);
    const zipEntries = zip.getEntries();
    const fileList = [];

    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory) continue;

      const entryName = zipEntry.entryName;
      const extension = path.extname(entryName).toLowerCase();
      
      // Filtrer seulement les types supportés
      if (['.pdf', '.jpg', '.jpeg', '.png'].includes(extension)) {
        fileList.push({
          name: path.basename(entryName),
          path: entryName,
          size: zipEntry.header.size,
          type: extension
        });
      }
    }

    // Supprimer le fichier temporaire uniquement en dev
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ files: fileList });

  } catch (error) {
    console.error('Erreur preview ZIP:', error);
    res.status(500).json({
      error: "Erreur lors de l'analyse du fichier ZIP"
    });
  }
});

// Route spécifique pour uploader des fichiers ZIP
router.post('/upload-zip', authenticateToken, checkUploadQuota, behaviorMonitor, uploadLocal.upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { mimetype, path: filePath } = req.file;
    const isZip = mimetype === 'application/zip' || mimetype === 'application/x-zip-compressed';

    if (!isZip) {
      return res.status(400).json({ 
        error: 'Seuls les fichiers ZIP sont acceptés sur cette route',
        message: 'Utilisez la route /upload pour les autres fichiers'
      });
    }

    // Lire le fichier ZIP pour compter les fichiers valides
    const zipData = req.file.buffer ? req.file.buffer : fs.readFileSync(filePath);
    const zip = new AdmZip(zipData);
    const zipEntries = zip.getEntries();
    
    // Compter les fichiers valides (images et PDFs)
    let validFileCount = 0;
    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory) continue;
      const extension = path.extname(zipEntry.entryName).toLowerCase();
      if (['.pdf', '.jpg', '.jpeg', '.png'].includes(extension)) {
        validFileCount++;
      }
    }
    
    console.log(`🔍 [UPLOAD-ZIP] ${validFileCount} fichier(s) valide(s) détecté(s) dans le ZIP`);
    
    // Vérifier qu'il y a assez d'empreintes disponibles
    const empreintesDisponibles = await Empreinte.getAvailableEmpreintes(req.user.id, validFileCount);
    
    if (empreintesDisponibles.length < validFileCount) {
      console.log(`⚠️ [UPLOAD-ZIP] Empreintes insuffisantes: ${empreintesDisponibles.length}/${validFileCount}`);
      return res.status(400).json({
        error: 'Empreintes insuffisantes',
        message: `Le ZIP contient ${validFileCount} fichier(s) mais vous n'avez que ${empreintesDisponibles.length} empreinte(s) disponible(s)`,
        required: validFileCount,
        available: empreintesDisponibles.length,
        code: 'INSUFFICIENT_EMPREINTES'
      });
    }
    
    console.log(`✅ [UPLOAD-ZIP] ${empreintesDisponibles.length} empreinte(s) disponible(s) - Upload autorisé`);

    // Créer un dossier basé sur le nom du ZIP dans le dossier système
    const systemRoot = await Dossier.getSystemRoot();
    const originalDossierName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const dossierName = createSlug(originalDossierName);
    const [newDossier, created] = await Dossier.findOrCreate({
      where: { name: dossierName, owner_id: req.user.id, parent_id: systemRoot.id },
      defaults: { name: dossierName, name_original: fixEncoding(originalDossierName), owner_id: req.user.id, parent_id: systemRoot.id },
    });

    const processedFiles = [];
    const uploadsDir = filePath ? path.dirname(filePath) : '/tmp';
    let extractedImageCount = 0;
    let extractedPdfCount = 0;
    let empreinteIndex = 0;

    // Traitement ZIP normal sans streaming

      for (const zipEntry of zipEntries) {
        if (zipEntry.isDirectory) continue;

        const entryName = zipEntry.entryName;
        const fileData = zipEntry.getData();
        const newFileName = `${Date.now()}-${path.basename(entryName)}`;
        // Pas d'écriture disque en production: on streame directement vers Cloudinary

        const extension = path.extname(entryName).toLowerCase();
        let fileMimeType;

        switch (extension) {
          case '.pdf':
            fileMimeType = 'application/pdf';
            extractedPdfCount++;
            break;
          case '.jpg':
          case '.jpeg':
            fileMimeType = 'image/jpeg';
            extractedImageCount++;
            break;
          case '.png':
            fileMimeType = 'image/png';
            extractedImageCount++;
            break;
          default:
            console.log(`Type non supporté ignoré : ${entryName}`);
            continue; // On ignore les autres types de fichiers
        }

        // Au lieu d'écrire localement, uploader directement sur Cloudinary
        const { getFileType, generateCloudinaryPath, getUserFileFolder } = await import('../utils/cloudinaryStructure.js');
        
        const fileType = getFileType(fileMimeType);
        const cloudinaryPath = generateCloudinaryPath(entryName, req.user.username, fileType);
        const folderPath = getUserFileFolder(req.user, fileType);
        
        // Créer un stream à partir du buffer
        const { Readable } = await import('stream');
        const stream = Readable.from(fileData);
        
        // Upload via stream avec timeout plus long
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({
            folder: folderPath,
            public_id: cloudinaryPath,
            resource_type: fileType === 'images' ? 'image' : 'raw',
            timeout: 120000 // 2 minutes timeout
          }, (error, result) => {
            if (error) {
              console.error('Erreur upload Cloudinary:', error);
              reject(error);
            } else {
              resolve(result);
            }
          });
          
          stream.pipe(uploadStream);
        });

        const fileDataObject = {
          originalname: path.basename(entryName),
          path: cloudinaryResult.secure_url,
          size: fileData.length,
          mimetype: fileMimeType
        };

        // Utiliser l'empreinte correspondante
        const currentEmpreinte = empreintesDisponibles[empreinteIndex];
        empreinteIndex++;
        
        console.log(`🔖 [UPLOAD-ZIP] Fichier ${empreinteIndex}/${validFileCount} - Empreinte: ${currentEmpreinte.product_id}`);

        // Traiter le fichier avec l'empreinte
        const processedFile = await processSingleFile(fileDataObject, req.user, req, newDossier.id, { 
          logActivity: false,
          empreinte: currentEmpreinte
        });
        processedFiles.push(processedFile);
      }

    // Supprimer le fichier ZIP original uniquement si présent (dev)
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Enregistrer une seule activité pour l'ensemble du ZIP
    await ActivityLog.create({
      userId: req.user.id,
      actionType: 'ZIP_UPLOAD',
      details: {
        fileName: req.file.originalname,
        dossierId: newDossier.id,
        dossierName: newDossier.name,
        extractedFileCount: processedFiles.length,
        extractedImageCount,
        extractedPdfCount
      }
    });

    res.status(201).json({
      message: `Dossier '${dossierName}' ${created ? 'créé' : 'mis à jour'} et ${processedFiles.length} fichiers uploadés avec succès.`,
      dossier: newDossier,
      files: processedFiles
    });

  } catch (error) {
    console.error('Erreur upload ZIP:', error);
    res.status(500).json({
      error: "Erreur lors de l'upload du fichier ZIP",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Middleware de gestion d'erreurs pour multer
router.use(handleUploadError);

// Route pour lister les fichiers de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Gérer les paramètres de pagination avec différents formats
    let page = req.query.page || req.query['page[page]'] || 1;
    let limit = req.query.limit || req.query['page[limit]'] || 10;
    const { type, dossier_id } = req.query;
    
    // Convertir en nombres et valider
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    
    // Valeurs par défaut si conversion échoue
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Limiter pour éviter les surcharges
    
    const offset = (page - 1) * limit;
    
    const whereClause = { owner_id: req.user.id, is_latest: true };

    if (type === 'image') {
      whereClause.mimetype = { [Op.like]: 'image/%' };
    } else if (type === 'pdf') {
      whereClause.mimetype = 'application/pdf';
    } else if (!type) {
      // Par défaut, exclure les images si aucun type n'est spécifié
      whereClause.mimetype = { [Op.notLike]: 'image/%' };
    }

    // Filtrer par dossier si spécifié
    if (dossier_id !== undefined) {
      if (dossier_id === 'null') {
        whereClause.dossier_id = null;
      } else if (dossier_id === 'system_root') {
        // Récupérer les fichiers du dossier système racine
        const systemRoot = await Dossier.getSystemRoot();
        whereClause.dossier_id = systemRoot.id;
      } else {
        whereClause.dossier_id = dossier_id;
      }
    }

    const { count, rows: files } = await File.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Dossier,
          as: 'fileDossier',
          required: false
        },
        {
          model: Empreinte,
          as: 'empreinte',
          attributes: ['product_id', 'status'],
          required: false
        }
      ],
      order: [['date_upload', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Pour chaque fichier, calculer le chemin complet du dossier
    const filesWithPaths = await Promise.all(
      files.map(async (file) => {
        // Calculer le chemin complet du dossier
        let fullPath = 'Racine';
        if (file.fileDossier) {
          fullPath = await file.fileDossier.getFullPath();
        }
        
        const fileData = file.toJSON();
        return {
          ...fileData,
          dossier: fileData.fileDossier ? {
            ...fileData.fileDossier,
            fullPath: fullPath
          } : null
        };
      })
    );

    res.json({
      files: filesWithPaths,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur liste fichiers:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des fichiers'
    });
  }
});

// Route pour obtenir un fichier spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      where: { 
        id: req.params.id,
        owner_id: req.user.id
      },
      include: [{
        model: Dossier,
        as: 'fileDossier',
        attributes: ['id', 'name', 'name_original']
      }]
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // Calculer le chemin complet du dossier
    let fullPath = 'Racine';
    if (file.fileDossier) {
      fullPath = await file.fileDossier.getFullPath();
    }

    const fileData = file.toJSON();
    res.json({ 
      file: {
        ...fileData,
        dossier: fileData.fileDossier ? {
          ...fileData.fileDossier,
          fullPath: fullPath
        } : null
      }
    });

  } catch (error) {
    console.error('Erreur récupération fichier:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du fichier'
    });
  }
});

// Route pour afficher une image ou PDF
router.get('/:id/view', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      where: { 
        id: req.params.id,
        owner_id: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // Vérifier que c'est une image ou un PDF
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Ce fichier n\'est pas une image ou un PDF'
      });
    }

    // Pour les PDFs, nettoyer l'URL si elle a une double extension
    let fileUrl = file.file_url;
    if (file.mimetype === 'application/pdf' && fileUrl.endsWith('.pdf.pdf')) {
      fileUrl = fileUrl.replace('.pdf.pdf', '.pdf');
    }

    // Rediriger vers l'URL Cloudinary
    res.redirect(fileUrl);

  } catch (error) {
    console.error('Erreur affichage fichier:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'affichage du fichier'
    });
  }
});

// Route pour télécharger un fichier de manière sécurisée
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      where: { 
        id: req.params.id,
        owner_id: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // Construire l'URL Cloudinary complète si nécessaire
    let downloadUrl = file.file_url;
    
    if (!file.file_url.startsWith('http')) {
      // Construire l'URL Cloudinary complète à partir du chemin relatif
      const cloudinaryBaseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
      
      // Déterminer le type de ressource basé sur le mimetype
      const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
      
      downloadUrl = `${cloudinaryBaseUrl}/${resourceType}/upload/${file.file_url}`;
    }
    
    // Redirection vers l'URL Cloudinary
    res.redirect(downloadUrl);
    

  } catch (error) {
    console.error('Erreur téléchargement:', error);
    res.status(500).json({
      error: 'Erreur lors du téléchargement du fichier'
    });
  }
});

// Route pour renommer un fichier
router.put('/:id',
  authenticateToken,
  [
    body('filename', 'Le nouveau nom est requis').not().isEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { filename } = req.body;
      const file = await File.findOne({
        where: { 
          id: req.params.id,
          owner_id: req.user.id,
          is_latest: true  // Ne renommer que la version courante
        }
      });

      if (!file) {
        return res.status(404).json({ error: 'Fichier non trouvé ou version non courante' });
      }

      // Vérifier si un fichier avec le même nom existe déjà dans le même dossier
      if (file.dossier_id) { // Ne vérifier que si le fichier est dans un dossier
        const existingFile = await File.findOne({
          where: {
            filename,
            dossier_id: file.dossier_id,
            owner_id: req.user.id,
            id: { [Op.ne]: file.id } // Exclure le fichier actuel
          }
        });

        if (existingFile) {
          return res.status(409).json({ error: 'Un fichier avec ce nom existe déjà dans ce dossier.' });
        }
      }

      const oldFilename = file.filename;
      
      // Renommage simple : mettre à jour directement le nom du fichier existant
      await file.update({ filename: filename });

      await ActivityLog.create({
        userId: req.user.id,
        actionType: 'FILE_RENAME',
        details: {
          fileId: file.id,
          oldFileName: oldFilename,
          newFileName: filename
        },
      });

      res.json(file);

    } catch (error) {
      console.error('Erreur lors du renommage du fichier:', error);
      res.status(500).json({ error: 'Erreur lors du renommage du fichier' });
    }
});

// Route pour supprimer plusieurs fichiers en une seule fois (batch)
router.delete('/batch-delete', authenticateToken, async (req, res) => {
  const { fileIds } = req.body;
  const userId = req.user.id;

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: 'Les identifiants de fichiers sont requis.' });
  }

  const t = await sequelize.transaction();

  try {
    const filesToDelete = await File.findAll({
      where: {
        id: fileIds,
        owner_id: userId
      },
      transaction: t
    });

    if (filesToDelete.length === 0) {
      await t.rollback();
      return res.status(404).json({ message: 'Aucun fichier trouvé ou vous n\'avez pas la permission.' });
    }

    // Collecter tous les root_file_id pour traitement
    const rootFileIds = filesToDelete.map(file => file.parent_file_id || file.id);
    console.log(`🗑️ [BATCH DELETE] Root file IDs: ${rootFileIds.join(', ')}`);


    // Note : Les empreintes seront automatiquement supprimées via ON DELETE CASCADE
    // Pas besoin de suppression manuelle

    for (const file of filesToDelete) {
      console.log(`🗑️ [FILE DELETE] Début suppression fichier ${file.id} (${file.filename})`);
      
      const currentRootFileId = file.parent_file_id || file.id;
      
      // Supprimer de Cloudinary en utilisant la fonction utilitaire
      try {
        console.log(`🗑️ [FILE DELETE] Suppression Cloudinary du fichier: ${file.file_url}`);
        const deleteResult = await deleteCloudinaryFile(file.file_url, file.mimetype);
        console.log(`✅ [FILE DELETE] Fichier supprimé de Cloudinary:`, deleteResult);
      } catch (cloudinaryError) {
        console.error(`❌ [FILE DELETE] Erreur lors de la suppression Cloudinary pour le fichier ${file.id}:`, cloudinaryError);
        // On continue même si la suppression Cloudinary échoue pour ne pas bloquer le processus
      }

      // 3. Enregistrer l'activité de suppression pour le fichier racine
      let fileType = 'other';
      if (file.mimetype.startsWith('image/')) fileType = 'image';
      else if (file.mimetype === 'application/pdf') fileType = 'pdf';

      await ActivityLog.create({
        userId,
        actionType: 'FILE_DELETE',
        details: { 
          filename: file.filename,
          fileId: currentRootFileId, // Logger l'ID du fichier racine
          fileType: fileType
        }
      }, { transaction: t });
    }

    // Supprimer tous les fichiers de la base de données en une seule opération
    await File.destroy({
      where: {
        [Op.or]: [
          { id: rootFileIds },
          { parent_file_id: rootFileIds }
        ],
        owner_id: userId
      },
      transaction: t
    });
    console.log(`✅ [BATCH DELETE] Tous les fichiers supprimés de la BDD`);

    await t.commit();
    res.status(200).json({ message: `${filesToDelete.length} fichier(s) supprimé(s) avec succès.` });

  } catch (error) {
    await t.rollback();
    console.error('Erreur lors de la suppression par lot:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression des fichiers.' });
  }
});

// Route pour supprimer un fichier
router.delete('/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const file = await File.findOne({
      where: { 
        id: req.params.id,
        owner_id: req.user.id
      },
      transaction
    });

    if (!file) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // 1. Supprimer le fichier de Cloudinary
    try {
      await deleteCloudinaryFile(file.file_url, file.mimetype);
    } catch (cloudinaryError) {
      console.error(`Erreur lors de la suppression Cloudinary pour le fichier ${file.id}:`, cloudinaryError);
      // On continue même si la suppression Cloudinary échoue
    }

    // Déterminer le root_file_id de manière robuste
    const rootFileId = file.parent_file_id || file.id;
    console.log(`🗑️ [FILE DELETE] Root file ID: ${rootFileId}`);

    // Note : L'empreinte sera automatiquement supprimée via ON DELETE CASCADE
    // Pas besoin de suppression manuelle

    // Supprimer toutes les versions du fichier
    await File.destroy({
      where: {
        [Op.or]: [
          { id: rootFileId },
          { parent_file_id: rootFileId }
        ],
        owner_id: req.user.id
      },
      transaction
    });

    // 3. Enregistrer l'activité de suppression
    let fileType = 'other';
    if (file.mimetype.startsWith('image/')) fileType = 'image';
    else if (file.mimetype === 'application/pdf') fileType = 'pdf';
    else if (file.mimetype === 'application/zip') fileType = 'zip';

    // Créer le log d'activité de manière asynchrone pour éviter les timeouts
    setImmediate(async () => {
      try {
        await ActivityLog.create({
          userId: req.user.id,
          actionType: 'FILE_DELETE',
          details: {
            fileId: file.id,
            fileName: file.filename,
            fileType: fileType,
          }
        });
      } catch (logError) {
        console.error('Erreur lors de la création du log d\'activité:', logError);
      }
    });

    // 4. Supprimer le fichier de la base de données (déjà fait dans File.destroy ci-dessus)
    // await file.destroy({ transaction }); // Commenté car déjà supprimé dans File.destroy
    
    // Valider la transaction
    await transaction.commit();

    res.json({
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur suppression:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du fichier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour vérifier l'intégrité d'un fichier
router.post('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      where: { 
        id: req.params.id,
        owner_id: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // Pour une vérification complète, il faudrait télécharger le fichier depuis Cloudinary
    // et comparer les hash. Ici on retourne les informations de vérification.
    res.json({
      file_id: file.id,
      filename: file.filename,
      hash: file.hash,
      signature: file.signature,
      date_upload: file.date_upload,
      verification_status: 'verified',
      message: 'Fichier vérifié avec succès'
    });

  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du fichier'
    });
  }
});

// Route pour uploader une nouvelle version d'un fichier
router.post('/:id/version', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const originalFile = await File.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_latest: true },
    });

    if (!originalFile) {
      return res.status(404).json({ error: 'Fichier original non trouvé ou déjà versionné' });
    }

    // Marquer l'ancienne version
    await originalFile.update({ is_latest: false });

    const { originalname, filename, path: file_path, size, mimetype } = req.file;
    const file_url = `/uploads/${filename}`;

    const timestamp = Date.now();
    const fileHash = crypto.createHash('sha256').update(file_path + timestamp).digest('hex');
    const signature = crypto.createHash('sha256').update(`${originalname}-${req.user.id}-${timestamp}`).digest('hex');

    const newVersion = await File.create({
      filename: originalname,
      file_url,
      mimetype,
      hash: fileHash,
      signature,
      owner_id: req.user.id,
      version: originalFile.version + 1,
      parent_file_id: originalFile.id,
      is_latest: true,
    });

    res.status(201).json({ message: 'Nouvelle version uploadée avec succès', file: newVersion });

  } catch (error) {
    console.error('Erreur versioning:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la nouvelle version' });
  }
});

// Route pour récupérer l'historique d'un fichier
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const currentFile = await File.findOne({ 
      where: { id: req.params.id, owner_id: req.user.id }
    });

    if (!currentFile) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Déterminer l'ID du fichier racine (la v1)
    const rootFileId = currentFile.parent_file_id || currentFile.id;

    const history = await File.findAll({
      where: {
        [Op.or]: [
          { id: rootFileId },
          { parent_file_id: rootFileId }
        ],
        owner_id: req.user.id
      },
      order: [['version', 'DESC']]
    });

    res.json(history);

  } catch (error) {
    console.error('Erreur historique fichier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// Route pour servir les PDFs depuis Cloudinary avec les bonnes permissions
router.get('/pdf/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Récupérer le fichier depuis la base de données
    const file = await File.findOne({
      where: { 
        id: fileId,
        owner_id: req.user.id,
        mimetype: 'application/pdf'
      }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'Fichier PDF non trouvé' });
    }
    
    // Construire l'URL Cloudinary raw
    const cloudName = process.env.NODE_ENV === 'production' ? 'ddxypgvuh' : 'drpbnhwh6';
    const pdfUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${file.file_url}`;
    
    console.log('Serving PDF from:', pdfUrl);
    
    // Rediriger vers l'URL Cloudinary
    res.redirect(pdfUrl);
    
  } catch (error) {
    console.error('Erreur lors de la récupération du PDF:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


export default router;
