import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import UserSession from '../../models/UserSession.js';
import ActivityLog from '../../models/ActivityLog.js';
import { Op } from 'sequelize';

const router = express.Router();

// POST /api/v1/user/activity - Enregistrer l'activité utilisateur
router.post('/activity', authenticateToken, async (req, res) => {
  try {
    console.log('📊 [ACTIVITY] Réception activité utilisateur:', {
      userId: req.user.id,
      type: req.body.type,
      timestamp: req.body.timestamp
    });
    
    const { type, timestamp, userAgent, url, reason } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Enregistrer l'activité dans les logs
    await ActivityLog.create({
      userId,
      actionType: type,
      details: {
        timestamp,
        userAgent,
        url,
        ipAddress,
        reason: reason || null
      }
    });

    // Mettre à jour ou créer la session utilisateur
    const [session] = await UserSession.findOrCreate({
      where: { 
        userId,
        isActive: true
      },
      defaults: {
        userId,
        ipAddress,
        userAgent,
        sessionStart: new Date(timestamp),
        lastActivity: new Date(timestamp),
        isActive: true
      }
    });

    // Mettre à jour la dernière activité
    if (session) {
      await session.update({
        lastActivity: new Date(timestamp),
        isActive: type !== 'session_end'
      });

      // Si c'est une fin de session, marquer la session comme terminée
      if (type === 'session_end') {
        await session.update({
          sessionEnd: new Date(timestamp),
          isActive: false
        });
      }
    }

    console.log('✅ [ACTIVITY] Activité enregistrée avec succès pour:', req.user.username);
    
    res.json({ 
      success: true, 
      message: 'Activité enregistrée avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de l\'enregistrement de l\'activité' 
    });
  }
});

// POST /api/v1/user/heartbeat - Heartbeat pour vérifier la connexion
router.post('/heartbeat', authenticateToken, async (req, res) => {
  try {
    const { timestamp } = req.body;
    const userId = req.user.id;

    // Mettre à jour la dernière activité de la session active
    await UserSession.update(
      { 
        lastActivity: new Date(timestamp || Date.now())
      },
      {
        where: { 
          userId,
          isActive: true
        }
      }
    );

    res.json({ 
      success: true, 
      message: 'Heartbeat reçu',
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors du heartbeat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors du heartbeat' 
    });
  }
});

// GET /api/v1/user/sessions - Récupérer ses propres sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await UserSession.findAndCountAll({
      where: { userId },
      order: [['sessionStart', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'sessionStart', 'sessionEnd', 'lastActivity', 
        'isActive', 'browser', 'os', 'device', 'country', 'city'
      ]
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

export default router;
