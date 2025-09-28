import { Router } from 'express';
import { Op } from 'sequelize';
import Message from '../models/Message.js';
import MessageAttachment from '../models/MessageAttachment.js';
import emailService from '../services/emailService.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = Router();
// Middleware pour toutes les routes messages (admin seulement)
router.use(authenticateToken);
router.use(authorizeAdmin);

/**
 * GET /api/v1/messages/stats
 * Récupère les statistiques des messages
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      // Messages non lus
      Message.count({
        where: { status: 'unread' }
      }),
      // Messages lus
      Message.count({
        where: { status: ['read', 'replied'] }
      }),
      // Emails envoyés
      Message.count({
        where: { type: 'email_sent' }
      }),
      // Total des messages
      Message.count()
    ]);

    res.json({
      unread: stats[0],
      read: stats[1],
      sent: stats[2],
      total: stats[3]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats messages:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

/**
 * Récupère la liste des messages avec pagination et filtres
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      tab = 'all', 
      search = '',
      type = '',
      status = '',
      priority = ''
    } = req.query;

    // Validation et conversion des paramètres de pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Construction des filtres
    const whereClause = {};
    
    // Filtre par onglet
    if (tab === 'unread') {
      whereClause.status = 'unread';
    } else if (tab === 'read') {
      whereClause.status = ['read', 'replied'];
    } else if (tab === 'sent') {
      whereClause.type = 'email_sent';
    }
    
    // Filtres additionnels
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    
    // Recherche textuelle
    if (search) {
      whereClause[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { senderEmail: { [Op.iLike]: `%${search}%` } },
        { senderName: { [Op.iLike]: `%${search}%` } },
        { recipientEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows: messages, count: total } = await Message.findAndCountAll({
      where: whereClause,
      include: [{
        model: MessageAttachment,
        as: 'attachments',
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      messages,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des messages' 
    });
  }
});

/**
 * GET /api/v1/messages/:id
 * Récupère un message spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id, {
      include: [{
        model: MessageAttachment,
        as: 'attachments'
      }]
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json(message);
  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du message' 
    });
  }
});

/**
 * PUT /api/v1/messages/bulk/read
 * Marque plusieurs messages comme lus
 * IMPORTANT: Cette route doit être AVANT /:id/read pour éviter les conflits
 */
router.put('/bulk/read', async (req, res) => {
  console.log(`📚 [MESSAGES-BULK-READ] Début marquage en lot - User: ${req.user?.username}`);
  console.log(`📚 [MESSAGES-BULK-READ] IDs reçus:`, req.body.ids);
  
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      console.log(`❌ [MESSAGES-BULK-READ] Erreur: Liste d'IDs invalide`);
      return res.status(400).json({ error: 'Liste d\'IDs requise' });
    }

    console.log(`📚 [MESSAGES-BULK-READ] Tentative de marquage de ${ids.length} message(s)`);

    const [updatedCount] = await Message.update(
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

    console.log(`✅ [MESSAGES-BULK-READ] Succès: ${updatedCount} message(s) marqué(s) comme lu(s)`);

    res.json({
      message: `${updatedCount} message(s) marqué(s) comme lu(s)`,
      updatedCount
    });

  } catch (error) {
    console.error('❌ [MESSAGES-BULK-READ] Erreur lors du marquage en lot:', error);
    res.status(500).json({ error: 'Erreur lors du marquage en lot' });
  }
});

/**
 * PUT /api/v1/messages/:id/read
 * Marque un message comme lu
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    await message.markAsRead();
    
    res.json({ 
      message: 'Message marqué comme lu',
      data: message
    });
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ 
      error: 'Erreur lors du marquage comme lu' 
    });
  }
});

/**
 * PUT /api/v1/messages/:id/reply
 * Marque un message comme répondu
 */
router.put('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    await message.markAsReplied();
    
    res.json({ 
      message: 'Message marqué comme répondu',
      data: message
    });
  } catch (error) {
    console.error('Erreur lors du marquage comme répondu:', error);
    res.status(500).json({ 
      error: 'Erreur lors du marquage comme répondu' 
    });
  }
});

/**
 * PUT /api/v1/messages/:id/archive
 * Archive un message
 */
router.put('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    await message.archive();
    
    res.json({ 
      message: 'Message archivé',
      data: message
    });
  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'archivage' 
    });
  }
});

