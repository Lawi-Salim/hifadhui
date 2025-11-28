import express from 'express';
import { Op } from 'sequelize';
import Empreinte from '../models/Empreinte.js';
import EmpreinteLog from '../models/EmpreinteLog.js';
import Utilisateur from '../models/Utilisateur.js';
import File from '../models/File.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin, extractRequestInfo } from '../middleware/adminAuth.js';
import empreinteCleanupService from '../services/empreinteCleanupService.js';

const router = express.Router();

// ========================================
// POST /api/v1/empreintes/generate
// Générer des empreintes pour l'utilisateur
// ========================================
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { count = 1, expirationDays = 30 } = req.body;
    const userId = req.user.id;

    // Validation
    if (count < 1 || count > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre d\'empreintes doit être entre 1 et 100'
      });
    }

    if (expirationDays < 1 || expirationDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'La durée d\'expiration doit être entre 1 et 365 jours'
      });
    }

    console.log(`🔖 [EMPREINTES] Génération de ${count} empreinte(s) pour user ${userId}`);

    // Générer les empreintes
    const empreintes = await Empreinte.generateEmpreintes(userId, count, expirationDays);

    console.log(`✅ [EMPREINTES] ${empreintes.length} empreinte(s) générée(s) avec succès`);

    res.status(201).json({
      success: true,
      message: `${empreintes.length} empreinte(s) générée(s) avec succès`,
      data: empreintes.map(e => e.getFormattedInfo())
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur génération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des empreintes',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes
// Liste des empreintes de l'utilisateur
// ========================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      status = 'all', 
      limit = 50, 
      offset = 0,
      sortBy = 'sequence_number',
      sortOrder = 'DESC'
    } = req.query;


    // Construire la requête
    const whereClause = { owner_id: userId };
    
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Récupérer les empreintes
    const { count, rows: empreintes } = await Empreinte.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });


    res.json({
      success: true,
      data: empreintes.map(e => e.getFormattedInfo()),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + empreintes.length) < count
      }
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur liste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des empreintes',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/available
// Empreintes disponibles pour upload
// ========================================
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    console.log(`🔍 [EMPREINTES] Recherche empreintes disponibles pour user ${userId}`);

    const empreintes = await Empreinte.getAvailableEmpreintes(userId, parseInt(limit));

    console.log(`✅ [EMPREINTES] ${empreintes.length} empreinte(s) disponible(s)`);

    res.json({
      success: true,
      data: empreintes.map(e => e.getFormattedInfo()),
      count: empreintes.length
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur empreintes disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des empreintes disponibles',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/:id
// Détails d'une empreinte
// ========================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🔍 [EMPREINTES] Détails empreinte ${id}`);

    const empreinte = await Empreinte.findOne({
      where: {
        id,
        owner_id: userId
      }
    });

    if (!empreinte) {
      return res.status(404).json({
        success: false,
        message: 'Empreinte introuvable'
      });
    }

    res.json({
      success: true,
      data: empreinte.getFormattedInfo()
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur détails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'empreinte',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/:id/qr
// Générer et télécharger le QR code
// ========================================
router.get('/:id/qr', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📱 [EMPREINTES] Génération QR code pour empreinte ${id}`);

    const empreinte = await Empreinte.findOne({
      where: {
        id,
        owner_id: userId
      }
    });

    if (!empreinte) {
      return res.status(404).json({
        success: false,
        message: 'Empreinte introuvable'
      });
    }

    // Générer le QR code si pas déjà fait
    let qrCodeUrl = empreinte.qr_code_url;
    
    if (!qrCodeUrl) {
      qrCodeUrl = await Empreinte.generateQRCodeImage(id);
    }

    console.log(`✅ [EMPREINTES] QR code généré pour ${empreinte.product_id}`);

    res.json({
      success: true,
      data: {
        productId: empreinte.product_id,
        qrCodeUrl: qrCodeUrl,
        qrCodeData: empreinte.qr_code_data
      }
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du QR code',
      error: error.message
    });
  }
});

// ========================================
// POST /api/v1/empreintes/:id/use
// Marquer une empreinte comme utilisée
// ========================================
router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileId } = req.body;
    const userId = req.user.id;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du fichier est requis'
      });
    }

    console.log(`🔗 [EMPREINTES] Association empreinte ${id} avec fichier ${fileId}`);

    const empreinte = await Empreinte.findOne({
      where: {
        id,
        owner_id: userId
      }
    });

    if (!empreinte) {
      return res.status(404).json({
        success: false,
        message: 'Empreinte introuvable'
      });
    }

    // Marquer comme utilisée
    const updatedEmpreinte = await Empreinte.markAsUsed(id, fileId);

    console.log(`✅ [EMPREINTES] Empreinte ${empreinte.product_id} marquée comme utilisée`);

    res.json({
      success: true,
      message: 'Empreinte associée au fichier avec succès',
      data: updatedEmpreinte.getFormattedInfo()
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur association:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'association de l\'empreinte',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/stats
// Statistiques des empreintes
// ========================================
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;


    const [disponibles, utilisees, expirees, total] = await Promise.all([
      Empreinte.count({ where: { owner_id: userId, status: 'disponible' } }),
      Empreinte.count({ where: { owner_id: userId, status: 'utilise' } }),
      Empreinte.count({ where: { owner_id: userId, status: 'expire' } }),
      Empreinte.count({ where: { owner_id: userId } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        disponibles,
        utilisees,
        expirees,
        tauxUtilisation: total > 0 ? ((utilisees / total) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// ========================================
// DELETE /api/v1/empreintes/:id
// Supprimer une empreinte (seulement si disponible)
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ [EMPREINTES] Suppression empreinte ${id}`);

    const empreinte = await Empreinte.findOne({
      where: {
        id,
        owner_id: userId
      }
    });

    if (!empreinte) {
      return res.status(404).json({
        success: false,
        message: 'Empreinte introuvable'
      });
    }

    // Vérifier que l'empreinte n'est pas utilisée
    // Une empreinte utilisée ne peut être supprimée que via la suppression du fichier
    if (empreinte.status === 'utilise' && empreinte.file_id) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une empreinte déjà utilisée. Supprimez le fichier associé pour supprimer l\'empreinte.'
      });
    }

    await empreinte.destroy();

    console.log(`✅ [EMPREINTES] Empreinte ${empreinte.product_id} supprimée`);

    res.json({
      success: true,
      message: 'Empreinte supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'empreinte',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/cleanup/status
// Obtenir le statut du service de nettoyage
// ========================================
router.get('/cleanup/status', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const status = empreinteCleanupService.getStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur statut cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
});

// ========================================
// POST /api/v1/empreintes/cleanup/manual
// Exécuter manuellement le nettoyage
// ========================================
router.post('/cleanup/manual', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    console.log(`🔧 [EMPREINTES] Nettoyage manuel déclenché par ${req.user.username}`);

    const result = await empreinteCleanupService.runManualCleanup();

    res.json({
      success: true,
      message: 'Nettoyage manuel exécuté avec succès',
      data: result
    });

  } catch (error) {
    console.error('❌ [EMPREINTES] Erreur nettoyage manuel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage manuel',
      error: error.message
    });
  }
});

