import { Router } from 'express';
import { Op } from 'sequelize';
import Notification from '../models/Notification.js';
import { Utilisateur } from '../models/index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import SchedulerService from '../services/schedulerService.js';

const router = Router();

// Middleware silencieux pour les notifications (logs supprimés pour performance)
router.use((req, res, next) => {
  next();
});

router.use(authenticateToken);
router.use(authorizeAdmin);

/**
 * GET /api/v1/notifications
 * Récupère toutes les notifications pour l'utilisateur connecté
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, category = 'all', type, status, priority, search } = req.query;

    // S'assurer que page et limit sont des nombres valides
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    // Construction des filtres
    const where = {};
    
    // Filtrage par catégorie (pour les onglets du frontend)
    if (category) {
      switch (category) {
        case 'unread':
          where.status = 'unread';
          break;
        case 'alerts':
          // Alertes = notifications de sécurité OU priorité urgente/high
          where[Op.or] = [
            { type: 'security' },
            { priority: 'urgent' },
            { priority: 'high' }
          ];
          break;
        case 'info':
          // Informations = notifications système avec priorité normale/low
          where[Op.and] = [
            { type: 'system' },
            { priority: { [Op.in]: ['normal', 'low'] } }
          ];
          break;
        // 'all' ou autre = pas de filtre supplémentaire
      }
    }
    
    // Filtres individuels (priorité sur category)
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Récupération des notifications
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'], // Urgent en premier
        ['createdAt', 'DESC']
      ],
      limit: limitNum,
      offset,
      // include: [
      //   {
      //     model: Utilisateur,
      //     as: 'user',
      //     attributes: ['id', 'username', 'email'],
      //     required: false
      //   }
      // ]
    });

    // Statistiques correspondant aux catégories du frontend
    const stats = await Promise.all([
      // Total
      Notification.count(),
      // Non lues
      Notification.count({ where: { status: 'unread' } }),
      // Alertes (sécurité OU priorité urgente/high)
      Notification.count({ 
        where: {
          [Op.or]: [
            { type: 'security' },
            { priority: 'urgent' },
            { priority: 'high' }
          ]
        }
      }),
      // Informations (système avec priorité normale/low)
      Notification.count({ 
        where: {
          [Op.and]: [
            { type: 'system' },
            { priority: { [Op.in]: ['normal', 'low'] } }
          ]
        }
      })
    ]);

    // Log de vérification temporaire (sera supprimé après test)
    if (category) {
      console.log(`✅ [NOTIFICATIONS-VERIFY] Filtrage '${category}': ${notifications.length}/${count} notifications`);
    }

    res.json({
      notifications,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(count / limitNum),
        hasPrevPage: pageNum > 1
      },
      stats: {
        total: stats[0],
        unread: stats[1],
        alerts: stats[2],  // Alertes (sécurité + urgent/high)
        info: stats[3],    // Informations (système normal/low)
        // Garder les anciennes stats pour compatibilité
        security: stats[2], // Même que alerts pour l'instant
        system: stats[3]    // Même que info pour l'instant
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des notifications' 
    });
  }
});

/**
 * GET /api/v1/notifications/stats
 * Récupère les statistiques des notifications
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total: await Notification.count(),
      unread: await Notification.count({ where: { status: 'unread' } }),
      read: await Notification.count({ where: { status: 'read' } }),
      archived: await Notification.count({ where: { status: 'archived' } }),
      byType: {},
      byPriority: {},
      recent: await Notification.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
          }
        }
      })
    };

    // Stats par type
    const types = ['system', 'security', 'user_activity', 'file_activity', 'email', 'maintenance', 'backup', 'storage', 'error', 'success'];
    for (const type of types) {
      stats.byType[type] = await Notification.count({ where: { type } });
    }

    // Stats par priorité
    const priorities = ['low', 'normal', 'high', 'urgent'];
    for (const priority of priorities) {
      stats.byPriority[priority] = await Notification.count({ where: { priority } });
    }

    // Stats par catégorie (pour correspondre aux onglets du frontend)
    // Alertes = notifications de sécurité OU priorité urgente/high
    stats.alerts = await Notification.count({
      where: {
        [Op.or]: [
          { type: 'security' },
          { priority: 'urgent' },
          { priority: 'high' }
        ]
      }
    });

    // Informations = notifications système avec priorité normale/low
    stats.info = await Notification.count({
      where: {
        [Op.and]: [
          { type: 'system' },
          { priority: { [Op.in]: ['normal', 'low'] } }
        ]
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * GET /api/v1/notifications/:id
 * Récupère une notification spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id, {
      // include: [
      //   {
      //     model: Utilisateur,
      //     as: 'user',
      //     attributes: ['id', 'username', 'email'],
      //     required: false
      //   }
      // ]
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Erreur lors de la récupération de la notification:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la notification' });
  }
});

/**
 * POST /api/v1/notifications
 * Crée une nouvelle notification
 */
router.post('/', async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      priority = 'normal',
      userId = null,
      relatedEntityType = null,
      relatedEntityId = null,
      actionUrl = null,
      metadata = {},
      expiresAt = null
    } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({ 
        error: 'Le titre et le message sont requis' 
      });
    }

    const notification = await Notification.create({
      type,
      title,
      message,
      priority,
      userId,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      metadata,
      expiresAt
    });

    res.status(201).json({
      message: 'Notification créée avec succès',
      notification
    });

  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la notification' 
    });
  }
});

/**
 * GET /api/v1/notifications/:id
 * Récupère les détails d'une notification spécifique
 */
