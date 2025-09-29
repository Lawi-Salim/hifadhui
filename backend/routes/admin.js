import express from 'express';
import { Op, fn, col } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Utilisateur, File, Dossier, FileShare, UserSession, ActivityLog, Message, Notification } from '../models/index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import os from 'os';
import fs from 'fs';
import path from 'path';

// Stockage en mémoire des erreurs système (max 100 entrées)
const systemErrors = [];
const MAX_ERRORS = 100;

// Fonction pour ajouter une erreur système
export const addSystemError = (type, message, details = {}) => {
  const error = {
    id: Date.now().toString(),
    type,
    message,
    details,
    timestamp: new Date(),
    severity: details.severity || 'warning'
  };
  
  systemErrors.unshift(error);
  
  // Garder seulement les 100 dernières erreurs
  if (systemErrors.length > MAX_ERRORS) {
    systemErrors.splice(MAX_ERRORS);
  }
  
  console.log(`🚨 [SYSTEM-ERROR] ${type}: ${message}`);
};

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
      attributes: ['id', 'username', 'email', 'role', 'created_at', 'google_id', 'provider', 'avatar_url'],
      order: [['created_at', 'DESC']],
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
      order: [['created_at', 'DESC']],
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
          createdAt: user.created_at, // ou une autre date pertinente
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

/**
 * @route   GET /api/admin/files
 * @desc    Récupérer tous les fichiers de tous les utilisateurs pour l'admin
 * @access  Private (Admin)
 */
