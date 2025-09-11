import express from 'express';
import { Op } from 'sequelize';
import { File, Dossier, Certificate, ActivityLog, Utilisateur } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { deleteCloudinaryFile } from '../utils/cloudinaryStructure.js';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// POST /api/bulk-actions/move - Déplacer des éléments en lot
router.post('/move', authenticateToken, async (req, res) => {
  console.log('🔄 [BULK-MOVE] Requête reçue:', { itemIds: req.body.itemIds, targetDossierId: req.body.targetDossierId, itemType: req.body.itemType });
  const { itemIds, targetDossierId, itemType = 'file' } = req.body;
  
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Liste d\'éléments requise.' });
  }

  if (!targetDossierId) {
    return res.status(400).json({ error: 'Dossier de destination requis.' });
  }

  try {
    // Vérifier que le dossier de destination existe et appartient à l'utilisateur
    const targetDossier = await Dossier.findOne({
      where: { id: targetDossierId, owner_id: req.user.id }
    });

    if (!targetDossier) {
      return res.status(404).json({ error: 'Dossier de destination non trouvé.' });
    }

    let movedCount = 0;
    const errors = [];

    if (itemType === 'file' || itemType === 'image') {
      // Déplacer des fichiers (incluant les images)
      for (const fileId of itemIds) {
        try {
          console.log(`🔍 [BULK-MOVE] Recherche fichier ID: ${fileId}`);
          const file = await File.findOne({
            where: { id: fileId, owner_id: req.user.id }
          });

          if (file) {
            console.log(`✅ [BULK-MOVE] Fichier trouvé: ${file.filename}, déplacement vers dossier ${targetDossierId}`);
            await file.update({ dossier_id: targetDossierId });
            movedCount++;

            // Log de l'activité
            await ActivityLog.create({
              userId: req.user.id,
              actionType: 'FILE_MOVE',
              details: {
                fileId: file.id,
                fileName: file.filename,
                targetDossierId: targetDossierId,
                targetDossierName: targetDossier.name
              }
            });
          } else {
            console.log(`❌ [BULK-MOVE] Fichier ${fileId} non trouvé`);
            errors.push(`Fichier ${fileId} non trouvé`);
          }
        } catch (error) {
          console.error(`❌ [BULK-MOVE] Erreur fichier ${fileId}:`, error);
          errors.push(`Erreur lors du déplacement du fichier ${fileId}: ${error.message}`);
        }
      }
    } else if (itemType === 'dossier') {
      // Déplacer des dossiers
      for (const dossierId of itemIds) {
        try {
          const dossier = await Dossier.findOne({
            where: { id: dossierId, owner_id: req.user.id }
          });

          if (dossier) {
            // Vérifier qu'on ne déplace pas un dossier dans lui-même ou ses enfants
            if (dossierId === targetDossierId) {
              errors.push(`Impossible de déplacer un dossier dans lui-même`);
              continue;
            }

            await dossier.update({ parent_id: targetDossierId });
            movedCount++;

            // Log de l'activité
            await ActivityLog.create({
              userId: req.user.id,
              actionType: 'FOLDER_MOVE',
              details: {
                dossierId: dossier.id,
                dossierName: dossier.name,
                targetDossierId: targetDossierId,
                targetDossierName: targetDossier.name
              }
            });
          } else {
            errors.push(`Dossier ${dossierId} non trouvé`);
          }
        } catch (error) {
          errors.push(`Erreur lors du déplacement du dossier ${dossierId}: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      movedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur lors du déplacement en lot:', error);
    res.status(500).json({ error: 'Erreur serveur lors du déplacement.' });
  }
});

// POST /api/bulk-actions/copy - Copier des éléments en lot
router.post('/copy', authenticateToken, async (req, res) => {
  console.log('📋 [BULK-COPY] Requête reçue:', { itemIds: req.body.itemIds, targetDossierId: req.body.targetDossierId, itemType: req.body.itemType });
  const { itemIds, targetDossierId, itemType = 'file' } = req.body;
  
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Liste d\'éléments requise.' });
  }

  if (!targetDossierId) {
    return res.status(400).json({ error: 'Dossier de destination requis.' });
  }

  try {
    // Vérifier que le dossier de destination existe et appartient à l'utilisateur
    const targetDossier = await Dossier.findOne({
      where: { id: targetDossierId, owner_id: req.user.id }
    });

    if (!targetDossier) {
      return res.status(404).json({ error: 'Dossier de destination non trouvé.' });
    }

    let copiedCount = 0;
    const errors = [];

    if (itemType === 'file' || itemType === 'image') {
      // Copier des fichiers (incluant les images)
      for (const fileId of itemIds) {
        try {
          console.log(` [BULK-COPY] Recherche fichier ID: ${fileId}`);
          const originalFile = await File.findOne({
            where: { id: fileId, owner_id: req.user.id }
          });

          if (originalFile) {
            console.log(` [BULK-COPY] Fichier trouvé: ${originalFile.filename}, copie vers dossier ${targetDossierId}`);
            // Créer une copie du fichier avec un hash unique (64 caractères max)
            const copyTimestamp = Date.now();
            const copyData = `${originalFile.filename}_${copyTimestamp}_${req.user.id}`;
            const uniqueHash = crypto.createHash('sha256').update(copyData).digest('hex');
            
            // Générer une signature unique pour la copie
            const signatureData = `${originalFile.signature}_copy_${copyTimestamp}`;
            const uniqueSignature = crypto.createHash('sha256').update(signatureData).digest('hex');
            
            const copiedFile = await File.create({
              filename: originalFile.filename,
              mimetype: originalFile.mimetype,
              file_url: originalFile.file_url,
              hash: uniqueHash,
              signature: uniqueSignature,
              owner_id: req.user.id,
              dossier_id: targetDossierId,
              version: 1,
              is_latest: true
            });

            copiedCount++;

            // Log de l'activité
            await ActivityLog.create({
              userId: req.user.id,
              actionType: 'FILE_COPY',
              details: {
                originalFileId: originalFile.id,
                copiedFileId: copiedFile.id,
                fileName: originalFile.filename,
                targetDossierId: targetDossierId,
                targetDossierName: targetDossier.name
              }
            });
          } else {
            console.log(`❌ [BULK-COPY] Fichier ${fileId} non trouvé`);
            errors.push(`Fichier ${fileId} non trouvé`);
          }
        } catch (error) {
          console.error(`❌ [BULK-COPY] Erreur fichier ${fileId}:`, error);
          errors.push(`Erreur lors de la copie du fichier ${fileId}: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      copiedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur lors de la copie en lot:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la copie.' });
  }
});

// DELETE /api/bulk-actions/delete - Supprimer des éléments en lot
router.delete('/delete', authenticateToken, async (req, res) => {
  const { itemIds, itemType = 'file' } = req.body;
  
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Liste d\'éléments requise.' });
  }

  try {
    let deletedCount = 0;
    const errors = [];

    if (itemType === 'file') {
      // Supprimer des fichiers
      for (const fileId of itemIds) {
        try {
          const file = await File.findOne({
            where: { id: fileId, owner_id: req.user.id }
          });

          if (file) {
            // Supprimer de Cloudinary si nécessaire
            if (file.file_url) {
              try {
                const { deleteCloudinaryFile } = require('../utils/cloudinaryStructure');
                await deleteCloudinaryFile(file.file_url, file.mimetype);
                console.log(`Fichier supprimé de Cloudinary: ${file.file_url}`);
              } catch (cloudinaryError) {
                console.error(`Erreur suppression Cloudinary pour ${file.file_url}:`, cloudinaryError);
              }
            }
            
            await file.destroy();
            deletedCount++;

            // Log de l'activité
            await ActivityLog.create({
              userId: req.user.id,
              actionType: 'FILE_DELETE',
              details: {
                fileId: file.id,
                fileName: file.filename
              }
            });
          } else {
            errors.push(`Fichier ${fileId} non trouvé`);
          }
        } catch (error) {
          errors.push(`Erreur lors de la suppression du fichier ${fileId}: ${error.message}`);
        }
      }
    } else if (itemType === 'dossier') {
      // Supprimer des dossiers (récursif)
      for (const dossierId of itemIds) {
        try {
          const dossier = await Dossier.findOne({
            where: { id: dossierId, owner_id: req.user.id }
          });

          if (dossier) {
            // Supprimer récursivement (cette logique existe déjà dans dossiers.js)
            await deleteDossierRecursive(dossierId, req.user.id);
            deletedCount++;

            // Log de l'activité
            await ActivityLog.create({
              userId: req.user.id,
              actionType: 'FOLDER_DELETE',
              details: {
                dossierId: dossier.id,
                dossierName: dossier.name
              }
            });
          } else {
            errors.push(`Dossier ${dossierId} non trouvé`);
          }
        } catch (error) {
          errors.push(`Erreur lors de la suppression du dossier ${dossierId}: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur lors de la suppression en lot:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// POST /api/bulk-actions/check-conflicts - Vérifier les conflits avant opération
router.post('/check-conflicts', authenticateToken, async (req, res) => {
  const { itemIds, targetDossierId, operation = 'move' } = req.body;
  
  try {
    const conflicts = [];
    
    // Vérifier les conflits de noms dans le dossier de destination
    for (const itemId of itemIds) {
      const file = await File.findOne({
        where: { id: itemId, owner_id: req.user.id }
      });
      
      if (file) {
        const existingFile = await File.findOne({
          where: {
            filename: file.filename,
            dossier_id: targetDossierId,
            owner_id: req.user.id,
            id: { [require('sequelize').Op.ne]: itemId } // Exclure le fichier lui-même
          }
        });
        
        if (existingFile) {
          conflicts.push({
            itemId: itemId,
            itemName: file.filename,
            conflictType: 'filename',
            message: `Un fichier nommé "${file.filename}" existe déjà dans le dossier de destination`
          });
        }
      }
    }

    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts
    });

  } catch (error) {
    console.error('Erreur lors de la vérification des conflits:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification des conflits.' });
  }
});

// Fonction helper pour suppression récursive (importée de dossiers.js)

const deleteDossierRecursive = async (dossierId, ownerId) => {
  const subDossiers = await Dossier.findAll({ where: { parent_id: dossierId, owner_id: ownerId } });
  for (const subDossier of subDossiers) {
    await deleteDossierRecursive(subDossier.id, ownerId);
  }

  // Supprimer les fichiers de Cloudinary avant de les supprimer de la base de données
  const filesToDelete = await File.findAll({ where: { dossier_id: dossierId, owner_id: ownerId } });
  for (const file of filesToDelete) {
    if (file.file_url) {
      try {
        const { deleteCloudinaryFile } = require('../utils/cloudinaryStructure');
        await deleteCloudinaryFile(file.file_url, file.mimetype);
        console.log(`Fichier supprimé de Cloudinary: ${file.file_url}`);
      } catch (cloudinaryError) {
        console.error(`Erreur suppression Cloudinary pour ${file.file_url}:`, cloudinaryError);
      }
    }
  }

  await File.destroy({ where: { dossier_id: dossierId, owner_id: ownerId } });
  await Dossier.destroy({ where: { id: dossierId, owner_id: ownerId } });
};

// GET /api/bulk-actions/folders-tree - Récupérer l'arbre des dossiers pour sélection
router.get('/folders-tree', authenticateToken, async (req, res) => {
  try {
    console.log('🌳 [BULK-ACTIONS] Récupération de l\'arbre des dossiers');
    
    // Récupérer tous les dossiers de l'utilisateur
    const allFolders = await Dossier.findAll({
      where: { owner_id: req.user.id },
      attributes: ['id', 'name', 'parent_id'],
      order: [['name', 'ASC']]
    });

    // Récupérer le dossier système pour filtrer
    const systemRoot = await Dossier.getSystemRoot();
    
    // Construire l'arbre hiérarchique
    const buildTree = (folders, parentId = systemRoot.id) => {
      return folders
        .filter(folder => folder.parent_id === parentId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          parent_id: folder.parent_id,
          children: buildTree(folders, folder.id)
        }));
    };

    const foldersTree = buildTree(allFolders);
    console.log('✅ [BULK-ACTIONS] Arbre des dossiers construit:', foldersTree.length, 'dossiers racine');
    
    res.json({ folders: foldersTree });
  } catch (error) {
    console.error('❌ [BULK-ACTIONS] Erreur lors de la récupération de l\'arbre des dossiers:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des dossiers.' });
  }
});

export default router;
