import express from 'express';
import { sequelize } from '../config/database.js';
import { Dossier, File, Certificate, ActivityLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import AdmZip from 'adm-zip';
import streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';
import { getUserFileConfig, getFileType } from '../utils/cloudinaryStructure.js';

const router = express.Router();

// POST /api/dossiers - Créer un nouveau dossier
router.post('/', authenticateToken, async (req, res) => {
  const { name, parent_id = null } = req.body; // parent_id est optionnel
  if (!name) {
    return res.status(400).json({ error: 'Le nom du dossier est requis.' });
  }

  try {
    // Si aucun parent spécifié, utiliser le dossier système comme parent
    let actualParentId = parent_id;
    if (!actualParentId) {
      const systemRoot = await Dossier.getSystemRoot();
      actualParentId = systemRoot.id;
    }

    // Transformer le nom en slug pour éviter les problèmes d'encodage
    const slugifiedName = createSlug(name);
    
    // Vérifier l'unicité du nom slugifié dans le même dossier parent
    const existingDossier = await Dossier.findOne({ 
      where: { 
        name: slugifiedName, 
        owner_id: req.user.id,
        parent_id: actualParentId
      } 
    });
    if (existingDossier) {
      return res.status(409).json({ error: 'Un dossier avec ce nom existe déjà à cet emplacement.' });
    }

    const newDossier = await Dossier.create({
      name: slugifiedName,
      name_original: fixEncoding(name),
      owner_id: req.user.id,
      parent_id: actualParentId,
    });

        await ActivityLog.create({
      userId: req.user.id,
      actionType: 'FOLDER_CREATE',
      details: {
        dossierId: newDossier.id,
        dossierName: newDossier.name,
        parentId: newDossier.parent_id,
      },
    });

    res.status(201).json(newDossier);
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du dossier.' });
  }
});

// GET /api/dossiers - Lister les dossiers racine de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Récupérer le dossier système et lister ses enfants (masquer Hifadhwi)
    const systemRoot = await Dossier.getSystemRoot();
    const dossiers = await Dossier.findAll({
      where: { 
        owner_id: req.user.id,
        parent_id: systemRoot.id // Enfants du dossier système
      },
      attributes: {
        include: [
          ['id', 'id'],
          ['name', 'name'],
          ['name_original', 'name_original'],
          ['owner_id', 'owner_id'],
          ['parent_id', 'parent_id'],
          ['created_at', 'created_at'],
          ['updated_at', 'updated_at'],
          [sequelize.literal(`(SELECT COUNT(*) FROM file WHERE file.dossier_id = "Dossier".id)`), 'fileCount'],
          [sequelize.literal(`(SELECT COUNT(*) FROM dossier AS sub_dossier WHERE sub_dossier.parent_id = "Dossier".id)`), 'subDossierCount']
        ]
      },
      order: [['name', 'ASC']]
    });

    // Ajouter hierarchicalPath aux dossiers racine
    const dossiersWithPath = dossiers.map(dossier => ({
      ...dossier.dataValues,
      hierarchicalPath: dossier.name
    }));

    res.json(dossiersWithPath);
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des dossiers.' });
  }
});

// Fonction pour récupérer les ancêtres d'un dossier
const getAncestors = async (dossierId, userId) => {
  const ancestors = [];
  let currentId = dossierId;

  while (currentId) {
    const currentDossier = await Dossier.findOne({
      where: { id: currentId, owner_id: userId },
      attributes: ['id', 'name', 'parent_id'],
    });

    if (currentDossier) {
      ancestors.unshift({ id: currentDossier.id, name: currentDossier.name });
      currentId = currentDossier.parent_id;
    } else {
      currentId = null;
    }
  }
  // On ne retire plus le dernier élément pour inclure le parent direct
  return ancestors;
};

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
    // Caractères spéciaux français supplémentaires
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

