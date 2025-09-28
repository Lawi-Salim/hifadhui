import express from 'express';
import { Message } from '../models/index.js';
import multer from 'multer';

const router = express.Router();

// Configuration pour parser les emails entrants
const upload = multer();

/**
 * POST /api/v1/webhooks/sendgrid/inbound
 * Webhook pour recevoir les emails entrants via SendGrid
 */
router.post('/sendgrid/inbound', upload.any(), async (req, res) => {
  try {
    console.log('📨 [WEBHOOK] Email entrant reçu');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    // Extraire les données de l'email
    const emailData = {
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject,
      text: req.body.text,
      html: req.body.html,
      envelope: req.body.envelope ? JSON.parse(req.body.envelope) : null,
      attachments: req.files || []
    };

    console.log('📧 [WEBHOOK] Données email extraites:', emailData);

    // Parser l'adresse email de l'expéditeur
    const senderMatch = emailData.from.match(/^(.+?)\s*<(.+?)>$/) || [null, emailData.from, emailData.from];
    const senderName = senderMatch[1] ? senderMatch[1].trim() : '';
    const senderEmail = senderMatch[2] ? senderMatch[2].trim() : emailData.from;

    // Créer le message en base de données
    const message = await Message.create({
      type: 'email_received',
      subject: emailData.subject || 'Sans sujet',
      content: emailData.text || emailData.html || '',
      htmlContent: emailData.html || null,
      senderName: senderName || 'Expéditeur inconnu',
      senderEmail: senderEmail,
      recipientEmail: emailData.to,
      status: 'unread',
      priority: 'normal',
      receivedAt: new Date(),
      metadata: {
        envelope: emailData.envelope,
        attachmentsCount: emailData.attachments.length,
        rawHeaders: req.headers,
        webhookSource: 'sendgrid'
      }
    });

    console.log('✅ [WEBHOOK] Message sauvegardé:', message.id);

    // Traiter les pièces jointes si présentes
    if (emailData.attachments.length > 0) {
      console.log(`📎 [WEBHOOK] ${emailData.attachments.length} pièce(s) jointe(s) détectée(s)`);
      
      // Ici vous pouvez sauvegarder les pièces jointes
      // Pour l'instant, on les log seulement
      emailData.attachments.forEach((attachment, index) => {
        console.log(`📎 Pièce jointe ${index + 1}:`, {
          filename: attachment.originalname,
          size: attachment.size,
          mimetype: attachment.mimetype
        });
      });
    }

    // Répondre à SendGrid
    res.status(200).json({ 
      success: true, 
      messageId: message.id,
      message: 'Email reçu et traité avec succès'
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erreur lors du traitement de l\'email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du traitement de l\'email',
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/webhooks/sendgrid/events
 * Webhook pour les événements SendGrid (ouverture, clic, etc.)
 */
router.post('/sendgrid/events', express.json(), async (req, res) => {
  try {
    console.log('📊 [WEBHOOK] Événements SendGrid reçus');
    
    const events = req.body;
    if (Array.isArray(events)) {
      for (const event of events) {
        console.log(`📊 Événement: ${event.event} - Email: ${event.email} - Timestamp: ${event.timestamp}`);
        
        // Ici vous pouvez mettre à jour le statut des messages
        // Par exemple, marquer comme "ouvert" quand event.event === 'open'
        if (event.event === 'open' && event.sg_message_id) {
          // Trouver et mettre à jour le message
          // await Message.update({ opened: true }, { where: { sendgridMessageId: event.sg_message_id } });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [WEBHOOK] Erreur lors du traitement des événements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/webhooks/test
 * Route de test pour vérifier que les webhooks fonctionnent
 */
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