// ========================================
// ROUTES ADMIN
// ========================================

// ========================================
// GET /api/v1/empreintes/admin/all
// Liste TOUTES les empreintes (tous utilisateurs) - ADMIN ONLY
// ========================================
router.get('/admin/all', authenticateToken, isAdmin, extractRequestInfo, async (req, res) => {
  try {
    const { status, search, userId, period, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Construction des filtres
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (userId) {
      where.owner_id = userId;
    }

    // Filtre de période sur la date de génération
    if (period) {
      const now = new Date();
      let fromDate = null;

      switch (period) {
        case 'today': {
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        }
        case 'week': {
          fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        }
        case 'month': {
          fromDate = new Date();
          fromDate.setMonth(fromDate.getMonth() - 1);
          break;
        }
        case 'year': {
          fromDate = new Date();
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          break;
        }
        default:
          fromDate = null;
      }

      if (fromDate) {
        where.generated_at = { [Op.gte]: fromDate };
      }
    }

    if (search) {
      where[Op.or] = [
        { product_id: { [Op.iLike]: `%${search}%` } },
        { '$owner.email$': { [Op.iLike]: `%${search}%` } },
        { '$owner.username$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Récupération avec pagination
    const { count, rows: empreintes } = await Empreinte.findAndCountAll({
      where,
      include: [
        {
          model: Utilisateur,
          as: 'owner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: File,
          as: 'file',
          attributes: ['id', 'filename', 'mimetype'],
          required: false
        }
      ],
      order: [['generated_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Logger l'action
    await EmpreinteLog.logAction(req.user.id, 'view_all', {
      metadata: { filters: { status, search, userId }, resultCount: count },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent
    });

    res.json({
      success: true,
      data: {
        empreintes,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur récupération empreintes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des empreintes',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/admin/stats
// Statistiques globales détaillées - ADMIN ONLY
// ========================================
router.get('/admin/stats', authenticateToken, isAdmin, extractRequestInfo, async (req, res) => {
  try {
    // Stats globales
    const totalEmpreintes = await Empreinte.count();
    const disponibles = await Empreinte.count({ where: { status: 'disponible' } });
    const utilisees = await Empreinte.count({ where: { status: 'utilise' } });
    const expirees = await Empreinte.count({ where: { status: 'expire' } });

    // Taux d'utilisation
    const tauxUtilisation = totalEmpreintes > 0 
      ? Math.round((utilisees / totalEmpreintes) * 100) 
      : 0;

    // Top 10 utilisateurs par nombre d'empreintes générées
    const topGenerateurs = await Empreinte.findAll({
      attributes: [
        'owner_id',
        [Empreinte.sequelize.fn('COUNT', Empreinte.sequelize.col('Empreinte.id')), 'count']
      ],
      include: [{
        model: Utilisateur,
        as: 'owner',
        attributes: ['id', 'username', 'email']
      }],
      group: ['owner_id', 'owner.id', 'owner.username', 'owner.email'],
      order: [[Empreinte.sequelize.literal('count'), 'DESC']],
      limit: 10
    });

    // Top 10 utilisateurs par taux d'utilisation
    const statsParUtilisateur = await Empreinte.findAll({
      attributes: [
        'owner_id',
        [Empreinte.sequelize.fn('COUNT', Empreinte.sequelize.col('Empreinte.id')), 'total'],
        [Empreinte.sequelize.fn('COUNT', Empreinte.sequelize.literal(
          "CASE WHEN status = 'utilise' THEN 1 END"
        )), 'utilisees']
      ],
      include: [{
        model: Utilisateur,
        as: 'owner',
        attributes: ['id', 'username', 'email']
      }],
      group: ['owner_id', 'owner.id', 'owner.username', 'owner.email'],
      having: Empreinte.sequelize.literal('COUNT("Empreinte"."id") >= 5'), // Au moins 5 empreintes
      raw: true
    });

    // Calculer le taux pour chaque utilisateur
    const topUtilisateurs = statsParUtilisateur
      .map(stat => ({
        ...stat,
        tauxUtilisation: Math.round((stat.utilisees / stat.total) * 100)
      }))
      .sort((a, b) => b.tauxUtilisation - a.tauxUtilisation)
      .slice(0, 10);

    // Empreintes générées par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const empreintesParJour = await Empreinte.findAll({
      attributes: [
        [Empreinte.sequelize.fn('DATE', Empreinte.sequelize.col('generated_at')), 'date'],
        [Empreinte.sequelize.fn('COUNT', Empreinte.sequelize.col('id')), 'count']
      ],
      where: {
        generated_at: { [Op.gte]: sevenDaysAgo }
      },
      group: [Empreinte.sequelize.fn('DATE', Empreinte.sequelize.col('generated_at'))],
      order: [[Empreinte.sequelize.fn('DATE', Empreinte.sequelize.col('generated_at')), 'ASC']],
      raw: true
    });

    // Logger l'action
    await EmpreinteLog.logAction(req.user.id, 'view_stats', {
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent
    });

    res.json({
      success: true,
      data: {
        global: {
          total: totalEmpreintes,
          disponibles,
          utilisees,
          expirees,
          tauxUtilisation
        },
        topGenerateurs,
        topUtilisateurs,
        tendances: {
          empreintesParJour
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/admin/users
// Liste des utilisateurs avec leurs stats d'empreintes - ADMIN ONLY
// ========================================
router.get('/admin/users', authenticateToken, isAdmin, extractRequestInfo, async (req, res) => {
  try {
    const users = await Utilisateur.findAll({
      attributes: ['id', 'username', 'email', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    // Récupérer les stats pour chaque utilisateur
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const total = await Empreinte.count({ where: { owner_id: user.id } });
      const disponibles = await Empreinte.count({ where: { owner_id: user.id, status: 'disponible' } });
      const utilisees = await Empreinte.count({ where: { owner_id: user.id, status: 'utilise' } });
      const expirees = await Empreinte.count({ where: { owner_id: user.id, status: 'expire' } });

      // Utiliser toJSON() pour obtenir toutes les propriétés
      const userData = user.toJSON();

      return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        created_at: userData.createdAt || userData.created_at,
        empreintes: {
          total,
          disponibles,
          utilisees,
          expirees
        }
      };
    }));

    // Logger l'action
    await EmpreinteLog.logAction(req.user.id, 'view_user_empreintes', {
      metadata: { userCount: usersWithStats.length },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent
    });

    res.json({
      success: true,
      data: usersWithStats
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur récupération users stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques utilisateurs',
      error: error.message
    });
  }
});

// ========================================
// GET /api/v1/empreintes/admin/:id
// Détails d'une empreinte spécifique - ADMIN ONLY
// ========================================
router.get('/admin/:id', authenticateToken, isAdmin, extractRequestInfo, async (req, res) => {
  try {
    const { id } = req.params;

    const empreinte = await Empreinte.findByPk(id, {
      include: [
        {
          model: Utilisateur,
          as: 'owner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: File,
          as: 'file',
          attributes: ['id', 'filename', 'mimetype', 'size', 'date_upload'],
          required: false
        }
      ]
    });

    if (!empreinte) {
      return res.status(404).json({
        success: false,
        message: 'Empreinte introuvable'
      });
    }

    // Logger l'action
    await EmpreinteLog.logAction(req.user.id, 'view_details', {
      empreinteId: id,
      targetUserId: empreinte.owner_id,
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent
    });

    res.json({
      success: true,
      data: empreinte
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur récupération empreinte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'empreinte',
      error: error.message
    });
  }
});

export default router;
