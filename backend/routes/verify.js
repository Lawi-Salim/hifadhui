import express from 'express';
import { File, Utilisateur } from '../models/index.js';
import { Op } from 'sequelize';
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

    // Log supprimé pour réduire le bruit dans les logs

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
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ [VERIFY] Hash non trouvé: ${hash.substring(0, 16)}...`);
      }
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

    // Log supprimé pour réduire le bruit dans les logs
    res.json(response);

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ [VERIFY] Erreur lors de la vérification:', error);
    }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 [VERIFY-FILE] Vérification du fichier: ${req.file.originalname}`);
    }

    // Calculer le hash du fichier de la même manière que lors de l'upload
    let fileBuffer = req.file.buffer;
    if (!Buffer.isBuffer(fileBuffer)) {
      fileBuffer = Buffer.from(fileBuffer);
    }
    
    // Méthode 1 : Hachage direct du buffer (méthode actuelle)
    const hashMethod1 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Méthode 2 : Hachage avec l'URL du fichier + timestamp (méthode utilisée lors de l'upload sans empreinte)
    const timestamp = Date.now();
    const hashMethod2 = crypto.createHash('sha256')
      .update(req.file.originalname + timestamp)
      .digest('hex');
    
    // Utiliser File.generateFileHash pour la cohérence
    const fileHash = File.generateFileHash(fileBuffer);
    
    console.log('🔍 [VERIFY-FILE] Détails du fichier:', {
      originalname: req.file.originalname,
      size: req.file.size,
      bufferLength: fileBuffer.length,
      hashMethod1: hashMethod1,
      hashMethod2: hashMethod2,
      hashMethod3: fileHash,
      firstBytes: fileBuffer.length > 0 ? fileBuffer.slice(0, 32).toString('hex') : 'empty'
    });
    
    // Rechercher avec les trois méthodes de hachage possibles
    const hashesToCheck = [hashMethod1, hashMethod2, fileHash];

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 [VERIFY-FILE] Hash calculé: ${fileHash.substring(0, 16)}...`);
    }

    // Vérifier si le fichier a une empreinte associée
    const fileWithEmpreinte = await File.findOne({
      where: {
        filename: req.file.originalname.split('.')[0] // Enlever l'extension
      },
      include: [
        {
          model: Empreinte,
          as: 'empreinte',
          required: true
        },
        {
          model: Utilisateur,
          as: 'fileUser',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    if (fileWithEmpreinte) {
      console.log('🔍 [VERIFY-EMPREINTE] Fichier trouvé avec empreinte:', {
        id: fileWithEmpreinte.id,
        filename: fileWithEmpreinte.filename,
        hash: fileWithEmpreinte.hash,
        hash_pregenere: fileWithEmpreinte.empreinte?.hash_pregenere,
        owner: fileWithEmpreinte['fileUser.email'] || 'inconnu'
      });
      
      // Si le fichier a une empreinte, utilisons le hash pré-généré pour la vérification
      if (fileWithEmpreinte.empreinte?.hash_pregenere) {
        hashesToCheck.unshift(fileWithEmpreinte.empreinte.hash_pregenere);
        console.log('🔑 [VERIFY-EMPREINTE] Utilisation du hash pré-généré pour la vérification');
      }
    } else {
      console.log('ℹ️ [VERIFY-EMPREINTE] Aucune empreinte trouvée pour ce fichier');
    }
    
    // Afficher les hachages à vérifier
    console.log('🔍 [VERIFY-FILE] Recherche avec les hachages calculés:', hashesToCheck);
    
    // Vérifier chaque hachage individuellement pour le débogage
    for (const hash of hashesToCheck) {
      // Afficher le hachage complet pour le débogage
      console.log('🔑 [VERIFY-HASH] Hachage complet à vérifier:', hash);
      
      // Vérifier dans la table file (avec différentes variantes de casse)
      const whereClause = { 
        [Op.or]: [
          { hash: hash },
          { hash: hash.toLowerCase() },
          { hash: hash.toUpperCase() }
        ]
      };
      
      const fileCount = await File.count({ where: whereClause });
      console.log(`📊 [VERIFY-FILE] Recherche du hachage: ${fileCount} correspondance(s)`);
      
      // Afficher les fichiers correspondants s'il y en a
      if (fileCount > 0) {
        const matchingFiles = await File.findAll({ 
          where: whereClause,
          raw: true,
          include: [{
            model: Utilisateur,
            as: 'fileUser',
            attributes: ['id', 'username', 'email']
          }]
        });
        
        console.log('📋 [VERIFY-FILE] Fichiers correspondants trouvés:', matchingFiles.map(f => ({
          id: f.id,
          filename: f.filename,
          hash: f.hash,
          hashLength: f.hash?.length || 0,
          createdAt: f.date_upload,
          owner: f['fileUser.email'] || 'inconnu'
        })));
      }
      
      // Vérifier dans la table empreintes
      const empreinteCount = await Empreinte.count({ 
        where: { 
          [Op.or]: [
            { hash_pregenere: hash },
            { hash_pregenere: hash.toLowerCase() },
            { hash_pregenere: hash.toUpperCase() }
          ]
        },
        include: [
          { model: File, as: 'file' },
          { model: Utilisateur, as: 'owner' }  
        ]
      });
      
      console.log(`🔎 [VERIFY-EMPREINTE] Recherche hachage ${hash.substring(0, 8)}...: ${empreinteCount} correspondance(s)`);
      
      if (empreinteCount > 0) {
        const empreinte = await Empreinte.findOne({ 
          where: { 
            [Op.or]: [
              { hash_pregenere: hash },
              { hash_pregenere: hash.toLowerCase() },
              { hash_pregenere: hash.toUpperCase() }
            ]
          },
          include: [
            { model: File, as: 'file' },
            { model: Utilisateur, as: 'owner' }  
          ]
        });
        
        if (empreinte) {
          console.log('� [VERIFY-EMPREINTE] Empreinte trouvée:', {
            id: empreinte.id,
            productId: empreinte.product_id,
            hashPregenere: empreinte.hash_pregenere,
            fileId: empreinte.file_id,
            fileExists: !!empreinte.file,
            owner: empreinte.owner ? empreinte.owner.email : 'inconnu'
          });
          
          if (empreinte.file) {
            console.log('📁 [VERIFY-EMPREINTE] Fichier lié:', {
              id: empreinte.file.id,
              filename: empreinte.file.filename,
              hash: empreinte.file.hash,
              createdAt: empreinte.file.date_upload
            });
          }
        }
      }
    }

    // Rechercher avec les trois méthodes de hachage possibles
    const file = await File.findOne({
      where: {
        [Op.or]: hashesToCheck.map(hash => ({ hash }))
      },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['username', 'email']
      }]
    });

    if (!file) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ [VERIFY-FILE] Aucun fichier trouvé avec les hachages fournis`);
        
        try {
          // 1. D'abord essayer de trouver par hash
          for (const hash of hashesToCheck) {
            const empreinte = await Empreinte.findOne({ 
              where: { hash_pregenere: hash },
              include: [
                { 
                  model: File, 
                  as: 'file',
                  attributes: ['id', 'filename', 'hash', 'date_upload', 'size', 'mimetype', 'file_url']
                },
                {
                  model: Utilisateur,
                  as: 'owner',
                  attributes: ['id', 'email', 'username']
                }
              ]
            });
            
            if (empreinte) {
              console.log('🔍 [VERIFY-EMPREINTE] Fichier trouvé via empreinte (hash):', {
                productId: empreinte.product_id,
                fileId: empreinte.file_id,
                hashPregenere: empreinte.hash_pregenere,
                fileExists: !!empreinte.file,
                owner: empreinte.owner ? empreinte.owner.email : 'inconnu'
              });
              
              // Si on a trouvé une empreinte mais pas de fichier associé, essayer de le récupérer
              if (!empreinte.file && empreinte.file_id) {
                const associatedFile = await File.findByPk(empreinte.file_id);
                if (associatedFile) {
                  console.log('📂 [VERIFY-EMPREINTE] Fichier associé récupéré:', {
                    id: associatedFile.id,
                    filename: associatedFile.filename,
                    hash: associatedFile.hash
                  });
                  empreinte.file = associatedFile;
                }
              }
              
              return res.json({
                verified: true,
                hash: empreinte.hash_pregenere,
                productId: empreinte.product_id,
                uploadDate: empreinte.file?.date_upload || empreinte.updated_at,
                signature: empreinte.signature_pregeneree,
                file: empreinte.file ? {
                  id: empreinte.file.id,
                  name: empreinte.file.filename,
                  size: empreinte.file.size,
                  mimetype: empreinte.file.mimetype,
                  url: empreinte.file.file_url,
                  uploadDate: empreinte.file.date_upload
                } : null,
                owner: empreinte.owner ? {
                  id: empreinte.owner.id,
                  email: empreinte.owner.email,
                  username: empreinte.owner.username
                } : null
              });
            }
          }
          
          // 2. Si aucun fichier trouvé par hash, essayer de trouver par nom de fichier
          const filename = req.file.originalname.split('.')[0];
          console.log('🔍 [VERIFY-EMPREINTE] Recherche par nom de fichier:', filename);
          
          // Recherche insensible à la casse avec différentes variantes
          const searchPatterns = [
            `%${filename}%`,
            `%${filename.toLowerCase()}%`,
            `%${filename.toUpperCase()}%`,
            `%${filename.charAt(0).toUpperCase() + filename.slice(1).toLowerCase()}%`
          ];
          
          const empreinteParNom = await Empreinte.findOne({
            include: [
              {
                model: File,
                as: 'file',
                where: {
                  filename: {
                    [Op.or]: searchPatterns.map(pattern => ({
                      [Op.iLike]: pattern
                    }))
                  }
                },
                required: true,
                attributes: ['id', 'filename', 'hash', 'date_upload', 'size', 'mimetype', 'file_url']
              },
              {
                model: Utilisateur,
                as: 'owner',
                attributes: ['id', 'email', 'username']
              }
            ]
          });
          
          // Si pas trouvé, essayer avec une recherche plus large (sans les tirets)
          if (!empreinteParNom) {
            const empreinteParNomLarge = await Empreinte.findOne({
              include: [
                {
                  model: File,
                  as: 'file',
                  where: {
                    filename: {
                      [Op.iLike]: `%${filename.replace(/-/g, '')}%`
                    }
                  },
                  required: true,
                  attributes: ['id', 'filename', 'hash', 'date_upload', 'size', 'mimetype', 'file_url']
                },
                {
                  model: Utilisateur,
                  as: 'owner',
                  attributes: ['id', 'email', 'username']
                }
              ]
            });
            
            if (empreinteParNomLarge) {
              return empreinteParNomLarge;
            }
          }
          
          if (empreinteParNom) {
            console.log('🔍 [VERIFY-EMPREINTE] Fichier trouvé par nom:', {
              filename: empreinteParNom.file.filename,
              productId: empreinteParNom.product_id,
              hash: empreinteParNom.hash_pregenere,
              owner: empreinteParNom.owner ? empreinteParNom.owner.email : 'inconnu'
            });
            
            return res.json({
              verified: true,
              hash: empreinteParNom.hash_pregenere,
              productId: empreinteParNom.product_id,
              uploadDate: empreinteParNom.file.date_upload,
              signature: empreinteParNom.signature_pregeneree,
              file: {
                id: empreinteParNom.file.id,
                name: empreinteParNom.file.filename,
                size: empreinteParNom.file.size,
                mimetype: empreinteParNom.file.mimetype,
                url: empreinteParNom.file.file_url,
                uploadDate: empreinteParNom.file.date_upload
              },
              owner: empreinteParNom.owner ? {
                id: empreinteParNom.owner.id,
                email: empreinteParNom.owner.email,
                username: empreinteParNom.owner.username
              } : null
            });
          }
        } catch (error) {
          console.error('❌ [VERIFY-ERROR] Erreur lors de la recherche d\'empreinte:', error);
        }
      }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ [VERIFY-FILE] Fichier vérifié avec succès: ${file.filename}`);
    }
    res.json(response);

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ [VERIFY-FILE] Erreur lors de la vérification:', error);
    }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 [VERIFY-HASH] Vérification du hash: ${hash.substring(0, 16)}...`);
    }

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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ [VERIFY-HASH] Hash vérifié avec succès`);
    }
    res.json(response);

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ [VERIFY-HASH] Erreur:', error);
    }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 [VERIFY] Vérification du Product ID: ${productId}`);
    }

    // Rechercher l'empreinte par Product ID
    const empreinte = await Empreinte.findOne({
      where: { product_id: productId.toUpperCase() }
    });

    if (!empreinte) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ [VERIFY] Product ID non trouvé: ${productId}`);
      }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ [VERIFY] Fichier vérifié via Product ID: ${productId}`);
    }
    res.json(response);

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ [VERIFY] Erreur lors de la vérification par Product ID:', error);
    }
    res.status(500).json({ 
      verified: false,
      error: 'Une erreur est survenue lors de la vérification'
    });
  }
});

export default router;