router.get('/files', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      user_filter, 
      date_filter, 
      size_filter,
      admin_view = false 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construire les conditions de filtrage
    const whereConditions = {};
    
    // Filtre par type de fichier
    if (type === 'image') {
      whereConditions.mimetype = { [Op.like]: 'image/%' };
    } else if (type === 'pdf') {
      whereConditions.mimetype = { [Op.like]: 'application/pdf%' };
    }
    
    // Filtre par utilisateur
    if (user_filter) {
      whereConditions.userId = user_filter;
    }
    
    // Filtre par date
    if (date_filter) {
      const now = new Date();
      let startDate;
      
      switch (date_filter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        whereConditions.date_upload = { [Op.gte]: startDate };
      }
    }
    
    // Filtre par taille
    if (size_filter) {
      switch (size_filter) {
        case 'small':
          whereConditions.size = { [Op.lt]: 1024 * 1024 }; // < 1MB
          break;
        case 'medium':
          whereConditions.size = { 
            [Op.and]: [
              { [Op.gte]: 1024 * 1024 }, // >= 1MB
              { [Op.lt]: 10 * 1024 * 1024 } // < 10MB
            ]
          };
          break;
        case 'large':
          whereConditions.size = { 
            [Op.and]: [
              { [Op.gte]: 10 * 1024 * 1024 }, // >= 10MB
              { [Op.lt]: 50 * 1024 * 1024 } // < 50MB
            ]
          };
          break;
        case 'xlarge':
          whereConditions.size = { [Op.gte]: 50 * 1024 * 1024 }; // >= 50MB
          break;
      }
    }
    
    // Récupérer les fichiers avec les informations utilisateur
    const { count, rows: files } = await File.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['id', 'username', 'email', 'provider', 'google_id', 'avatar_url'],
        required: true
      }],
      order: [['date_upload', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({
      files,
      totalCount: count,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   DELETE /api/admin/files/batch-delete
 * @desc    Supprimer plusieurs fichiers en lot (admin)
 * @access  Private (Admin)
 */
router.delete('/files/batch-delete', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Liste des fichiers requise' });
    }
    
    // Récupérer les fichiers à supprimer avec leurs informations
    const filesToDelete = await File.findAll({
      where: { id: { [Op.in]: fileIds } },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['id', 'username', 'email']
      }]
    });
    
    if (filesToDelete.length === 0) {
      return res.status(404).json({ error: 'Aucun fichier trouvé' });
    }
    
    // Supprimer les fichiers de Cloudinary et de la base de données
    const deletePromises = filesToDelete.map(async (file) => {
      try {
        // Supprimer de Cloudinary
        try {
          await deleteCloudinaryFile(file.file_url, file.mimetype);
        } catch (cloudinaryError) {
          console.error(`Erreur lors de la suppression Cloudinary pour le fichier ${file.id}:`, cloudinaryError);
          // On continue même si la suppression Cloudinary échoue
        }
        
        // Supprimer de la base de données
        await file.destroy();
        
        // Log de l'activité admin
        await ActivityLog.create({
          userId: file.owner_id,
          actionType: 'ADMIN_FILE_DELETE',
          details: {
            filename: file.filename,
            fileType: file.mimetype?.includes('image') ? 'image' : 'pdf',
            adminId: req.user.id,
            adminUsername: req.user.username
          }
        });
        
        return { success: true, fileId: file.id };
      } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${file.id}:`, error);
        return { success: false, fileId: file.id, error: error.message };
      }
    });
    
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `${successCount} fichier(s) supprimé(s) avec succès`,
      successCount,
      failureCount,
      details: results
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression en lot:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/dashboard/metrics
 * @desc    Récupérer les métriques globales du dashboard
 * @access  Private (Admin)
 */
router.get('/dashboard/metrics', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    // Compter les utilisateurs
    const totalUsers = await Utilisateur.count({
      where: { role: { [Op.ne]: 'admin' } }
    });
    
    // Utilisateurs actifs (connectés dans les 30 derniers jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await ActivityLog.count({
      distinct: true,
      col: 'user_id',
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    // Nouveaux utilisateurs (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await Utilisateur.count({
      where: {
        role: { [Op.ne]: 'admin' },
        created_at: { [Op.gte]: sevenDaysAgo }
      }
    });
    
    // Compter les fichiers
    const totalFiles = await File.count();
    const totalImages = await File.count({
      where: { mimetype: { [Op.like]: 'image/%' } }
    });
    const totalPdfs = await File.count({
      where: { mimetype: { [Op.like]: 'application/pdf%' } }
    });
    
    // Calculer le stockage total
    const storageResult = await File.findOne({
      attributes: [[fn('SUM', col('size')), 'totalStorage']],
      raw: true
    });
    const totalStorage = parseInt(storageResult?.totalStorage || 0);
    
    // Compter les partages actifs
    const activeShares = await FileShare.count({
      where: {
        expires_at: { [Op.gt]: new Date() } // Partages non expirés
      }
    });
    
    res.json({
      totalUsers,
      activeUsers,
      newUsers,
      totalFiles,
      totalImages,
      totalPdfs,
      totalStorage,
      activeShares
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/dashboard/charts
 * @desc    Récupérer les données pour les graphiques
 * @access  Private (Admin)
 */
router.get('/dashboard/charts', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    // Calculer la date de début selon la plage
    let startDate;
    let dateFormat;
    let groupBy;
    
    switch (range) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'day'; // Grouper par jour
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-IW'; // Année-semaine ISO
        groupBy = 'week'; // Grouper par semaine
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM'; // Année-mois
        groupBy = 'month'; // Grouper par mois
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'day';
    }
    
    // Évolution des inscriptions
    const userRegistrations = await Utilisateur.findAll({
      attributes: [
        [fn('TO_CHAR', col('created_at'), dateFormat), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        role: { [Op.ne]: 'admin' },
        createdAt: { [Op.gte]: startDate }
      },
      group: [fn('TO_CHAR', col('created_at'), dateFormat)],
      order: [[fn('TO_CHAR', col('created_at'), dateFormat), 'ASC']],
      raw: true
    });
    
    // Uploads par période - Images
    const dailyImages = await File.findAll({
      attributes: [
        [fn('TO_CHAR', col('date_upload'), dateFormat), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        date_upload: { [Op.gte]: startDate },
        mimetype: { [Op.like]: 'image/%' }
      },
      group: [fn('TO_CHAR', col('date_upload'), dateFormat)],
      order: [[fn('TO_CHAR', col('date_upload'), dateFormat), 'ASC']],
      raw: true
    });
    
    // Uploads par période - PDFs
    const dailyPdfs = await File.findAll({
      attributes: [
        [fn('TO_CHAR', col('date_upload'), dateFormat), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        date_upload: { [Op.gte]: startDate },
        mimetype: { [Op.like]: 'application/pdf%' }
      },
      group: [fn('TO_CHAR', col('date_upload'), dateFormat)],
      order: [[fn('TO_CHAR', col('date_upload'), dateFormat), 'ASC']],
      raw: true
    });
    
    // Fusionner les données par date
    const dailyUploads = [];
    const dateMap = new Map();
    
    // Ajouter les images
    dailyImages.forEach(item => {
      const date = item.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, images: 0, pdfs: 0 });
      }
      dateMap.get(date).images = parseInt(item.count);
    });
    
    // Ajouter les PDFs
    dailyPdfs.forEach(item => {
      const date = item.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, images: 0, pdfs: 0 });
      }
      dateMap.get(date).pdfs = parseInt(item.count);
    });
    
    // Convertir en tableau et trier
    dateMap.forEach(value => dailyUploads.push(value));
    dailyUploads.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Types de fichiers (pour le graphique en secteurs)
    const fileTypes = [
      {
        name: 'Images',
        value: await File.count({ where: { mimetype: { [Op.like]: 'image/%' } } })
      },
      {
        name: 'PDFs',
        value: await File.count({ where: { mimetype: { [Op.like]: 'application/pdf%' } } })
      },
      {
        name: 'Autres',
        value: await File.count({ 
          where: { 
            mimetype: { 
              [Op.and]: [
                { [Op.notLike]: 'image/%' },
                { [Op.notLike]: 'application/pdf%' }
              ]
            }
          }
        })
      }
    ];
    
    // Activité utilisateurs (utilisateurs uniques par jour)
    const userActivity = await ActivityLog.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', fn('DISTINCT', col('user_id'))), 'activeUsers']
      ],
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });
    
    res.json({
      userRegistrations,
      dailyUploads,
      fileTypes: fileTypes.filter(type => type.value > 0),
      userActivity
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données de graphiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/dashboard/alerts
 * @desc    Récupérer les alertes système
 * @access  Private (Admin)
 */
router.get('/dashboard/alerts', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    // Comptes en période de grâce (14 jours)
    const gracePeriodUsers = await Utilisateur.findAll({
      where: {
        deleted_at: { [Op.not]: null },
        deletion_scheduled_at: { [Op.not]: null },
        role: { [Op.ne]: 'admin' }
      },
      attributes: ['id', 'username', 'email', 'deleted_at', 'deletion_scheduled_at'],
      order: [['deletion_scheduled_at', 'ASC']]
    });
    
    // Partages expirés dans les dernières 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredShares = await FileShare.findAll({
      where: {
        expires_at: {
          [Op.and]: [
            { [Op.lt]: new Date() }, // Expirés
            { [Op.gte]: yesterday }  // Dans les dernières 24h
          ]
        }
      },
      include: [{
        model: File,
        as: 'file',
        attributes: ['filename']
      }],
      limit: 10,
      order: [['expires_at', 'DESC']]
    });
    
    // Erreurs système récentes (simulation - à adapter selon vos logs)
    const systemErrors = [];
    
    res.json({
      gracePeriodUsers,
      systemErrors,
      expiredShares
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/reports/data
 * @desc    Récupérer les données de rapports
 * @access  Private (Admin)
 */
router.get('/reports/data', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { type = 'usage', period = 'daily', startDate, endDate } = req.query;
    
    console.log(`🔍 [REPORTS] Requête reçue - Type: ${type}, Période: ${period}, Start: ${startDate}, End: ${endDate}`);
    
    // Calculer les dates par défaut si non fournies
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(); // Inclure toute la journée de fin
    const start = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 jours par défaut pour capturer plus de données
    
    console.log(`📅 [REPORTS] Dates calculées - Start: ${start.toISOString()}, End: ${end.toISOString()}`);
    
    
    let dateFormat, groupByClause;
    
    // Déterminer le format selon la période
    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        groupByClause = fn('TO_CHAR', col('created_at'), 'YYYY-MM-DD');
        break;
      case 'weekly':
        dateFormat = 'YYYY-IW';
        groupByClause = fn('TO_CHAR', col('created_at'), 'YYYY-IW');
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        groupByClause = fn('TO_CHAR', col('created_at'), 'YYYY-MM');
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        groupByClause = fn('TO_CHAR', col('created_at'), 'YYYY-MM-DD');
    }

    let reportData = [];
    let summary = {};

    switch (type) {
      case 'usage':
        // Rapport d'utilisation - uploads par période
        const uploadsData = await File.findAll({
          attributes: [
            [fn('TO_CHAR', col('date_upload'), dateFormat), 'period'],
            [fn('COUNT', col('id')), 'uploads'],
            [fn('SUM', col('size')), 'totalSize'],
            [fn('COUNT', fn('DISTINCT', col('owner_id'))), 'activeUsers']
          ],
          where: {
            date_upload: { [Op.between]: [start, end] }
          },
          group: [fn('TO_CHAR', col('date_upload'), dateFormat)],
          order: [[fn('TO_CHAR', col('date_upload'), dateFormat), 'ASC']],
          raw: true
        });

        reportData = uploadsData.map(item => ({
          period: item.period,
          uploads: parseInt(item.uploads),
          totalSize: parseInt(item.totalSize || 0),
          activeUsers: parseInt(item.activeUsers),
          avgSizePerFile: item.uploads > 0 ? Math.round(parseInt(item.totalSize || 0) / parseInt(item.uploads)) : 0
        }));


        // Résumé pour usage
        const totalUploads = reportData.reduce((sum, item) => sum + item.uploads, 0);
        const totalSize = reportData.reduce((sum, item) => sum + item.totalSize, 0);
        const maxActiveUsers = reportData.length > 0 ? Math.max(...reportData.map(item => item.activeUsers)) : 0;
        
        summary = {
          totalUploads,
          totalSize,
          avgUploadsPerPeriod: reportData.length > 0 ? Math.round(totalUploads / reportData.length) : 0,
          peakActiveUsers: maxActiveUsers
        };
        break;

      case 'users':
        // Rapport utilisateurs - inscriptions par période (requêtes séparées)
        const allUsersData = await Utilisateur.findAll({
          attributes: [
            [fn('TO_CHAR', col('created_at'), dateFormat), 'period'],
            [fn('COUNT', col('id')), 'newUsers']
          ],
          where: {
            role: { [Op.ne]: 'admin' },
            created_at: { [Op.between]: [start, end] }
          },
          group: [fn('TO_CHAR', col('created_at'), dateFormat)],
          order: [[fn('TO_CHAR', col('created_at'), dateFormat), 'ASC']],
          raw: true
        });

        const googleUsersData = await Utilisateur.findAll({
          attributes: [
            [fn('TO_CHAR', col('created_at'), dateFormat), 'period'],
            [fn('COUNT', col('id')), 'googleUsers']
          ],
          where: {
            role: { [Op.ne]: 'admin' },
            provider: 'google',
            created_at: { [Op.between]: [start, end] }
          },
          group: [fn('TO_CHAR', col('created_at'), dateFormat)],
          order: [[fn('TO_CHAR', col('created_at'), dateFormat), 'ASC']],
          raw: true
        });

        const localUsersData = await Utilisateur.findAll({
          attributes: [
            [fn('TO_CHAR', col('created_at'), dateFormat), 'period'],
            [fn('COUNT', col('id')), 'localUsers']
          ],
          where: {
            role: { [Op.ne]: 'admin' },
            provider: 'local',
            created_at: { [Op.between]: [start, end] }
          },
          group: [fn('TO_CHAR', col('created_at'), dateFormat)],
          order: [[fn('TO_CHAR', col('created_at'), dateFormat), 'ASC']],
          raw: true
        });

        // Fusionner les données
        const periodMap = new Map();
        
        allUsersData.forEach(item => {
          periodMap.set(item.period, {
            period: item.period,
            newUsers: parseInt(item.newUsers),
            googleUsers: 0,
            localUsers: 0
          });
        });

        googleUsersData.forEach(item => {
          if (periodMap.has(item.period)) {
            periodMap.get(item.period).googleUsers = parseInt(item.googleUsers);
          }
        });

        localUsersData.forEach(item => {
          if (periodMap.has(item.period)) {
            periodMap.get(item.period).localUsers = parseInt(item.localUsers);
          }
        });

        reportData = Array.from(periodMap.values()).map(item => ({
          ...item,
          googlePercentage: item.newUsers > 0 ? Math.round((item.googleUsers / item.newUsers) * 100) : 0
        }));

        const totalNewUsers = reportData.reduce((sum, item) => sum + item.newUsers, 0);
        const totalGoogleUsers = reportData.reduce((sum, item) => sum + item.googleUsers, 0);
        
        summary = {
          totalNewUsers,
          avgUsersPerPeriod: reportData.length > 0 ? Math.round(totalNewUsers / reportData.length) : 0,
          googleAdoptionRate: totalNewUsers > 0 ? Math.round((totalGoogleUsers / totalNewUsers) * 100) : 0,
          totalPeriods: reportData.length
        };
        break;

      case 'files':
        // Rapport fichiers - types et tailles (requêtes séparées)
        const imagesData = await File.findAll({
          attributes: [
            [fn('TO_CHAR', col('date_upload'), dateFormat), 'period'],
            [fn('COUNT', col('id')), 'images'],
            [fn('AVG', col('size')), 'avgSize'],
            [fn('MAX', col('size')), 'maxSize']
          ],
          where: {
            date_upload: { [Op.between]: [start, end] },
            mimetype: { [Op.like]: 'image/%' }
          },
          group: [fn('TO_CHAR', col('date_upload'), dateFormat)],
          order: [[fn('TO_CHAR', col('date_upload'), dateFormat), 'ASC']],
          raw: true
        });

        const pdfsData = await File.findAll({
          attributes: [
            [fn('TO_CHAR', col('date_upload'), dateFormat), 'period'],
            [fn('COUNT', col('id')), 'pdfs']
          ],
          where: {
            date_upload: { [Op.between]: [start, end] },
            mimetype: { [Op.like]: 'application/pdf%' }
          },
          group: [fn('TO_CHAR', col('date_upload'), dateFormat)],
          order: [[fn('TO_CHAR', col('date_upload'), dateFormat), 'ASC']],
          raw: true
        });

        // Fusionner les données
        const filesPeriodMap = new Map();
        
        imagesData.forEach(item => {
          filesPeriodMap.set(item.period, {
            period: item.period,
            images: parseInt(item.images),
            pdfs: 0,
            avgSize: Math.round(parseFloat(item.avgSize || 0)),
            maxSize: parseInt(item.maxSize || 0)
          });
        });

        pdfsData.forEach(item => {
          if (filesPeriodMap.has(item.period)) {
            filesPeriodMap.get(item.period).pdfs = parseInt(item.pdfs);
          } else {
            filesPeriodMap.set(item.period, {
              period: item.period,
              images: 0,
              pdfs: parseInt(item.pdfs),
              avgSize: 0,
              maxSize: 0
            });
          }
        });

        reportData = Array.from(filesPeriodMap.values()).map(item => ({
          ...item,
          total: item.images + item.pdfs
        }));

        const totalImages = reportData.reduce((sum, item) => sum + item.images, 0);
        const totalPdfs = reportData.reduce((sum, item) => sum + item.pdfs, 0);
        
        summary = {
          totalFiles: totalImages + totalPdfs,
          totalImages,
          totalPdfs,
          imagePercentage: (totalImages + totalPdfs) > 0 ? Math.round((totalImages / (totalImages + totalPdfs)) * 100) : 0
        };
        break;

      case 'storage':
        // Rapport stockage - évolution de l'espace utilisé
        const storageData = await File.findAll({
          attributes: [
            [fn('TO_CHAR', col('date_upload'), dateFormat), 'period'],
            [fn('SUM', col('size')), 'totalSize'],
            [fn('COUNT', col('id')), 'fileCount'],
            [fn('COUNT', fn('DISTINCT', col('owner_id'))), 'uniqueUsers']
          ],
          where: {
            date_upload: { [Op.between]: [start, end] }
          },
          group: [fn('TO_CHAR', col('date_upload'), dateFormat)],
          order: [[fn('TO_CHAR', col('date_upload'), dateFormat), 'ASC']],
          raw: true
        });

        let cumulativeSize = 0;
        reportData = storageData.map(item => {
          cumulativeSize += parseInt(item.totalSize || 0);
          return {
            period: item.period,
            periodSize: parseInt(item.totalSize || 0),
            cumulativeSize,
            fileCount: parseInt(item.fileCount),
            uniqueUsers: parseInt(item.uniqueUsers),
            avgSizePerUser: item.uniqueUsers > 0 ? Math.round(parseInt(item.totalSize || 0) / parseInt(item.uniqueUsers)) : 0
          };
        });

        summary = {
          totalStorageUsed: cumulativeSize,
          avgStoragePerPeriod: reportData.length > 0 ? Math.round(cumulativeSize / reportData.length) : 0,
          totalFiles: reportData.reduce((sum, item) => sum + item.fileCount, 0),
          storageGrowthRate: reportData.length > 1 ? Math.round(((reportData[reportData.length - 1].cumulativeSize - reportData[0].cumulativeSize) / reportData[0].cumulativeSize) * 100) : 0
        };
        break;

      default:
        return res.status(400).json({ error: 'Type de rapport non supporté' });
    }

    const responseData = {
      type,
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      summary,
      data: reportData,
      totalRecords: reportData.length
    };

    console.log(`✅ [REPORTS] Réponse envoyée - ${reportData.length} enregistrements, Type: ${type}`);
    console.log(`📊 [REPORTS] Summary:`, summary);

    res.json(responseData);

  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du rapport' });
  }
});

/**
 * @route   GET /api/admin/system/performance
 * @desc    Récupérer les métriques de performance
 * @access  Private (Admin)
 */
router.get('/system/performance', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test de performance de la base de données
    const dbStartTime = Date.now();
    await sequelize.authenticate();
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Calcul de l'uptime du serveur (approximatif)
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${days}d ${hours}h ${minutes}m`;
    
    // Test API response time
    const apiResponseTime = Date.now() - startTime;
    
    // Status Cloudinary (simulé - vous pouvez ajouter un vrai test)
    const cloudinaryStatus = 'operational';
    
    res.json({
      apiResponseTime,
      dbResponseTime,
      cloudinaryStatus,
      uptime
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des performances:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des performances' });
  }
});

/**
 * @route   GET /api/admin/system/resources
 * @desc    Récupérer l'utilisation des ressources
 * @access  Private (Admin)
 */
router.get('/system/resources', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    // Calcul de l'utilisation du stockage basé sur les fichiers
    const totalFilesSize = await File.sum('size') || 0;
    
    // Nombre total de fichiers
    const totalFiles = await File.count();
    
    // Calcul approximatif de l'espace disque (basé sur les fichiers stockés)
    const estimatedDiskUsage = Math.min((totalFilesSize / (1024 * 1024 * 1024)) * 10, 100); // Estimation
    
    // Bande passante approximative (basée sur la taille des fichiers uploadés ce mois)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyUploadsSize = await File.sum('size', {
      where: {
        date_upload: {
          [Op.gte]: thisMonth
        }
      }
    }) || 0;
    
    // Quota Cloudinary (valeurs réalistes)
    const cloudinaryQuota = 25 * 1024 * 1024 * 1024; // 25 GB
    const cloudinaryUsed = totalFilesSize;
    
    res.json({
      diskUsage: Math.round(estimatedDiskUsage * 10) / 10,
      bandwidth: monthlyUploadsSize,
      cloudinaryQuota,
      cloudinaryUsed,
      totalFiles,
      totalStorage: totalFilesSize
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des ressources' });
  }
});

/**
 * @route   GET /api/admin/system/errors
 * @desc    Récupérer les erreurs système récentes
 * @access  Private (Admin)
 */
router.get('/system/errors', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    // Filtrer les erreurs par type et récence (dernières 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentErrors = systemErrors.filter(error => 
      error.timestamp > last24h
    ).slice(0, 20); // Max 20 erreurs récentes
    
    const cloudinaryErrors = systemErrors.filter(error => 
      error.type.includes('cloudinary') && error.timestamp > last24h
    ).slice(0, 10);
    
    const emailErrors = systemErrors.filter(error => 
      error.type.includes('email') && error.timestamp > last24h
    ).slice(0, 10);
    
    res.json({
      recentErrors,
      cloudinaryErrors,
      emailErrors,
      totalErrors: systemErrors.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des erreurs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des erreurs' });
  }
});


