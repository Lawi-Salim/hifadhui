const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { Dossier, File, ActivityLog } = require('../models'); // Assurez-vous que les modèles sont correctement importés
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload').upload; // Pour l'upload Cloudinary
const AdmZip = require('adm-zip');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const { getUserFileConfig, getFileType } = require('../utils/cloudinaryStructure');

// POST /api/dossiers - Créer un nouveau dossier
router.post('/', authenticateToken, async (req, res) => {
  const { name, parent_id = null } = req.body; // parent_id est optionnel
  if (!name) {
    return res.status(400).json({ error: 'Le nom du dossier est requis.' });
  }

  try {
    // Vérifier l'unicité du nom dans le même dossier parent
    const existingDossier = await Dossier.findOne({ 
      where: { 
        name, 
        owner_id: req.user.id,
        parent_id: parent_id
      } 
    });
    if (existingDossier) {
      return res.status(409).json({ error: 'Un dossier avec ce nom existe déjà à cet emplacement.' });
    }

    const newDossier = await Dossier.create({
      name,
      owner_id: req.user.id,
      parent_id,
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
    const dossiers = await Dossier.findAll({
      where: { 
        owner_id: req.user.id,
        parent_id: null // On ne récupère que les dossiers à la racine
      },
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

// GET /api/dossiers/by-path/:path - Récupérer un dossier par son chemin hiérarchique
router.get('/by-path/:path', authenticateToken, async (req, res) => {
  try {
    const pathParts = decodeURIComponent(req.params.path).split('/').filter(Boolean);
    let currentDossier = null;
    let parentId = null;

    // Parcourir le chemin pour trouver le dossier final
    for (const folderName of pathParts) {
      currentDossier = await Dossier.findOne({
        where: { 
          name: folderName,
          owner_id: req.user.id,
          parent_id: parentId
        }
      });

      if (!currentDossier) {
        return res.status(404).json({ error: 'Dossier non trouvé dans le chemin spécifié.' });
      }

      parentId = currentDossier.id;
    }

    if (!currentDossier) {
      return res.status(404).json({ error: 'Chemin de dossier invalide.' });
    }

    // Récupérer les fichiers et sous-dossiers
    const files = await File.findAll({
      where: { dossier_id: currentDossier.id, owner_id: req.user.id },
      order: [['filename', 'ASC']]
    });

    const subDossiers = await Dossier.findAll({
      where: { parent_id: currentDossier.id, owner_id: req.user.id },
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

    // Ajouter le chemin hiérarchique aux sous-dossiers
    const subDossiersWithPath = subDossiers.map(subDossier => ({
      ...subDossier.dataValues,
      hierarchicalPath: `${req.params.path}/${subDossier.name}`
    }));

    const ancestors = await getAncestors(currentDossier.parent_id, req.user.id);

    currentDossier.dataValues.dossierFiles = files;
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
        order: [['filename', 'ASC']]
      });

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
        return [...ancestorsList.map(a => a.name), currentName].join('/');
      };
      
      const currentPath = buildPath(ancestors, dossier.name);
      
      const subDossiersWithPath = subDossiers.map(subDossier => ({
        ...subDossier.dataValues,
        hierarchicalPath: `${currentPath}/${subDossier.name}`
      }));

      // Attacher les résultats à l'objet dossier pour la réponse JSON
      dossier.dataValues.dossierFiles = files;
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

    // Vérifier si un autre dossier du même nom existe déjà dans le même dossier parent
    const existingDossier = await Dossier.findOne({ 
      where: { 
        name,
        owner_id: req.user.id,
        parent_id: dossier.parent_id
      }
    });

    if (existingDossier && existingDossier.id !== dossier.id) {
      return res.status(409).json({ error: 'Un dossier avec ce nom existe déjà à cet emplacement.' });
    }

    const oldDossierName = dossier.name;
    dossier.name = name;
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
  for (const subDossier of subDossiers) {
    await deleteDossierRecursive(subDossier.id, ownerId);
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

module.exports = router;
