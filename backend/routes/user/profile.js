import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import ModerationAction from '../../models/ModerationAction.js';
import Report from '../../models/Report.js';
import File from '../../models/File.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/v1/user/profile/stats - Récupérer ses propres statistiques
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📊 [USER-PROFILE] Récupération des stats pour l\'utilisateur:', userId);
    
    // Récupérer les actions de modération actives pour cet utilisateur
    const moderationActions = await ModerationAction.findAll({
      where: { 
        user_id: userId,
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
    
    // Compter les fichiers (optionnel, pour info)
    const totalFiles = await File.count({ where: { owner_id: userId } });
    
    const stats = {
      moderationActions: moderationStats,
      reportsReceived,
      totalFiles
    };
    
    console.log('✅ [USER-PROFILE] Stats récupérées pour', req.user.username + ':', stats);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des stats utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

export default router;
