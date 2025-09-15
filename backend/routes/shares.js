import express from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { File, FileShare, Utilisateur, Certificate, ActivityLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/v1/files/:id/share
// @desc    Créer un lien de partage pour un fichier
// @access  Private
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Vérifier que le fichier existe et appartient à l'utilisateur
    const file = await File.findOne({
      where: { 
        id: fileId,
        owner_id: req.user.id,
        is_latest: true
      }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé ou vous n\'avez pas la permission'
      });
    }

    // Désactiver les anciens partages pour ce fichier
    await FileShare.update(
      { is_active: false },
      { 
        where: { 
          file_id: fileId,
          created_by: req.user.id,
          is_active: true
        }
      }
    );

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    
    // Expiration dans 24h
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Créer le partage
    const fileShare = await FileShare.create({
      file_id: fileId,
      token: token,
      expires_at: expiresAt,
      created_by: req.user.id,
      is_active: true
    });

    // Log de l'activité
    await ActivityLog.create({
      userId: req.user.id,
      actionType: 'FILE_SHARE_CREATE',
      details: {
        fileId: fileId,
        fileName: file.filename,
        shareId: fileShare.id,
        expiresAt: expiresAt
      }
    });

    // Construire l'URL de partage 
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');
    const shareUrl = `${frontendUrl}/share/${token}`;

    res.status(201).json({
      message: 'Lien de partage créé avec succès',
      shareUrl: shareUrl,
      token: token,
      expiresAt: expiresAt
    });

  } catch (error) {
    console.error('Erreur lors de la création du partage:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du lien de partage'
    });
  }
});

// @route   GET /api/v1/share/:token/meta
// @desc    Obtenir les métadonnées d'un fichier partagé pour Open Graph
// @access  Public
router.get('/:token/meta', async (req, res) => {
  try {
    const token = req.params.token;

    // Trouver le partage actif et non expiré
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
            }
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
      return res.status(404).json({
        error: 'Lien de partage invalide ou expiré'
      });
    }

    const file = fileShare.file;
    const isImage = file.mimetype?.startsWith('image/');
    const isPdf = file.filename?.toLowerCase().endsWith('.pdf');
    
    // Utiliser toujours le favicon comme image d'aperçu pour tous les types de fichiers
    let imageUrl = 'https://hifadhui.site/favicon.png';

    const metadata = {
      title: `${file.filename} - Partagé par ${file.fileUser.username}`,
      description: `Fichier ${isPdf ? 'PDF' : isImage ? 'image' : ''} partagé de manière sécurisée via Hifadhwi. Propriétaire: ${file.fileUser.username}`,
      image: imageUrl,
      url: `https://hifadhui.site/share/${token}`,
      type: isImage ? 'image' : 'document',
      filename: file.filename,
      owner: file.fileUser.username,
      shared_by: fileShare.creator.username
    };

    res.json(metadata);

  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des métadonnées'
    });
  }
});

// @route   GET /api/v1/share/:token
// @desc    Consulter un fichier partagé (accès public)
// @access  Public
router.get('/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const alreadyViewed = req.headers['x-already-viewed'] === 'true';

    // Trouver le partage actif et non expiré
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
            {
              model: Certificate,
              as: 'fileCertificates',
              attributes: ['id', 'pdf_url', 'date_generated']
            }
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
      return res.status(404).json({
        error: 'Lien de partage invalide ou expiré'
      });
    }

    // Incrémenter le compteur d'accès seulement si pas déjà vu dans cette session
    let updatedShare = fileShare;
    if (!alreadyViewed) {
      console.log('🔍 [DEBUG] Incrémentation pour token:', token, 'count actuel:', fileShare.access_count);
      updatedShare = await fileShare.increment('access_count');
      console.log('🔍 [DEBUG] Nouveau count après incrémentation:', updatedShare.access_count);
    } else {
      console.log('🔍 [DEBUG] Session déjà vue, pas d\'incrémentation pour token:', token);
    }

    // Retourner les informations du fichier (sans possibilité de téléchargement)
    res.json({
      file: {
        id: fileShare.file.id,
        filename: fileShare.file.filename,
        mimetype: fileShare.file.mimetype,
        hash: fileShare.file.hash,
        signature: fileShare.file.signature,
        date_upload: fileShare.file.date_upload,
        version: fileShare.file.version,
        owner: fileShare.file.fileUser.username,
        certificates: fileShare.file.fileCertificates,
        file_url: fileShare.file.file_url
      },
      share: {
        created_at: fileShare.created_at,
        expires_at: fileShare.expires_at,
        access_count: updatedShare.access_count,
        shared_by: fileShare.creator.username
      }
    });

  } catch (error) {
    console.error('Erreur lors de la consultation du partage:', error);
    res.status(500).json({
      error: 'Erreur lors de la consultation du fichier partagé'
    });
  }
});

// @route   DELETE /api/v1/files/:id/share
// @desc    Révoquer le partage d'un fichier
// @access  Private
router.delete('/:id/share', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.id;

    // Désactiver tous les partages actifs pour ce fichier
    const [updatedCount] = await FileShare.update(
      { is_active: false },
      { 
        where: { 
          file_id: fileId,
          created_by: req.user.id,
          is_active: true
        }
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        error: 'Aucun partage actif trouvé pour ce fichier'
      });
    }

    // Log de l'activité
    await ActivityLog.create({
      userId: req.user.id,
      actionType: 'FILE_SHARE_REVOKE',
      details: {
        fileId: fileId,
        revokedCount: updatedCount
      }
    });

    res.json({
      message: 'Partage révoqué avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la révocation du partage:', error);
    res.status(500).json({
      error: 'Erreur lors de la révocation du partage'
    });
  }
});

// @route   GET /api/v1/files/:id/shares
// @desc    Obtenir les partages actifs d'un fichier
// @access  Private
router.get('/:id/shares', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.id;

    // Vérifier que le fichier appartient à l'utilisateur
    const file = await db.File.findOne({
      where: { 
        id: fileId,
        owner_id: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // Récupérer les partages actifs
    const shares = await db.FileShare.findAll({
      where: {
        file_id: fileId,
        created_by: req.user.id,
        is_active: true,
        expires_at: {
          [Op.gt]: new Date()
        }
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      shares: shares.map(share => ({
        id: share.id,
        token: share.token,
        expires_at: share.expires_at,
        access_count: share.access_count,
        created_at: share.created_at,
        shareUrl: `${process.env.FRONTEND_URL || (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000')}/share/${share.token}`
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des partages:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des partages'
    });
  }
});

export default router;