// GET /api/dossiers/by-path/:path - Récupérer un dossier par son chemin hiérarchique
router.get('/by-path/:path', authenticateToken, async (req, res) => {
  try {
    const slugPath = decodeURIComponent(req.params.path);
    // Diviser le chemin en segments
    const pathSegments = slugPath.split('/').filter(segment => segment.length > 0);
    
    // Récupérer le dossier système et tous les dossiers de l'utilisateur
    const systemRoot = await Dossier.getSystemRoot();
    const allDossiers = await Dossier.findAll({
      where: { 
        owner_id: req.user.id
      }
    });

    // Naviguer dans la hiérarchie segment par segment
    // Commencer par le dossier système comme racine
    let currentDossier = null;
    let currentParentId = systemRoot.id;

    for (const segment of pathSegments) {
      // Chercher le dossier correspondant au segment actuel dans le parent actuel
      const matchingDossier = allDossiers.find(d => {
        const dossierSlug = createSlug(fixEncoding(d.name));
        return dossierSlug === segment && d.parent_id === currentParentId;
      });
      
      if (!matchingDossier) {
        return res.status(404).json({ error: `Dossier non trouvé: ${segment}` });
      }
      
      currentDossier = matchingDossier;
      currentParentId = currentDossier.id;
    }
    
    if (!currentDossier) {
      return res.status(404).json({ error: 'Chemin de dossier invalide.' });
    }

    // Récupérer les fichiers et sous-dossiers
    const files = await File.findAll({
      where: { dossier_id: currentDossier.id, owner_id: req.user.id },
      include: [{
        model: Dossier,
        as: 'fileDossier',
        required: false
      }],
      order: [['filename', 'ASC']]
    });

    // Pour chaque fichier, récupérer son certificat et le chemin complet du dossier
    const filesWithDetails = await Promise.all(
      files.map(async (file) => {
        const rootFileId = file.parent_file_id || file.id;
        const certificate = await Certificate.findOne({
          where: { root_file_id: rootFileId },
          attributes: ['id', 'pdf_url', 'date_generated']
        });
        
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
          } : null,
          fileCertificates: certificate ? [certificate] : []
        };
      })
    );

    const subDossiers = await Dossier.findAll({
      where: { parent_id: currentDossier.id, owner_id: req.user.id },
      attributes: {
        include: [
          ['id', 'id'],
          ['name', 'name'],
          ['name_original', 'name_original'],
          ['owner_id', 'owner_id'],
          ['parent_id', 'parent_id'],
          ['created_at', 'created_at'],
          ['updated_at', 'updated_at'],
          [sequelize.literal(`(SELECT COUNT(*) FROM file WHERE file.dossier_id = "Dossier".id)`), 'fileCount'],
          [sequelize.literal(`(SELECT COUNT(*) FROM dossier AS sub_dossier WHERE sub_dossier.parent_id = "Dossier".id)`), 'subDossierCount']
        ]
      },
      order: [['name', 'ASC']]
    });

    // Ajouter le chemin hiérarchique aux sous-dossiers
    const subDossiersWithPath = subDossiers.map(subDossier => ({
      ...subDossier.dataValues,
      hierarchicalPath: `${req.params.path}/${createSlug(fixEncoding(subDossier.name))}`
    }));

    const ancestors = await getAncestors(currentDossier.parent_id, req.user.id);

    currentDossier.dataValues.dossierFiles = filesWithDetails;
    currentDossier.dataValues.subDossiers = subDossiersWithPath;
    currentDossier.dataValues.ancestors = ancestors;

    res.json({ dossier: currentDossier });
  } catch (error) {
    console.error(`Erreur lors de la récupération du dossier par chemin:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du dossier.' });
  }
});

// GET /api/dossiers/:id - Récupérer un dossier spécifique, ses fichiers et ses sous-dossiers
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const dossier = await Dossier.findOne({
      where: { 
        id: req.params.id,
        owner_id: req.user.id 
      }
    });

    if (dossier) {
      const files = await File.findAll({
        where: { dossier_id: dossier.id, owner_id: req.user.id },
        include: [{
          model: Dossier,
          as: 'fileDossier',
          required: false
        }],
        order: [['filename', 'ASC']]
      });

      // Pour chaque fichier, récupérer son certificat et le chemin complet du dossier
      const filesWithDetails = await Promise.all(
        files.map(async (file) => {
          const rootFileId = file.parent_file_id || file.id;
          const certificate = await Certificate.findOne({
            where: { root_file_id: rootFileId },
            attributes: ['id', 'pdf_url', 'date_generated']
          });
          
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
            } : null,
            fileCertificates: certificate ? [certificate] : []
          };
        })
      );

      const subDossiers = await Dossier.findAll({
        where: { parent_id: dossier.id, owner_id: req.user.id },
        attributes: {
          include: [
            ['id', 'id'],
            ['name', 'name'],
            ['owner_id', 'owner_id'],
            ['parent_id', 'parent_id'],
            ['created_at', 'created_at'],
            ['updated_at', 'updated_at'],
            [sequelize.literal(`(SELECT COUNT(*) FROM file WHERE file.dossier_id = "Dossier".id)`), 'fileCount'],
            [sequelize.literal(`(SELECT COUNT(*) FROM dossier AS sub_dossier WHERE sub_dossier.parent_id = "Dossier".id)`), 'subDossierCount']
          ]
        },
        order: [['name', 'ASC']]
      });

      // Attacher les résultats à l'objet dossier pour la réponse JSON
      const ancestors = await getAncestors(dossier.parent_id, req.user.id);

      // Ajouter le chemin hiérarchique aux sous-dossiers pour la route par ID
      const buildPath = (ancestorsList, currentName) => {
        return [...ancestorsList.map(a => createSlug(fixEncoding(a.name))), createSlug(fixEncoding(currentName))].join('/');
      };
      
      const currentPath = buildPath(ancestors, dossier.name);
      
      const subDossiersWithPath = subDossiers.map(subDossier => ({
        ...subDossier.dataValues,
        hierarchicalPath: `${currentPath}/${createSlug(fixEncoding(subDossier.name))}`
      }));

      // Attacher les résultats à l'objet dossier pour la réponse JSON
      dossier.dataValues.dossierFiles = filesWithDetails;
      dossier.dataValues.subDossiers = subDossiersWithPath;
      dossier.dataValues.ancestors = ancestors;

    }

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé.' });
    }

    res.json(dossier);
  } catch (error) {
    console.error(`Erreur lors de la récupération du dossier ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du dossier.' });
  }
});