router.get('/:id', async (req, res) => {
  console.log(`🔍 [NOTIFICATION] GET /:id - ID demandé: ${req.params.id}`);
  console.log(`🔍 [NOTIFICATION] User: ${req.user?.username} (${req.user?.id})`);
  
  try {
    const notification = await Notification.findByPk(req.params.id, {
      include: [
        {
          model: Utilisateur,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar_url']
        }
      ]
    });
    
    console.log(`🔍 [NOTIFICATION] Notification trouvée:`, notification ? 'OUI' : 'NON');
    
    if (!notification) {
      console.log(`❌ [NOTIFICATION] Notification ${req.params.id} non trouvée`);
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    console.log(`✅ [NOTIFICATION] Détails récupérés:`, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      status: notification.status,
      userId: notification.userId
    });

    const responseData = {
      success: true,
      notification
    };
    
    console.log(`✅ [NOTIFICATION] Réponse envoyée:`, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la récupération:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la notification' 
    });
  }
});

/**
 * PATCH /api/v1/notifications/bulk/read
 * Marque plusieurs notifications comme lues
 * IMPORTANT: Cette route doit être AVANT /:id/read pour éviter les conflits
 */
router.patch('/bulk/read', async (req, res) => {
  console.log(`📚 [BULK-READ] Début marquage en lot - User: ${req.user?.username}`);
  console.log(`📚 [BULK-READ] IDs reçus:`, req.body.ids);
  
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      console.log(`❌ [BULK-READ] Erreur: Liste d'IDs invalide`);
      return res.status(400).json({ error: 'Liste d\'IDs requise' });
    }

    console.log(`📚 [BULK-READ] Tentative de marquage de ${ids.length} notification(s)`);

    const [updatedCount] = await Notification.update(
      { 
        status: 'read',
        readAt: new Date()
      },
      { 
        where: { 
          id: { [Op.in]: ids },
          status: 'unread'
        }
      }
    );

    console.log(`✅ [BULK-READ] Succès: ${updatedCount} notification(s) marquée(s) comme lue(s)`);

    res.json({
      message: `${updatedCount} notification(s) marquée(s) comme lue(s)`,
      updatedCount
    });

  } catch (error) {
    console.error('Erreur lors du marquage en lot:', error);
    res.status(500).json({ error: 'Erreur lors du marquage en lot' });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Marque une notification comme lue
 */
router.patch('/:id/read', async (req, res) => {
  console.log(`📖 [NOTIFICATION] PATCH /:id/read - ID: ${req.params.id}`);
  console.log(`📖 [NOTIFICATION] User: ${req.user?.username} (${req.user?.id})`);
  
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    console.log(`📖 [NOTIFICATION] Notification trouvée:`, notification ? 'OUI' : 'NON');
    
    if (!notification) {
      console.log(`❌ [NOTIFICATION] Notification ${req.params.id} non trouvée pour lecture`);
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    console.log(`📖 [NOTIFICATION] Avant markAsRead - Status: ${notification.status}`);
    await notification.markAsRead();
    console.log(`✅ [NOTIFICATION] Après markAsRead - Status: ${notification.status}`);

    res.json({
      message: 'Notification marquée comme lue',
      notification
    });

  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

/**
 * PATCH /api/v1/notifications/:id/archive
 * Archive une notification
 */
router.patch('/:id/archive', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    await notification.archive();

    res.json({
      message: 'Notification archivée',
      notification
    });

  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'archivage' });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Supprime une notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    await notification.destroy();

    res.json({ message: 'Notification supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

/**
 * POST /api/v1/notifications/seed
 * Crée des notifications de test (développement uniquement)
 */
router.post('/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Disponible uniquement en développement' });
    }

    const testNotifications = [
      {
        type: 'security',
        title: 'Tentative de connexion suspecte',
        message: '5 tentatives de connexion échouées détectées depuis l\'IP 192.168.1.100.',
        priority: 'high',
        metadata: { ip: '192.168.1.100', attempts: 5 }
      },
      {
        type: 'system',
        title: 'Espace disque faible',
        message: 'L\'espace disque disponible est inférieur à 10%. Veuillez libérer de l\'espace.',
        priority: 'urgent',
        metadata: { diskUsage: '92%' }
      },
      {
        type: 'backup',
        title: 'Sauvegarde terminée',
        message: 'La sauvegarde quotidienne s\'est terminée avec succès.',
        priority: 'normal',
        metadata: { size: '2.3 GB' }
      },
      {
        type: 'email',
        title: 'Nouveau message reçu',
        message: 'Un nouveau message a été reçu via le formulaire de contact.',
        priority: 'normal',
        metadata: { sender: 'contact@example.com' }
      },
      {
        type: 'success',
        title: 'Mise à jour système',
        message: 'Le système a été mis à jour vers la version 2.1.3.',
        priority: 'low',
        metadata: { version: '2.1.3' }
      }
    ];

    const createdNotifications = await Promise.all(
      testNotifications.map(notif => Notification.create(notif))
    );

    res.json({
      message: `${createdNotifications.length} notifications de test créées`,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Erreur lors de la création des notifications de test:', error);
    res.status(500).json({ error: 'Erreur lors de la création des notifications de test' });
  }
});

/**
 * POST /api/v1/notifications/test/inactive
 * TEMPORAIRE: Génère une notification de test pour déboguer les dates
 */
router.post('/test/inactive', async (req, res) => {
  try {
    console.log(`🧪 [TEST-ROUTE] Génération d'une notification de test...`);
    await SchedulerService.generateTestInactiveNotification();
    res.json({ message: 'Notification de test générée avec succès' });
  } catch (error) {
    console.error('❌ [TEST-ROUTE] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la notification de test' });
  }
});

export default router;