/**
 * DELETE /api/v1/messages/:id
 * Supprime un message
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id, {
      include: [{
        model: MessageAttachment,
        as: 'attachments'
      }]
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Supprimer les pièces jointes en premier
    if (message.attachments && message.attachments.length > 0) {
      await MessageAttachment.destroy({
        where: { messageId: id }
      });
    }

    // Supprimer le message
    await message.destroy();
    
    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression' 
    });
  }
});

/**
 * POST /api/v1/messages
 * Crée un nouveau message (pour l'envoi d'emails)
 */
router.post('/', async (req, res) => {
  try {
    const {
      type = 'email_sent',
      subject,
      content,
      htmlContent,
      recipientEmail,
      priority = 'normal',
      metadata = {}
    } = req.body;

    // Validation des champs requis
    if (!subject || !content) {
      return res.status(400).json({ 
        error: 'Le sujet et le contenu sont requis' 
      });
    }

    if (type === 'email_sent' && !recipientEmail) {
      return res.status(400).json({ 
        error: 'L\'email du destinataire est requis pour les emails envoyés' 
      });
    }

    // Créer le message en base
    const message = await Message.create({
      type,
      subject,
      content,
      htmlContent,
      recipientEmail,
      priority,
      status: type === 'email_sent' ? 'read' : 'unread',
      sentAt: type === 'email_sent' ? new Date() : null,
      metadata
    });

    // Si c'est un email à envoyer, l'envoyer réellement
    if (type === 'email_sent' && recipientEmail) {
      try {
        await emailService.sendCustomEmail({
          to: recipientEmail,
          cc: metadata.cc,
          bcc: metadata.bcc,
          subject,
          content,
          htmlContent: htmlContent || content
        });
        
        console.log(`✅ Email envoyé avec succès à ${recipientEmail}`);
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
        // On ne fait pas échouer la création du message si l'envoi échoue
        // mais on met à jour le metadata pour indiquer l'échec
        await message.update({
          metadata: {
            ...metadata,
            emailSendError: emailError.message,
            emailSendAttemptedAt: new Date()
          }
        });
      }
    }

    res.status(201).json({
      message: 'Message créé avec succès',
      data: message
    });
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du message' 
    });
  }
});

/**
 * POST /api/v1/messages/:id/reply
 * Répond à un message spécifique
 */
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject,
      content,
      htmlContent,
      priority = 'normal'
    } = req.body;

    // Récupérer le message original
    const originalMessage = await Message.findByPk(id);
    if (!originalMessage) {
      return res.status(404).json({ error: 'Message original non trouvé' });
    }

    // Validation des champs requis
    if (!subject || !content) {
      return res.status(400).json({ 
        error: 'Le sujet et le contenu sont requis' 
      });
    }

    // Créer la réponse
    const replyMessage = await Message.create({
      type: 'email_sent',
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      content,
      htmlContent,
      recipientEmail: originalMessage.senderEmail,
      priority,
      status: 'read',
      sentAt: new Date(),
      metadata: {
        replyToId: originalMessage.id,
        originalSubject: originalMessage.subject,
        originalSender: originalMessage.senderEmail
      }
    });

    // Envoyer l'email de réponse
    try {
      await emailService.sendCustomEmail({
        to: originalMessage.senderEmail,
        subject: replyMessage.subject,
        content,
        htmlContent: htmlContent || content
      });
      
      console.log(`✅ Réponse envoyée avec succès à ${originalMessage.senderEmail}`);
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de la réponse:', emailError);
      await replyMessage.update({
        metadata: {
          ...replyMessage.metadata,
          emailSendError: emailError.message,
          emailSendAttemptedAt: new Date()
        }
      });
    }

    // Marquer le message original comme répondu
    await originalMessage.markAsReplied();

    res.status(201).json({
      message: 'Réponse envoyée avec succès',
      data: replyMessage
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la réponse:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de la réponse' 
    });
  }
});

/**
 * GET /api/v1/messages/contact/recent
 * Récupère les messages de contact récents
 */
router.get('/contact/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const messages = await Message.getContactMessages({
      limit: parseInt(limit),
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages récents:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des messages récents' 
    });
  }
});

/**
 * GET /api/v1/messages/sent/recent
 * Récupère les emails envoyés récents
 */
router.get('/sent/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const messages = await Message.getSentEmails({
      limit: parseInt(limit),
      where: {
        sentAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des emails récents:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des emails récents' 
    });
  }
});

export default router;
