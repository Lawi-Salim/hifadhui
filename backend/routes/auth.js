import express from 'express';
import { body, validationResult } from 'express-validator';
import { Utilisateur } from '../models/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import emailService from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { Op } from 'sequelize';

const router = express.Router();

// Rate limiting pour les demandes de réinitialisation
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 tentatives par IP
  message: {
    error: 'Trop de demandes de réinitialisation. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Fonction de validation de mot de passe fort
const validateStrongPassword = (password) => {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
  };
  
  return Object.values(criteria).every(Boolean);
};

// Validation pour l'inscription
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 100 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .custom((password) => {
      if (!validateStrongPassword(password)) {
        const missing = [];
        if (!/[A-Z]/.test(password)) missing.push('1 majuscule');
        if (!/[a-z]/.test(password)) missing.push('1 minuscule');
        if (!/[0-9]/.test(password)) missing.push('1 chiffre');
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) missing.push('1 caractère spécial');
        throw new Error(`Mot de passe trop faible. Manque: ${missing.join(', ')}`);
      }
      return true;
    })
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Route d'inscription
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Un compte avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await Utilisateur.create({
      username,
      email,
      password
    });

    // Générer le token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du compte'
    });
  }
});

// Route de connexion
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await Utilisateur.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion'
    });
  }
});

// Route pour obtenir le profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// Route pour mettre à jour le profil
router.put('/profile', authenticateToken, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 100 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { username } = req.body;
    
    if (username) {
      await req.user.update({ username });
    }

    res.json({
      message: 'Profil mis à jour avec succès',
      user: req.user.toJSON()
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// Validation pour la demande de réinitialisation
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
];

// Validation pour la réinitialisation
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token requis'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .custom((password) => {
      if (!validateStrongPassword(password)) {
        const missing = [];
        if (!/[A-Z]/.test(password)) missing.push('1 majuscule');
        if (!/[a-z]/.test(password)) missing.push('1 minuscule');
        if (!/[0-9]/.test(password)) missing.push('1 chiffre');
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) missing.push('1 caractère spécial');
        throw new Error(`Mot de passe trop faible. Manque: ${missing.join(', ')}`);
      }
      return true;
    })
];

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await Utilisateur.findOne({ where: { email } });
    
    // Toujours retourner un succès pour éviter l'énumération d'emails
    if (!user) {
      return res.json({
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
      });
    }

    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    await PasswordResetToken.destroy({
      where: {
        user_id: user.id,
        used: false
      }
    });

    // Générer un nouveau token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Créer le token en base
    await PasswordResetToken.create({
      token: resetToken,
      email: user.email,
      user_id: user.id,
      expires_at: expiresAt
    });

    // Envoyer l'email
    await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);

    res.json({
      message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({
      error: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    // Trouver le token
    const resetToken = await PasswordResetToken.findOne({
      where: { token }
    });

    if (!resetToken) {
      return res.status(400).json({
        error: 'Token invalide ou expiré'
      });
    }

    // Vérifier si le token est valide
    if (!resetToken.isValid()) {
      return res.status(400).json({
        error: 'Token invalide ou expiré'
      });
    }

    // Trouver l'utilisateur
    const user = await Utilisateur.findByPk(resetToken.user_id);
    if (!user) {
      return res.status(400).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Mettre à jour le mot de passe
    await user.update({ password });

    // Marquer le token comme utilisé
    await resetToken.markAsUsed();

    // Supprimer tous les autres tokens de cet utilisateur
    await PasswordResetToken.destroy({
      where: {
        user_id: user.id,
        id: { [Op.ne]: resetToken.id }
      }
    });

    res.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

// Route pour vérifier la validité d'un token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetToken = await PasswordResetToken.findOne({
      where: { token }
    });

    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({
        error: 'Token invalide ou expiré',
        valid: false
      });
    }

    res.json({
      message: 'Token valide',
      valid: true
    });

  } catch (error) {
    console.error('Erreur verify-reset-token:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du token',
      valid: false
    });
  }
});

export default router;
