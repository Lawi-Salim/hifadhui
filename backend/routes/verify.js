import express from 'express';
import { File, Utilisateur } from '../models/index.js';
import Empreinte from '../models/Empreinte.js';
import crypto from 'crypto';
import multer from 'multer';

const router = express.Router();

// Configuration multer pour upload temporaire (vérification)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max pour vérification
  }
});

/**
 * @route   GET /api/v1/verify/:hash
 * @desc    Vérifier l'authenticité d'un fichier par son hash
 * @access  Public
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // console.log(`🔍 [VERIFY] Vérification du hash: ${hash.substring(0, 16)}...`);

    // Valider le format du hash (SHA-256 = 64 caractères hexadécimaux)
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return res.status(400).json({ 
        verified: false,
        error: 'Format de hash invalide. Le hash SHA-256 doit contenir 64 caractères hexadécimaux.'
      });
    }

    // Rechercher le fichier par hash
    const file = await File.findOne({
      where: { hash: hash.toLowerCase() },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['username', 'email']
      }]
    });

    if (!file) {
      console.log(`❌ [VERIFY] Hash non trouvé: ${hash.substring(0, 16)}...`);
      return res.json({
        verified: false,
        message: 'Aucun fichier correspondant à ce hash n\'a été trouvé dans notre base de données.'
      });
    }

    // Préparer la réponse selon la configuration de confidentialité
    const response = {
      verified: true,
      hash: file.hash,
      uploadDate: file.date_upload,
      signature: file.signature
    };

    // Si la vérification publique est autorisée, inclure plus de détails
    if (file.is_public_verification) {
      response.filename = file.filename;
      response.size = file.size;
      response.mimetype = file.mimetype;
      response.owner = {
        name: file.fileUser.username,
        email: file.fileUser.email
      };
    } else {
      // Mode anonyme : informations minimales
      response.filename = '****** (confidentiel)';
      response.message = 'Ce fichier existe dans notre base de données mais le propriétaire a choisi de garder les détails confidentiels.';
    }

    // console.log(`✅ [VERIFY] Fichier vérifié: ${file.filename}`);
    res.json(response);

  } catch (error) {
    console.error('❌ [VERIFY] Erreur lors de la vérification:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Erreur lors de la vérification'
    });
  }
});

/**
 * @route   POST /api/v1/verify/file
 * @desc    Vérifier l'authenticité d'un fichier en l'uploadant
 * @access  Public
 */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        verified: false,
        error: 'Aucun fichier fourni'
      });
    }

    console.log(`🔍 [VERIFY-FILE] Vérification du fichier: ${req.file.originalname}`);

    // Calculer le hash du fichier uploadé
    const fileHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    console.log(`🔐 [VERIFY-FILE] Hash calculé: ${fileHash.substring(0, 16)}...`);

    // Rechercher le fichier par hash
    const file = await File.findOne({
      where: { hash: fileHash },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['username', 'email']
      }]
    });

    if (!file) {
      console.log(`❌ [VERIFY-FILE] Fichier non trouvé dans la base`);
      return res.json({
        verified: false,
        hash: fileHash,
        uploadedFile: {
          name: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        message: 'Ce fichier n\'a pas été trouvé dans notre base de données. Il n\'a jamais été déposé sur Hifadhui ou a été modifié depuis son dépôt.'
      });
    }

    // Fichier trouvé - préparer la réponse
    const response = {
      verified: true,
      hash: fileHash,
      uploadDate: file.date_upload,
      signature: file.signature,
      uploadedFile: {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      match: {
        sameSize: req.file.size === parseInt(file.size),
        sameMimetype: req.file.mimetype === file.mimetype
      }
    };

    // Si la vérification publique est autorisée
    if (file.is_public_verification) {
      response.originalFile = {
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      };
      response.owner = {
        name: file.fileUser.username,
        email: file.fileUser.email
      };
    } else {
      response.message = 'Ce fichier existe dans notre base de données mais le propriétaire a choisi de garder les détails confidentiels.';
    }

    console.log(`✅ [VERIFY-FILE] Fichier vérifié avec succès: ${file.filename}`);
    res.json(response);

  } catch (error) {
    console.error('❌ [VERIFY-FILE] Erreur lors de la vérification:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Erreur lors de la vérification du fichier'
    });
  }
});

