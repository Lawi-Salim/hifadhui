import express from 'express';
import { body, validationResult } from 'express-validator';
import emailService from '../services/emailService.js';
import Message from '../models/Message.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting pour les messages de contact
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 messages par IP
  message: {
    error: 'Trop de messages envoyés. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation pour le formulaire de contact
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Le sujet ne peut pas dépasser 200 caractères'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Le message doit contenir entre 10 et 2000 caractères')
];

// Route pour traiter les messages de contact
router.post('/', contactLimiter, contactValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;

    // Envoyer l'email de contact
    await emailService.sendContactMessage({
      name,
      email,
      subject: subject || 'Nouveau message de contact',
      message
    });

    // Enregistrer le message de contact dans la base de données
    try {
      await Message.create({
        type: 'contact_received',
        subject: subject || 'Nouveau message de contact',
        content: message,
        htmlContent: null,
        senderEmail: email,
        senderName: name,
        recipientEmail: process.env.CONTACT_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER,
        status: 'unread',
        priority: 'normal',
        metadata: {
          source: 'contact_form',
          ip: req.ip,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (dbError) {
      console.error('Erreur lors de l\'enregistrement du message de contact:', dbError);
      // On ne bloque pas la réponse utilisateur si l\'enregistrement échoue
    }

    res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur contact:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi du message'
    });
  }
});

export default router;
