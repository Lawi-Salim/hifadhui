import express from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import UserSession from '../../models/UserSession.js';
import ActivityLog from '../../models/ActivityLog.js';
import Utilisateur from '../../models/Utilisateur.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/v1/admin/users/:userId/activity - Récupérer l'activité d'un utilisateur
router.get('/:userId/activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Récupérer la session la plus récente
    const lastSession = await UserSession.findOne({
      where: { userId },
      order: [['lastActivity', 'DESC']],
      limit: 1
    });

    // Récupérer les dernières activités depuis les logs
    const recentActivities = await ActivityLog.findAll({
      where: { 
        userId,
        actionType: {
          [Op.in]: ['active', 'inactive', 'session_end', 'page_visible', 'page_hidden']
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Déterminer la vraie dernière activité
    let lastActivity = null;
    let activityType = 'unknown';
    let sessionStatus = 'inactive';

    if (lastSession) {
      lastActivity = lastSession.lastActivity;
      sessionStatus = lastSession.isActive ? 'active' : 'inactive';
    }

    // Vérifier si il y a des activités plus récentes dans les logs
    if (recentActivities.length > 0) {
      const latestLog = recentActivities[0];
      if (!lastActivity || new Date(latestLog.createdAt) > new Date(lastActivity)) {
        lastActivity = latestLog.createdAt;
        activityType = latestLog.actionType;
      }
    }

    // Déterminer le statut de la session
    if (lastSession && lastSession.isActive) {
      const timeSinceLastActivity = Date.now() - new Date(lastActivity).getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      
      if (timeSinceLastActivity > fifteenMinutes) {
        sessionStatus = 'inactive';
      } else {
        sessionStatus = 'active';
      }
    }

    // Récupérer les statistiques d'activité
    const totalSessions = await UserSession.count({
      where: { userId }
    });

    const activeSessions = await UserSession.count({
      where: { 
        userId,
        isActive: true 
      }
    });

    res.json({
      success: true,
      data: {
        userId,
        lastActivity,
        activityType,
        sessionStatus,
        statistics: {
          totalSessions,
          activeSessions,
          lastSessionStart: lastSession?.sessionStart || null,
          lastSessionEnd: lastSession?.sessionEnd || null,
          browser: lastSession?.browser || null,
          os: lastSession?.os || null,
          device: lastSession?.device || null,
          ipAddress: lastSession?.ipAddress || null
        },
        recentActivities: recentActivities.map(activity => ({
          type: activity.actionType,
          timestamp: activity.createdAt,
          details: activity.details
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité utilisateur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération de l\'activité' 
    });
  }
});

// GET /api/v1/admin/users/:userId/sessions - Récupérer les sessions d'un utilisateur
router.get('/:userId/sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await UserSession.findAndCountAll({
      where: { userId },
      order: [['sessionStart', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        sessions: sessions.rows,
        total: sessions.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des sessions' 
    });
  }
});

// GET /api/v1/admin/users/:userId/stats - Récupérer les statistiques d'un utilisateur
router.get('/:userId/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📊 [ADMIN] Récupération des stats pour l\'utilisateur:', userId);
    
    // Importer les modèles nécessaires
    const Utilisateur = (await import('../../models/Utilisateur.js')).default;
    const Fichier = (await import('../../models/Fichier.js')).default;
    const ModerationAction = (await import('../../models/ModerationAction.js')).default;
    const Report = (await import('../../models/Report.js')).default;
    
    // Vérifier que l'utilisateur existe
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Compter les fichiers par type
    const filesCount = await Fichier.count({
      where: { userId },
      attributes: [],
      group: ['type']
    });
    
    // Transformer en objet plus lisible
    const fileStats = {
      images: 0,
      pdfs: 0,
      total: 0
    };
    
    // Compter tous les fichiers
    const totalFiles = await Fichier.count({ where: { userId } });
    fileStats.total = totalFiles;
    
    // Compter par type
    const imageCount = await Fichier.count({ 
      where: { 
        userId,
        type: { [Op.in]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] }
      } 
    });
    const pdfCount = await Fichier.count({ 
      where: { 
        userId,
        type: 'application/pdf'
      } 
    });
    
    fileStats.images = imageCount;
    fileStats.pdfs = pdfCount;
    
    // Calculer l'espace de stockage utilisé
    const storageResult = await Fichier.sum('taille', { where: { userId } });
    const storageBytes = storageResult || 0;
    const storageUsed = formatFileSize(storageBytes);
    
    // Récupérer les actions de modération actives
    const moderationActions = await ModerationAction.findAll({
      where: { 
        userId,
        is_active: true
      }
    });
    
    const moderationStats = {
      warnings: moderationActions.filter(action => action.action_type === 'warning').length,
      suspensions: moderationActions.filter(action => action.action_type === 'suspension').length,
      deletions: moderationActions.filter(action => action.action_type === 'deletion').length
    };
    
    // Compter les signalements reçus
    const reportsReceived = await Report.count({
      where: { reported_user_id: userId }
    });
    
    // Récupérer la dernière activité (sera gérée par l'endpoint activity)
    const lastActivity = null;
    
    const stats = {
      filesCount: fileStats,
      storageUsed,
      lastActivity,
      reportsReceived,
      moderationActions: moderationStats
    };
    
    console.log('✅ [ADMIN] Stats récupérées pour', user.username + ':', stats);
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des stats utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default router;
