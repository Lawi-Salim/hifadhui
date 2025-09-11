import express from 'express';
import { Op, fn, col } from 'sequelize';
import { Utilisateur } from '../models/index.js';
import { ActivityLog } from '../models/index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Récupérer la liste de tous les utilisateurs
 * @access  Private (Admin)
 */
router.get('/users', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await Utilisateur.findAndCountAll({
      where: { role: { [Op.ne]: 'admin' } },
      attributes: ['id', 'username', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/activities
 * @desc    Récupérer les journaux d'activité
 * @access  Private (Admin)
 */
router.get('/activities', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: activities } = await ActivityLog.findAndCountAll({
      where: { '$user.role$': { [Op.ne]: 'admin' } },
      include: [{
        model: Utilisateur,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      activities,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des journaux d\'activité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/activities/summary
 * @desc    Récupérer un résumé des activités par utilisateur
 * @access  Private (Admin)
 */
router.get('/activities/summary', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Étape 1: Récupérer les utilisateurs non-admin avec pagination
    const { count: totalUsers, rows: users } = await Utilisateur.findAndCountAll({
      where: { role: { [Op.ne]: 'admin' } },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    if (users.length === 0) {
      return res.json({ 
        summary: [], 
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
      });
    }

    // Étape 2: Pour chaque utilisateur, trouver sa dernière activité
    const summaryPromises = users.map(async (user) => {
      const lastActivity = await ActivityLog.findOne({
        where: { userId: user.id },
        order: [['created_at', 'DESC'], ['id', 'DESC']], // Tri par date puis par ID pour garantir la dernière
      });

      const totalUserActivities = await ActivityLog.count({
        where: { userId: user.id },
      });

      if (!lastActivity) {
        return {
          id: `no-activity-user-${user.id}`,
          createdAt: user.createdAt, // ou une autre date pertinente
          actionType: 'Aucune activité',
          user: user.toJSON(),
          totalUserActivities: 0,
        };
      }

      return {
        ...lastActivity.toJSON(),
        user: user.toJSON(),
        totalUserActivities,
      };
    });

    const summary = await Promise.all(summaryPromises);
    
    // Trier le résumé final par date de dernière activité
    summary.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      summary,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
      },
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des activités:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/activities/user/:userId
 * @desc    Récupérer les détails et statistiques d'activité pour un utilisateur
 * @access  Private (Admin)
 */
router.get('/activities/user/:userId', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { userId } = req.params;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Récupérer toutes les activités de l'utilisateur pour calculer les statistiques
    const userActivities = await ActivityLog.findAll({ where: { userId } });

    const stats = userActivities.reduce((acc, activity) => {
      switch (activity.actionType) {
        case 'IMAGE_UPLOAD':
          acc.imageUpload++;
          break;
        case 'PDF_UPLOAD':
          acc.pdfUpload++;
          break;
        case 'ZIP_UPLOAD':
          acc.zipUpload++;
          if (activity.details) {
            acc.imageUpload += activity.details.extractedImageCount || 0;
            acc.pdfUpload += activity.details.extractedPdfCount || 0;
          }
          break;
        case 'FOLDER_CREATE':
          acc.folderCreate++;
          break;
        case 'FILE_DELETE':
          acc.deletedItems++;
          if (activity.details) {
            if (activity.details.fileType === 'image') acc.imageUpload--;
            else if (activity.details.fileType === 'pdf') acc.pdfUpload--;
            else if (activity.details.fileType === 'zip') acc.zipUpload--;
          }
          break;
        case 'FOLDER_DELETE':
          acc.deletedItems++;
          acc.folderCreate--; // Décrémente le compteur de dossiers
          if (activity.details && activity.details.deletedFileStats) {
            const { image, pdf, zip } = activity.details.deletedFileStats;
            acc.imageUpload -= image || 0;
            acc.pdfUpload -= pdf || 0;
            acc.zipUpload -= zip || 0;
            acc.deletedItems += (image || 0) + (pdf || 0) + (zip || 0);
          }
          break;
      }
      return acc;
    }, { imageUpload: 0, pdfUpload: 0, zipUpload: 0, folderCreate: 0, deletedItems: 0 });

    // Activités récentes
    const recentActivities = await ActivityLog.findAll({
      where: {
        userId,
        created_at: {
          [Op.gte]: sevenDaysAgo
        }
      },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    res.json({ stats, recentActivities });

  } catch (error) {
    console.error(`Erreur lors de la récupération des détails d'activité pour l'utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