router.get('/cleanup/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const stats = await getCleanupStats();
    
    if (!stats) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }

    console.log('📊 [CLEANUP] Statistiques demandées:', stats);
    res.json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des stats de nettoyage:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

/**
 * @route   POST /api/admin/cleanup/manual
 * @desc    Déclencher un nettoyage manuel
 * @access  Private (Admin)
 */
router.post('/cleanup/manual', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    console.log('🧹 [CLEANUP] Nettoyage manuel déclenché par admin');
    
    const result = await manualCleanup();
    
    res.json({
      message: 'Nettoyage effectué avec succès',
      deleted: result.deleted,
      stats: result.stats
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage manuel:', error);
    res.status(500).json({ error: 'Erreur serveur lors du nettoyage' });
  }
});

/**
 * @route   DELETE /api/admin/cleanup/user/:userId
 * @desc    Supprimer toutes les sessions d'un utilisateur (demande RGPD)
 * @access  Private (Admin)
 */
router.delete('/cleanup/user/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🧹 [CLEANUP] Suppression sessions utilisateur ${userId} (demande RGPD)`);
    
    const deleted = await cleanupUserSessions(userId);
    
    res.json({
      message: 'Sessions utilisateur supprimées avec succès',
      deleted: deleted,
      userId: userId
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des sessions utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

/**
 * @route   GET /api/admin/reports
 * @desc    Récupérer la liste des signalements
 * @access  Private (Admin)
 */
router.get('/reports', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { status = 'all', type = 'all', page = 1, limit = 20 } = req.query;
    
    // Pour l'instant, retourner une liste vide car le système de signalement n'est pas encore implémenté
    const reports = [];
    const totalReports = 0;
    
    console.log('📋 [REPORTS] Demande de signalements:', { status, type, page, limit });
    
    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        hasNext: false,
        hasPrev: false
      },
      filters: {
        status,
        type
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des signalements' });
  }
});

/**
 * @route   PUT /api/admin/reports/:id
 * @desc    Mettre à jour le statut d'un signalement
 * @access  Private (Admin)
 */
router.put('/reports/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log(`📋 [REPORTS] Mise à jour signalement ${id}:`, { status, adminNotes });
    
    // Pour l'instant, simuler une mise à jour réussie
    res.json({
      message: 'Signalement mis à jour avec succès',
      report: {
        id,
        status,
        adminNotes,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du signalement:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

/**
 * @route   DELETE /api/admin/reports/:id
 * @desc    Supprimer un signalement
 * @access  Private (Admin)
 */
router.delete('/reports/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 [REPORTS] Suppression signalement ${id}`);
    
    // Pour l'instant, simuler une suppression réussie
    res.json({
      message: 'Signalement supprimé avec succès',
      deletedId: id
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du signalement:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

// ========================================
// ROUTES DE TEST DES NOTIFICATIONS ADMIN
// ========================================

/**
 * @route   POST /api/admin/notifications/test/disk-space
 * @desc    Tester la notification d'espace disque
 * @access  Private (Admin)
 */
router.post('/notifications/test/disk-space', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { usagePercentage = 92 } = req.body;
    
    await NotificationService.notifyDiskSpaceAlert(
      usagePercentage, 
      100 - usagePercentage, // espace disponible
      100 // espace total
    );
    
    res.json({
      success: true,
      message: `Notification d'espace disque envoyée (${usagePercentage}% utilisé)`
    });
  } catch (error) {
    console.error('Erreur test notification espace disque:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * @route   POST /api/admin/notifications/test/security
 * @desc    Tester la notification de sécurité
 * @access  Private (Admin)
 */
router.post('/notifications/test/security', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { 
      ipAddress = '192.168.1.100', 
      failedAttempts = 5,
      email = 'test@example.com'
    } = req.body;
    
    await NotificationService.notifySuspiciousLogin(
      ipAddress,
      'Test User Agent',
      failedAttempts,
      email
    );
    
    res.json({
      success: true,
      message: `Notification de sécurité envoyée (${failedAttempts} tentatives depuis ${ipAddress})`
    });
  } catch (error) {
    console.error('Erreur test notification sécurité:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * @route   POST /api/admin/notifications/test/critical-error
 * @desc    Tester la notification d'erreur critique
 * @access  Private (Admin)
 */
router.post('/notifications/test/critical-error', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { message = 'Erreur de test critique' } = req.body;
    
    await NotificationService.notifyCriticalError(
      message,
      'Stack trace de test...',
      { 
        testMode: true,
        triggeredBy: req.user.username,
        timestamp: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `Notification d'erreur critique envoyée: ${message}`
    });
  } catch (error) {
    console.error('Erreur test notification erreur critique:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * @route   POST /api/admin/notifications/test/maintenance
 * @desc    Tester la notification de maintenance
 * @access  Private (Admin)
 */
router.post('/notifications/test/maintenance', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const maintenanceDate = new Date();
    maintenanceDate.setDate(maintenanceDate.getDate() + 1); // Demain
    maintenanceDate.setHours(2, 0, 0, 0); // 2h du matin
    
    await NotificationService.notifyScheduledMaintenance(
      maintenanceDate,
      '2 heures',
      'Maintenance de test programmée par un administrateur'
    );
    
    res.json({
      success: true,
      message: `Notification de maintenance envoyée pour ${maintenanceDate.toLocaleString()}`
    });
  } catch (error) {
    console.error('Erreur test notification maintenance:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * @route   POST /api/admin/notifications/test/stats
 * @desc    Tester les statistiques périodiques
 * @access  Private (Admin)
 */
router.post('/notifications/test/stats', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { period = 'weekly' } = req.body;
    
    await NotificationService.notifyPeriodicStats(period);
    
    res.json({
      success: true,
      message: `Statistiques ${period} envoyées`
    });
  } catch (error) {
    console.error('Erreur test notification statistiques:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * @route   POST /api/admin/notifications/test/inactive-users
 * @desc    Tester la notification d'utilisateurs inactifs
 * @access  Private (Admin)
 */
router.post('/notifications/test/inactive-users', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    await NotificationService.notifyInactiveUsers(days);
    
    res.json({
      success: true,
      message: `Vérification des utilisateurs inactifs (${days} jours) effectuée`
    });
  } catch (error) {
    console.error('Erreur test notification utilisateurs inactifs:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

/**
 * @route   GET /api/admin/notifications/security-stats
 * @desc    Obtenir les statistiques de sécurité
 * @access  Private (Admin)
 */
router.get('/notifications/security-stats', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const stats = SecurityMonitor.getSecurityStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erreur récupération stats sécurité:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * @route   POST /api/admin/scheduler/trigger/:task
 * @desc    Déclencher manuellement une tâche programmée
 * @access  Private (Admin)
 */
router.post('/scheduler/trigger/:task', [authenticateToken, authorizeAdmin], async (req, res) => {
  try {
    const { task } = req.params;
    const { period, days } = req.body;
    
    let result;
    
    switch (task) {
      case 'disk-space':
        result = await SchedulerService.triggerDiskSpaceCheck();
        break;
      case 'stats':
        result = await SchedulerService.triggerStats(period || 'weekly');
        break;
      case 'inactive-users':
        result = await SchedulerService.triggerInactiveUsersCheck(days || 30);
        break;
      default:
        return res.status(400).json({ error: 'Tâche non reconnue' });
    }
    
    res.json({
      success: true,
      message: `Tâche ${task} déclenchée avec succès`,
      result
    });
  } catch (error) {
    console.error(`Erreur déclenchement tâche ${req.params.task}:`, error);
    res.status(500).json({ error: 'Erreur lors du déclenchement de la tâche' });
  }
});

/**
 * @route   GET /api/admin/technical
 * @desc    Récupérer les données techniques (connexions, tentatives d'emails non autorisés, etc.)
 * @access  Admin
 */
router.get('/technical', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log(`🚀 [TECHNICAL-ROUTE] Route /technical appelée !`);
  console.log(`🚀 [TECHNICAL-ROUTE] Query params:`, req.query);
  
  try {
    const { filter = 'all', timeRange = '24h', page = 1, limit = 10 } = req.query;
    
    console.log(`🔍 [TECHNICAL] Requête données techniques: filter=${filter}, timeRange=${timeRange}, page=${page}`);
    
    // Calculer la période selon timeRange
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    // Récupérer les sessions utilisateur (connexions)
    const connections = await UserSession.findAll({
      where: {
        session_start: { [Op.gte]: startDate }
      },
      include: [{
        model: Utilisateur,
        as: 'user',
        attributes: ['username', 'email']
      }],
      order: [['session_start', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      raw: false // Garder les objets Sequelize pour accéder aux dataValues
    });

    // Debug: Vérifier toutes les notifications de sécurité récentes
    const allSecurityNotifications = await Notification.findAll({
      where: {
        type: 'security',
        createdAt: { [Op.gte]: startDate }
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    console.log(`🔍 [TECHNICAL] Notifications de sécurité trouvées: ${allSecurityNotifications.length}`);
    allSecurityNotifications.forEach(notif => {
      console.log(`📋 [TECHNICAL] Notification: ID=${notif.id}, Title="${notif.title}", Type=${notif.type}`);
    });

    // Récupérer les tentatives d'emails non autorisés depuis les notifications
    // Utiliser les métadonnées pour une recherche plus fiable
    const unauthorizedAttempts = await Notification.findAll({
      where: {
        type: 'security',
        [Op.or]: [
          { title: { [Op.like]: '%domaine non autorisé%' } },
          { title: { [Op.like]: '%Tentative avec domaine non autorisé%' } },
          { 
            metadata: {
              type: 'unauthorized_domain_attempt'
            }
          }
        ],
        createdAt: { [Op.gte]: startDate }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Statistiques générales
    const totalConnections = await UserSession.count({
      where: { session_start: { [Op.gte]: startDate } }
    });

    const uniqueIPs = await UserSession.count({
      distinct: true,
      col: 'ip_address',
      where: { session_start: { [Op.gte]: startDate } }
    });

    // Statistiques des tentatives d'emails non autorisés
    const totalUnauthorizedAttempts = await Notification.count({
      where: {
        type: 'security',
        [Op.or]: [
          { title: { [Op.like]: '%domaine non autorisé%' } },
          { title: { [Op.like]: '%Tentative avec domaine non autorisé%' } },
          { 
            metadata: {
              type: 'unauthorized_domain_attempt'
            }
          }
        ],
        createdAt: { [Op.gte]: startDate }
      }
    });

    console.log(`📊 [TECHNICAL] Tentatives non autorisées trouvées: ${totalUnauthorizedAttempts}`);

    const uniqueUnauthorizedEmails = await Notification.count({
      distinct: true,
      col: 'message',
      where: {
        type: 'security',
        [Op.or]: [
          { title: { [Op.like]: '%domaine non autorisé%' } },
          { title: { [Op.like]: '%Tentative avec domaine non autorisé%' } },
          { 
            metadata: {
              type: 'unauthorized_domain_attempt'
            }
          }
        ],
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Calculer les IPs uniques depuis les métadonnées des notifications
    const allUnauthorizedNotifications = await Notification.findAll({
      where: {
        type: 'security',
        [Op.or]: [
          { title: { [Op.like]: '%domaine non autorisé%' } },
          { title: { [Op.like]: '%Tentative avec domaine non autorisé%' } },
          { 
            metadata: {
              type: 'unauthorized_domain_attempt'
            }
          }
        ],
        createdAt: { [Op.gte]: startDate }
      }
    });

    const uniqueUnauthorizedIPs = [...new Set(
      allUnauthorizedNotifications
        .map(notif => notif.metadata?.ipAddress || notif.metadata?.ip)
        .filter(ip => ip && ip !== 'IP inconnue')
    )].length;

    console.log(`📊 [TECHNICAL] IPs uniques trouvées: ${uniqueUnauthorizedIPs}`);
    console.log(`📊 [TECHNICAL] Connexions trouvées: ${connections.length}`);
    
    // Debug: Afficher les données brutes des connexions
    connections.forEach((conn, index) => {
      const data = conn.dataValues || conn;
      console.log(`🔍 [TECHNICAL] Connexion ${index + 1}:`, {
        id: data.id,
        user_id: data.userId,
        ipAddress: data.ipAddress,              // ✅ Utilise les alias Sequelize
        userAgent: data.userAgent?.substring(0, 50) + '...',  // ✅ Utilise les alias Sequelize
        sessionStart: data.sessionStart,       // ✅ Utilise les alias Sequelize
        browser: data.browser,
        browserVersion: data.browserVersion,    // ✅ Ajouté pour debug
        os: data.os,
        city: data.city,                       // ✅ Ajouté pour debug
        country: data.country,
        countryCode: data.countryCode,         // ✅ Ajouté pour debug
        isp: data.isp,                         // ✅ Ajouté pour debug
        timezone: data.timezone,               // ✅ Ajouté pour debug
        isActive: data.isActive,               // ✅ Ajouté pour debug
        sessionEnd: data.sessionEnd,           // ✅ Ajouté pour debug
        user: conn.user ? {
          username: conn.user.dataValues?.username || conn.user.username,
          email: conn.user.dataValues?.email || conn.user.email
        } : 'PAS D\'UTILISATEUR'
      });
    });
    
    // Connexions récupérées avec succès

    // Analyser les navigateurs depuis les connexions
    const browserStats = {};
    connections.forEach(conn => {
      const data = conn.dataValues || conn;
      const browser = data.browser || 'Inconnu';
      browserStats[browser] = (browserStats[browser] || 0) + 1;
    });

    const browsers = Object.entries(browserStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Analyser les OS depuis les connexions
    const osStats = {};
    connections.forEach(conn => {
      const data = conn.dataValues || conn;
      const os = data.os || 'Inconnu';
      osStats[os] = (osStats[os] || 0) + 1;
    });

    const operatingSystems = Object.entries(osStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    console.log(`📊 [TECHNICAL] Navigateurs trouvés:`, browsers);
    console.log(`📊 [TECHNICAL] OS trouvés:`, operatingSystems);

    // Formater les tentatives d'emails non autorisés
    const formattedUnauthorizedAttempts = unauthorizedAttempts.map(notification => {
      const metadata = notification.metadata || {};
      
      // Métadonnées extraites des notifications
      
      return {
        id: notification.id,
        email: metadata.email || 'Email inconnu',
        domain: metadata.domain || 'Domaine inconnu',
        action: metadata.action || 'register',
        ipAddress: metadata.ipAddress || metadata.ip || 'IP inconnue', // Frontend cherche ipAddress
        userAgent: metadata.userAgent || 'User-Agent inconnu',
        timestamp: notification.createdAt
      };
    });

    // Formater les connexions pour le frontend
    const formattedConnections = connections.map(conn => {
        const data = conn.dataValues || conn;
        return {
          id: data.id,
          user: conn.user ? {
            username: conn.user.dataValues?.username || conn.user.username,
            email: conn.user.dataValues?.email || conn.user.email
          } : null,
          userEmail: conn.user ? (conn.user.dataValues?.email || conn.user.email) : 'Anonyme',  // ✅ Ajouté : Frontend utilise userEmail pour la recherche
          userId: data.userId,                 // ✅ Ajouté : ID utilisateur pour SessionDetailModal
          ipAddress: data.ipAddress,           // ✅ RE-CORRIGÉ : Sequelize utilise les alias du modèle
          userAgent: data.userAgent,          // ✅ RE-CORRIGÉ : Sequelize utilise les alias du modèle
          createdAt: data.sessionStart,       // ✅ RE-CORRIGÉ : Sequelize utilise les alias du modèle
          timestamp: data.sessionStart,       // ✅ RE-CORRIGÉ : Sequelize utilise les alias du modèle
          sessionStart: data.sessionStart,    // ✅ Ajouté : Début de session pour SessionDetailModal
          sessionEnd: data.sessionEnd,        // ✅ Ajouté : Fin de session pour SessionDetailModal
          isActive: data.isActive,            // ✅ Ajouté : Statut actif pour SessionDetailModal
          location: `${data.city || 'Inconnue'}, ${data.country || 'Inconnu'}`,
          browser: data.browser,
          browserVersion: data.browserVersion,  // ✅ Ajouté : Version du navigateur
          os: data.os,
          device: data.device,
          country: data.country,
          city: data.city,                     // ✅ Ajouté : Ville pour le frontend
          countryCode: data.countryCode,      // ✅ RE-CORRIGÉ : Sequelize utilise les alias du modèle
          isp: data.isp,                      // ✅ Ajouté : ISP pour SessionDetailModal
          timezone: data.timezone,            // ✅ Ajouté : Fuseau horaire pour SessionDetailModal
          region: data.region,                // ✅ Ajouté : Région pour localisation complète
          isSuspicious: data.isSuspicious || false,  // ✅ RE-CORRIGÉ : Sequelize utilise les alias du modèle
          suspiciousReason: data.suspiciousReason    // ✅ Ajouté : Raison suspicion pour SessionDetailModal
        };
    });

    // Debug: Afficher les connexions formatées
    console.log(`🔍 [TECHNICAL] Connexions formatées pour le frontend:`, formattedConnections.map(conn => ({
      id: conn.id,
      userEmail: conn.userEmail,
      ipAddress: conn.ipAddress,
      timestamp: conn.timestamp,
      location: conn.location,      // ✅ Ajouté pour debug
      browser: conn.browser,
      browserVersion: conn.browserVersion,  // ✅ Ajouté pour debug
      os: conn.os,
      city: conn.city,              // ✅ Ajouté pour debug
      country: conn.country,        // ✅ Ajouté pour debug
      countryCode: conn.countryCode, // ✅ Ajouté pour debug
      userId: conn.userId,          // ✅ Ajouté pour debug
      isp: conn.isp,                // ✅ Ajouté pour debug
      timezone: conn.timezone,      // ✅ Ajouté pour debug
      isActive: conn.isActive,      // ✅ Ajouté pour debug
      sessionEnd: conn.sessionEnd   // ✅ Ajouté pour debug
    })));

    res.json({
      connections: formattedConnections,
      unauthorizedAttempts: formattedUnauthorizedAttempts,
      browsers: browsers,
      operatingSystems: operatingSystems,
      stats: {
        totalConnections,
        uniqueIPs,
        suspiciousActivity: 0, // À implémenter selon vos critères
        topCountries: [] // À implémenter si vous avez des données de géolocalisation
      },
      unauthorizedStats: {
        totalAttempts: totalUnauthorizedAttempts,
        uniqueEmails: uniqueUnauthorizedEmails,
        uniqueIPs: uniqueUnauthorizedIPs,
        topDomains: [] // À implémenter
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(Math.max(totalConnections, totalUnauthorizedAttempts) / parseInt(limit)),
        totalItems: Math.max(totalConnections, totalUnauthorizedAttempts),
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(Math.max(totalConnections, totalUnauthorizedAttempts) / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données techniques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des données techniques',
      details: error.message 
    });
  }
});

export default router;