// POST /api/dossiers/:id/upload-zip - Uploader une archive ZIP dans un dossier
router.post('/:id/upload-zip', authenticateToken, upload.single('zipfile'), async (req, res) => {
  const { id: dossierId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier ZIP fourni.' });
  }

  try {
    const dossier = await Dossier.findOne({ where: { id: dossierId, owner_id: req.user.id } });
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé.' });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    
    const uploadPromises = zipEntries
      .filter(zipEntry => !zipEntry.isDirectory)
      .map(zipEntry => {
        return new Promise((resolve, reject) => {
          const fileBuffer = zipEntry.getData();
          const filename = zipEntry.entryName;

          // Créer un objet file simulé pour la configuration
          const mockFile = {
            mimetype: filename.match(/\.(jpg|jpeg|png)$/i) ? 'image/jpeg' : 
                     filename.match(/\.pdf$/i) ? 'application/pdf' : 'application/octet-stream',
            originalname: filename
          };
          
          const config = getUserFileConfig(req.user, mockFile);
          const uploadStream = cloudinary.uploader.upload_stream(
            config,
            async (error, result) => {
              if (error) {
                return reject({ file: filename, message: `Erreur Cloudinary: ${error.message}` });
              }

              try {
                await File.create({
                  filename,
                  file_url: result.secure_url,
                  mimetype: result.resource_type === 'image' ? `${result.resource_type}/${result.format}` : 'application/pdf',
                  hash: result.etag, // Utiliser l'etag de Cloudinary comme hash simple
                  signature: `sig_${Date.now()}_${Math.random()}`,
                  owner_id: req.user.id,
                  dossier_id: dossierId,
                });
                resolve(filename);
              } catch (dbError) {
                reject({ file: filename, message: `Erreur base de données: ${dbError.message}` });
              }
            }
          );

          streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
      });

    const outcomes = await Promise.allSettled(uploadPromises);
    
    const results = {
      success: outcomes.filter(o => o.status === 'fulfilled').map(o => o.value),
      errors: outcomes.filter(o => o.status === 'rejected').map(o => o.reason),
    };

    res.status(200).json({ 
      message: 'Traitement du ZIP terminé.',
      ...results
    });

  } catch (error) {
    console.error('Erreur lors du traitement du ZIP:', error);
    res.status(500).json({ error: 'Erreur serveur lors du traitement du ZIP.' });
  }
});

// PUT /api/dossiers/:id - Renommer un dossier
router.put('/:id', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Le nouveau nom du dossier est requis.' });
  }

  try {
    const dossier = await Dossier.findOne({ 
      where: { id: req.params.id, owner_id: req.user.id } 
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé.' });
    }

    // Transformer le nom en slug pour éviter les problèmes d'encodage
    const slugifiedName = createSlug(name);

    // Vérifier si un autre dossier du même nom existe déjà dans le même dossier parent
    const existingDossier = await Dossier.findOne({ 
      where: { 
        name: slugifiedName,
        owner_id: req.user.id,
        parent_id: dossier.parent_id
      }
    });

    if (existingDossier && existingDossier.id !== dossier.id) {
      return res.status(409).json({ error: 'Un dossier avec ce nom existe déjà à cet emplacement.' });
    }

    const oldDossierName = dossier.name;
    dossier.name = slugifiedName;
    dossier.name_original = fixEncoding(name);
    await dossier.save();

    await ActivityLog.create({
        userId: req.user.id,
        actionType: 'FOLDER_RENAME',
        details: {
            dossierId: dossier.id,
            oldDossierName: oldDossierName,
            newDossierName: dossier.name,
        },
    });

    res.json(dossier);
  } catch (error) {
    console.error(`Erreur lors du renommage du dossier ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erreur serveur lors du renommage du dossier.' });
  }
});

// Fonctions récursives pour la suppression
const getFilesToDelete = async (dossierId, ownerId, files = []) => {
  const directFiles = await File.findAll({ where: { dossier_id: dossierId, owner_id: ownerId } });
  files.push(...directFiles);

  const subDossiers = await Dossier.findAll({ where: { parent_id: dossierId, owner_id: ownerId } });
  for (const subDossier of subDossiers) {
    await getFilesToDelete(subDossier.id, ownerId, files);
  }
  return files;
};

const deleteDossierRecursive = async (dossierId, ownerId) => {
  const subDossiers = await Dossier.findAll({ where: { parent_id: dossierId, owner_id: ownerId } });
  
  // Supprimer récursivement tous les sous-dossiers en parallèle
  await Promise.all(subDossiers.map(subDossier => 
    deleteDossierRecursive(subDossier.id, ownerId)
  ));

  // Supprimer les fichiers et certificats de Cloudinary en parallèle avant de les supprimer de la base de données
  const filesToDelete = await File.findAll({ where: { dossier_id: dossierId, owner_id: ownerId } });
  
  if (filesToDelete.length > 0) {
    console.log(`Suppression de ${filesToDelete.length} fichiers de Cloudinary pour le dossier ${dossierId}...`);
    
    // Collecter tous les root_file_id pour les certificats
    const rootFileIds = filesToDelete.map(file => file.parent_file_id || file.id);
    console.log(`🔍 [FOLDER DELETE] Recherche certificats pour ${rootFileIds.length} fichier(s)`);
    
    // Récupérer tous les certificats associés
    const certificates = await Certificate.findAll({ 
      where: { root_file_id: rootFileIds }
    });
    console.log(`🔍 [FOLDER DELETE] ${certificates.length} certificat(s) trouvé(s)`);
    
    const { deleteCloudinaryFile } = await import('../utils/cloudinaryStructure.js');
    const batchSize = 10;
    
    // Supprimer d'abord tous les certificats de Cloudinary
    if (certificates.length > 0) {
      console.log(`🗑️ [FOLDER DELETE] Suppression de ${certificates.length} certificats de Cloudinary...`);
      
      for (let i = 0; i < certificates.length; i += batchSize) {
        const batch = certificates.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (certificate) => {
          if (certificate.pdf_url) {
            try {
              const certDeleteResult = await deleteCloudinaryFile(certificate.pdf_url, 'application/pdf');
              console.log(`✅ [FOLDER DELETE] Certificat supprimé de Cloudinary: ${certificate.pdf_url}`);
            } catch (cloudinaryError) {
              console.error(`❌ [FOLDER DELETE] Erreur suppression certificat Cloudinary:`, cloudinaryError);
            }
          }
        }));
      }
    }
    
    // Ensuite supprimer tous les fichiers de Cloudinary
    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file) => {
        if (file.file_url) {
          try {
            await deleteCloudinaryFile(file.file_url, file.mimetype);
            console.log(`Fichier supprimé de Cloudinary: ${file.file_url}`);
          } catch (cloudinaryError) {
            console.error(`Erreur suppression Cloudinary pour ${file.file_url}:`, cloudinaryError);
            // Ne pas faire échouer la suppression si Cloudinary échoue
          }
        }
      }));
    }
  }

  // Supprimer tous les certificats de la base de données
  const rootFileIds = filesToDelete.map(file => file.parent_file_id || file.id);
  if (rootFileIds.length > 0) {
    const deletedCerts = await Certificate.destroy({ 
      where: { root_file_id: rootFileIds }
    });
    console.log(`✅ [FOLDER DELETE] ${deletedCerts} certificat(s) supprimé(s) de la BDD`);
  }

  await File.destroy({ where: { dossier_id: dossierId, owner_id: ownerId } });
  await Dossier.destroy({ where: { id: dossierId, owner_id: ownerId } });
};

// DELETE /api/dossiers/:id - Supprimer un dossier et tout son contenu (récursivement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const dossier = await Dossier.findOne({ 
      where: { id: req.params.id, owner_id: req.user.id }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé.' });
    }

    // Récupérer tous les fichiers à supprimer pour les statistiques
    const filesToDelete = await getFilesToDelete(dossier.id, req.user.id);
    const deletedFileStats = filesToDelete.reduce((acc, file) => {
      if (file.mimetype.startsWith('image/')) acc.image++;
      else if (file.mimetype === 'application/pdf') acc.pdf++;
      else if (file.mimetype === 'application/zip') acc.zip++;
      return acc;
    }, { image: 0, pdf: 0, zip: 0 });

    await ActivityLog.create({
      userId: req.user.id,
      actionType: 'FOLDER_DELETE',
      details: {
        dossierId: dossier.id,
        dossierName: dossier.name,
        deletedFileStats,
      },
    });

    await deleteDossierRecursive(dossier.id, req.user.id);

    res.status(204).send(); // No Content
  } catch (error) {
    console.error(`Erreur lors de la suppression du dossier ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du dossier.' });
  }
});

export default router;
