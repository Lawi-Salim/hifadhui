const express = require('express');
const { body, validationResult } = require('express-validator');
const { Utilisateur } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;
