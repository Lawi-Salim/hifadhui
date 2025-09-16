import express from 'express';
import { body, validationResult } from 'express-validator';
import emailService from '../services/emailService.js';
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
