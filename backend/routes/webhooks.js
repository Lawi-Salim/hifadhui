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
    console.log('📨 [WEBHOOK] Email entrant reçu - TIMESTAMP:', new Date().toISOString());
    console.log('📨 [WEBHOOK] User-Agent:', req.headers['user-agent']);
    console.log('📨 [WEBHOOK] Content-Type:', req.headers['content-type']);
    console.log('📨 [WEBHOOK] Headers complets:', req.headers);
    console.log('📨 [WEBHOOK] Body:', req.body);
    console.log('📨 [WEBHOOK] Files:', req.files);

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

    // Forward automatique vers Gmail
    try {
      const { emailService } = await import('../services/emailService.js');
      
      await emailService.sendEmail({
        to: 'dahlawibrahim@gmail.com',
        subject: `[HIFADHUI] ${emailData.subject}`,
        text: `Email reçu sur mavuna@hifadhui.site\n\nDe: ${emailData.from}\nSujet: ${emailData.subject}\n\n${emailData.text || 'Contenu HTML uniquement'}`,
        html: emailData.html ? `
          <div style="border-left: 4px solid #2563eb; padding-left: 16px; margin-bottom: 16px;">
            <p><strong>Email reçu sur mavuna@hifadhui.site</strong></p>
            <p><strong>De:</strong> ${emailData.from}</p>
            <p><strong>Sujet:</strong> ${emailData.subject}</p>
          </div>
          ${emailData.html}
        ` : null
      });
      
      console.log('📧 [WEBHOOK] Email forwardé vers Gmail avec succès');
    } catch (forwardError) {
      console.error('⚠️ [WEBHOOK] Erreur lors du forward vers Gmail:', forwardError);
      // Ne pas faire échouer le webhook si le forward échoue
    }

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

/**
 * POST /api/v1/webhooks/test/receive-email
 * Route de test pour simuler la réception d'un email (localhost uniquement)
 */
router.post('/test/receive-email', async (req, res) => {
  try {
    console.log('🧪 [TEST] Simulation de réception d\'email');
    
    // Données de test par défaut ou depuis le body
    const testEmailData = {
      from: req.body.from || 'test@example.com <Test Sender>',
      to: req.body.to || 'mavuna@hifadhui.site',
      subject: req.body.subject || 'Test Email - ' + new Date().toLocaleString(),
      text: req.body.text || 'Ceci est un email de test pour vérifier la réception en localhost.',
      html: req.body.html || '<p>Ceci est un <strong>email de test</strong> pour vérifier la réception en localhost.</p>',
      envelope: JSON.stringify({
        to: ['mavuna@hifadhui.site'],
        from: req.body.from || 'test@example.com'
      })
    };

    console.log('🧪 [TEST] Données email de test:', testEmailData);

    // Parser l'adresse email de l'expéditeur
    const senderMatch = testEmailData.from.match(/^(.+?)\s*<(.+?)>$/) || [null, testEmailData.from, testEmailData.from];
    const senderName = senderMatch[1] ? senderMatch[1].trim() : '';
    const senderEmail = senderMatch[2] ? senderMatch[2].trim() : testEmailData.from;

    // Créer le message en base de données
    const message = await Message.create({
      type: 'email_received',
      subject: testEmailData.subject || 'Sans sujet',
      content: testEmailData.text || testEmailData.html || '',
      htmlContent: testEmailData.html || null,
      senderName: senderName || 'Test Sender',
      senderEmail: senderEmail,
      recipientEmail: testEmailData.to,
      status: 'unread',
      priority: 'normal',
      receivedAt: new Date(),
      metadata: {
        envelope: JSON.parse(testEmailData.envelope),
        attachmentsCount: 0,
        webhookSource: 'test-localhost',
        testMessage: true
      }
    });

    console.log('✅ [TEST] Message de test créé:', message.id);

    res.status(200).json({ 
      success: true, 
      messageId: message.id,
      message: 'Email de test reçu et traité avec succès',
      data: {
        id: message.id,
        subject: message.subject,
        senderEmail: message.senderEmail,
        senderName: message.senderName,
        receivedAt: message.receivedAt
      }
    });

  } catch (error) {
    console.error('❌ [TEST] Erreur lors de la simulation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la simulation de réception',
      details: error.message 
    });
  }
});

export default router;