/**
 * @route   POST /api/v1/verify/hash
 * @desc    Vérifier un hash fourni manuellement
 * @access  Public
 */
router.post('/hash', async (req, res) => {
  try {
    const { hash } = req.body;

    if (!hash) {
      return res.status(400).json({ 
        verified: false,
        error: 'Hash manquant'
      });
    }

    console.log(`🔍 [VERIFY-HASH] Vérification du hash: ${hash.substring(0, 16)}...`);

    // Valider le format
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return res.status(400).json({ 
        verified: false,
        error: 'Format de hash invalide'
      });
    }

    // Rechercher le fichier
    const file = await File.findOne({
      where: { hash: hash.toLowerCase() },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['username', 'email']
      }]
    });

    if (!file) {
      return res.json({
        verified: false,
        hash: hash.toLowerCase(),
        message: 'Aucun fichier correspondant trouvé'
      });
    }

    // Réponse
    const response = {
      verified: true,
      hash: file.hash,
      uploadDate: file.date_upload,
      signature: file.signature
    };

    if (file.is_public_verification) {
      response.filename = file.filename;
      response.size = file.size;
      response.mimetype = file.mimetype;
      response.owner = {
        name: file.fileUser.username,
        email: file.fileUser.email
      };
    }

    console.log(`✅ [VERIFY-HASH] Hash vérifié avec succès`);
    res.json(response);

  } catch (error) {
    console.error('❌ [VERIFY-HASH] Erreur:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Erreur lors de la vérification'
    });
  }
});

/**
 * @route   GET /api/v1/verify/product-id/:productId
 * @desc    Vérifier l'authenticité d'un fichier par son Product ID
 * @access  Public
 */
router.get('/product-id/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`🔍 [VERIFY] Vérification du Product ID: ${productId}`);

    // Rechercher l'empreinte par Product ID
    const empreinte = await Empreinte.findOne({
      where: { product_id: productId.toUpperCase() }
    });

    if (!empreinte) {
      console.log(`❌ [VERIFY] Product ID non trouvé: ${productId}`);
      return res.json({
        verified: false,
        message: 'Aucune empreinte correspondant à ce Product ID n\'a été trouvée dans notre base de données.'
      });
    }

    // Vérifier si l'empreinte est associée à un fichier
    if (!empreinte.file_id) {
      return res.json({
        verified: false,
        message: 'Cette empreinte n\'est pas encore associée à un fichier.'
      });
    }

    // Rechercher le fichier associé
    const file = await File.findByPk(empreinte.file_id, {
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['username', 'email']
      }]
    });

    if (!file) {
      return res.json({
        verified: false,
        message: 'Le fichier associé à cette empreinte n\'a pas été trouvé.'
      });
    }

    // Préparer la réponse
    const response = {
      verified: true,
      productId: empreinte.product_id,
      hash: file.hash,
      signature: file.signature,
      uploadDate: file.date_upload,
      empreinteGeneratedAt: empreinte.generated_at,
      empreinteUsedAt: empreinte.used_at
    };

    // Si la vérification publique est autorisée, inclure plus de détails
    if (file.is_public_verification) {
      response.filename = file.filename;
      response.size = file.size;
      response.mimetype = file.mimetype;
      response.owner = {
        name: file.fileUser.username,
        email: file.fileUser.email
      };
    } else {
      // Mode anonyme : informations minimales
      response.filename = '****** (confidentiel)';
      response.message = 'Ce fichier existe dans notre base de données mais le propriétaire a choisi de garder les détails confidentiels.';
    }

    console.log(`✅ [VERIFY] Fichier vérifié via Product ID: ${productId}`);
    res.json(response);

  } catch (error) {
    console.error('❌ [VERIFY] Erreur lors de la vérification par Product ID:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Une erreur est survenue lors de la vérification'
    });
  }
});

export default router;
