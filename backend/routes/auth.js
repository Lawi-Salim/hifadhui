import express from 'express';
import { body, validationResult } from 'express-validator';
import { Utilisateur, ActivityLog, UserSession } from '../models/index.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import { captureUserSession } from '../utils/sessionCapture.js';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { Op } from 'sequelize';
import { deleteCloudinaryFile } from '../utils/cloudinaryStructure.js';
import { validateEmail } from '../services/emailDomainValidator.js';
import NotificationService from '../services/notificationService.js';
import SecurityMonitor from '../middleware/securityMonitor.js';

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

    // Validation du domaine email
    // console.log(`🔍 [REGISTER] Tentative d'inscription avec email: ${email} depuis IP: ${req.ip}`);
    try {
      await validateEmail(email, req.ip, req.get('User-Agent'), 'register');
      // console.log(`✅ [REGISTER] Email ${email} autorisé`);
    } catch (domainError) {
      // console.log(`❌ [REGISTER] Email ${email} refusé: ${domainError.message}`);
      return res.status(400).json({
        error: domainError.message
      });
    }

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

    // 🔔 Notifier les admins du nouvel utilisateur
    await NotificationService.notifyNewUserRegistration(user);

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
router.post('/login', SecurityMonitor.trackFailedLogin, loginValidation, async (req, res) => {
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

    // Vérifier si le compte est marqué pour suppression
    if (user.isMarkedForDeletion()) {
      const daysRemaining = user.getDaysUntilDeletion();
      return res.status(403).json({
        error: 'Compte en période de grâce',
        message: `Votre compte est marqué pour suppression dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}. Utilisez le lien de récupération dans votre email pour réactiver votre compte.`,
        daysRemaining,
        deletionScheduledAt: user.deletion_scheduled_at,
        isMarkedForDeletion: true
      });
    }

    // Capturer la session utilisateur lors de la connexion
    await captureUserSession(req, user);

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

    // Validation du domaine email
    try {
      await validateEmail(email, req.ip, req.get('User-Agent'), 'forgot-password');
    } catch (domainError) {
      return res.status(400).json({
        error: domainError.message
      });
    }

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

// ========================================
// ROUTES OAUTH GOOGLE
// ========================================

// Middleware pour désactiver CSP sur les routes OAuth
const disableCSP = (req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  next();
};

// Route pour initier l'authentification Google
router.get('/google', 
  (req, res, next) => {
    // Stocker l'action (login/register) dans la session pour le callback
    req.session = req.session || {};
    req.session.oauthAction = req.query.action || 'login';
    console.log('🔍 [GOOGLE AUTH] Action demandée:', req.session.oauthAction);
    next();
  },
  disableCSP,
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account consent',  // Force sélection compte ET consentement
    accessType: 'offline'             // Force l'écran de consentement
  })
);

// Route de callback Google
router.get('/google/callback', 
  disableCSP,
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000')}/login?error=google_auth_failed`
  }),
  async (req, res) => {
    try {
      // L'utilisateur est disponible dans req.user grâce à Passport
      const user = req.user;
      const action = req.session?.oauthAction || 'login';
      const { isNewAccount, wasLinked, accountNotFound, accountMarkedForDeletion, daysRemaining, deletionScheduledAt } = user.oauthMetadata || {};
      
      console.log('✅ [GOOGLE CALLBACK] Utilisateur authentifié:', {
        id: user.id,
        email: user.email,
        provider: user.provider,
        action: action,
        isNewAccount,
        wasLinked,
        accountNotFound
      });

      // Capturer la session utilisateur lors de la connexion
      await captureUserSession(req, user);

      // Déterminer l'URL frontend avec fallback pour production
      const frontendUrl = process.env.FRONTEND_URL || 
                         (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');

      // Cas spécial : compte marqué pour suppression
      if (accountMarkedForDeletion) {
        console.log(`❌ [GOOGLE CALLBACK] Compte marqué pour suppression: ${user.email} (${daysRemaining} jours restants)`);
        const message = `Votre compte est marqué pour suppression dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}. Utilisez le lien de récupération dans votre email pour réactiver votre compte.`;
        const redirectUrl = `${frontendUrl}/login?error=account_marked_for_deletion&message=${encodeURIComponent(message)}&daysRemaining=${daysRemaining}`;
        
        // Nettoyer la session
        if (req.session) {
          delete req.session.oauthAction;
        }
        
        return res.redirect(redirectUrl);
      }

      // Cas spécial : compte non trouvé lors d'une tentative de connexion
      if (accountNotFound) {
        const message = 'Ce compte Google n\'existe pas. Veuillez vous inscrire d\'abord.';
        const redirectUrl = `${frontendUrl}/register?error=account_not_found&message=${encodeURIComponent(message)}`;
        
        // Nettoyer la session
        if (req.session) {
          delete req.session.oauthAction;
        }
        
        return res.redirect(redirectUrl);
      }

      // Générer le token JWT avec expiration de 7 jours
      const token = generateToken(user.id);

      // Pour les comptes Google, toujours rediriger vers le dashboard après authentification
      // Pas besoin de double authentification pour OAuth
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user.toJSON()))}&isNewAccount=${isNewAccount}&wasLinked=${wasLinked}`;
      
      console.log(`✅ [GOOGLE CALLBACK] Redirection vers dashboard pour: ${user.email} (nouveau: ${isNewAccount}, lié: ${wasLinked})`);
      
      // Nettoyer la session
      if (req.session) {
        delete req.session.oauthAction;
      }
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ [GOOGLE CALLBACK] Erreur:', error);
      const frontendUrl = process.env.FRONTEND_URL || 
                         (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');
      res.redirect(`${frontendUrl}/login?error=auth_callback_failed`);
    }
  }
);

// Route pour l'authentification Google mobile/SPA (optionnelle)
router.post('/google/token', async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({
        error: 'Token Google requis'
      });
    }

    // Ici vous pourriez vérifier le token Google côté serveur
    // Pour l'instant, on suppose que le frontend a déjà vérifié le token
    
    res.status(501).json({
      error: 'Authentification mobile Google non implémentée. Utilisez la route /google'
    });
    
  } catch (error) {
    console.error('❌ [GOOGLE TOKEN] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'authentification Google'
    });
  }
});

// @route   GET /auth/export-data
// @desc    Récupérer toutes les données utilisateur pour export
// @access  Private
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📦 [DATA EXPORT] Récupération données utilisateur: ${userId}`);
    
    // Test simple d'abord - juste les fichiers
    const userFiles = await File.findAll({
      where: { owner_id: userId },
      attributes: ['id', 'filename', 'mimetype', 'file_url', 'size', 'date_upload']
    });
    
    console.log(`📁 [DATA EXPORT] Fichiers trouvés: ${userFiles.length}`);
    
    console.log(`✅ [DATA EXPORT] Données récupérées: ${userFiles.length} fichiers`);
    
    res.status(200).json({
      success: true,
      data: {
        files: userFiles,
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          provider: req.user.provider || 'local',
          created_at: req.user.createdAt || req.user.created_at
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [DATA EXPORT] Erreur complète:', error);
    console.error('❌ [DATA EXPORT] Stack:', error.stack);
    res.status(500).json({
      error: 'Erreur lors de la récupération des données',
      details: error.message
    });
  }
});

// @route   DELETE /auth/delete-account
// @desc    Marquer le compte pour suppression avec période de grâce (14 jours)
// @access  Private
router.delete('/delete-account', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    console.log(`⏰ [ACCOUNT DELETE] Début période de grâce pour: ${userId}`);
    
    // Récupérer l'utilisateur
    const user = await Utilisateur.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si le compte est déjà marqué pour suppression
    if (user.isMarkedForDeletion()) {
      const daysRemaining = user.getDaysUntilDeletion();
      console.log(`⚠️ [ACCOUNT DELETE] Compte déjà marqué pour suppression, régénération du token`);
      
      // Régénérer un nouveau token au lieu de refuser
      const gracePeriodDays = 14;
      const deletionInfo = await user.markForDeletion(gracePeriodDays);
      
      // Valider la transaction
      await transaction.commit();
      
      // Envoyer le nouvel email avec le nouveau token
      try {
        await emailService.sendAccountDeletionGraceEmail(
          user.email,
          user.username,
          deletionInfo.deletionScheduledAt,
          deletionInfo.recoveryToken,
          gracePeriodDays
        );
      } catch (emailError) {
      }
      
      return res.status(200).json({
        message: 'Nouveau lien de récupération généré et envoyé par email',
        gracePeriod: {
          days: gracePeriodDays,
          deletionScheduledAt: deletionInfo.deletionScheduledAt,
          recoveryToken: deletionInfo.recoveryToken
        },
        accountData: {
          filesCount: await File.count({ where: { owner_id: user.id } }),
          email: user.email,
          username: user.username
        },
        wasAlreadyMarked: true
      });
    }
    
    // Vérifier le mot de passe pour les comptes locaux
    if (user.provider === 'local') {
      if (!password) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Mot de passe requis pour la suppression'
        });
      }
      
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        await transaction.rollback();
        return res.status(401).json({
          error: 'Mot de passe incorrect'
        });
      }
    }
    
    console.log(`✅ [ACCOUNT DELETE] Authentification validée pour: ${user.email}`);
    
    // Compter les fichiers de l'utilisateur pour les statistiques
    const filesCount = await File.count({
      where: { owner_id: userId },
      transaction
    });
    
    console.log(`📁 [ACCOUNT DELETE] ${filesCount} fichier(s) trouvé(s)`);
    
    // Marquer le compte pour suppression avec période de grâce de 14 jours
    const gracePeriodDays = 14;
    const deletionInfo = await user.markForDeletion(gracePeriodDays);
    
    console.log(`⏰ [GRACE PERIOD] Compte marqué pour suppression dans ${gracePeriodDays} jours`);
    console.log(`📅 [GRACE PERIOD] Suppression programmée le: ${deletionInfo.deletionScheduledAt}`);
    
    // Valider la transaction
    await transaction.commit();
    
    // Envoyer l'email de période de grâce
    try {
      await emailService.sendAccountDeletionGraceEmail(
        user.email,
        user.username,
        deletionInfo.deletionScheduledAt,
        deletionInfo.recoveryToken,
        gracePeriodDays
      );
      console.log(`📧 [EMAIL] Email de période de grâce envoyé à: ${user.email}`);
    } catch (emailError) {
      console.error('❌ [EMAIL] Erreur envoi email période de grâce:', emailError);
      // Ne pas faire échouer la demande si l'email échoue
    }
    
    res.status(200).json({
      message: 'Compte marqué pour suppression avec période de grâce',
      gracePeriod: {
        days: gracePeriodDays,
        deletionScheduledAt: deletionInfo.deletionScheduledAt,
        recoveryToken: deletionInfo.recoveryToken
      },
      accountData: {
        filesCount,
        email: user.email,
        username: user.username
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ [ACCOUNT DELETE] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du compte',
      details: error.message
    });
  }
});

// @route   GET /auth/account-recovery/:token
// @desc    Vérifier la validité d'un token de récupération de compte
// @access  Public
router.get('/account-recovery/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log(`🔍 [ACCOUNT RECOVERY] Vérification token: ${token.substring(0, 8)}...`);
    
    // Chercher l'utilisateur par token de récupération
    const user = await Utilisateur.findByRecoveryToken(token);
    
    if (!user) {
      console.log(`❌ [ACCOUNT RECOVERY] Token invalide ou expiré: ${token.substring(0, 8)}...`);
      return res.status(404).json({
        error: 'Token de récupération invalide ou expiré',
        details: 'Ce lien de récupération n\'est plus valide. Il a peut-être expiré ou un nouveau lien a été généré. Vérifiez votre email le plus récent.',
        valid: false
      });
    }
    
    const daysRemaining = user.getDaysUntilDeletion();
    
    console.log(`✅ [ACCOUNT RECOVERY] Token valide pour: ${user.email}`);
    console.log(`⏰ [ACCOUNT RECOVERY] Jours restants: ${daysRemaining}`);
    
    res.status(200).json({
      valid: true,
      user: {
        email: user.email,
        username: user.username,
        deletedAt: user.deleted_at,
        deletionScheduledAt: user.deletion_scheduled_at,
        daysRemaining
      }
    });
    
  } catch (error) {
    console.error('❌ [ACCOUNT RECOVERY] Erreur vérification token:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du token',
      details: error.message
    });
  }
});

// @route   POST /auth/account-recovery/:token
// @desc    Récupérer un compte marqué pour suppression
// @access  Public
router.post('/account-recovery/:token', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { token } = req.params;
    
    console.log(`🔄 [ACCOUNT RECOVERY] Tentative récupération avec token: ${token.substring(0, 8)}...`);
    
    // Chercher l'utilisateur par token de récupération
    const user = await Utilisateur.findByRecoveryToken(token);
    
    if (!user) {
      await transaction.rollback();
      console.log(`❌ [ACCOUNT RECOVERY] Token invalide ou expiré: ${token.substring(0, 8)}...`);
      return res.status(404).json({
        error: 'Token de récupération invalide ou expiré',
        details: 'Ce lien de récupération n\'est plus valide. Il a peut-être expiré, été déjà utilisé, ou un nouveau lien a été généré. Vérifiez votre email le plus récent.'
      });
    }
    
    // Récupérer le compte
    await user.recoverAccount();
    
    console.log(`✅ [ACCOUNT RECOVERY] Compte récupéré avec succès: ${user.email}`);
    
    // Valider la transaction
    await transaction.commit();
    
    // Optionnel : Envoyer un email de confirmation de récupération
    try {
      const mailOptions = {
        from: {
          name: 'Hifadhui',
          address: process.env.SMTP_FROM || process.env.SMTP_USER
        },
        to: user.email,
        subject: 'Compte récupéré avec succès - Hifadhui',
        text: `Bonjour ${user.username},

Votre compte Hifadhui a été récupéré avec succès !

Votre demande de suppression a été annulée et votre compte est maintenant pleinement actif.

Vous pouvez vous reconnecter normalement à votre compte.

Cordialement,
L'équipe Hifadhui`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ Compte récupéré avec succès !</h2>
            <p>Bonjour <strong>${user.username}</strong>,</p>
            <p>Votre compte Hifadhui a été récupéré avec succès !</p>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p><strong>✅ Votre demande de suppression a été annulée</strong></p>
              <p><strong>✅ Votre compte est maintenant pleinement actif</strong></p>
              <p><strong>✅ Vous pouvez vous reconnecter normalement</strong></p>
            </div>
            <p>Cordialement,<br><strong>L'équipe Hifadhui</strong></p>
          </div>
        `
      };

      const result = await emailService.transporter.sendMail(mailOptions);
      console.log(`📧 [EMAIL] Email de confirmation de récupération envoyé à: ${user.email}`);
    } catch (emailError) {
      console.error('❌ [EMAIL] Erreur envoi email confirmation récupération:', emailError);
      // Ne pas faire échouer la récupération si l'email échoue
    }
    
    res.status(200).json({
      message: 'Compte récupéré avec succès',
      user: {
        email: user.email,
        username: user.username,
        recoveredAt: new Date()
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ [ACCOUNT RECOVERY] Erreur récupération:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du compte',
      details: error.message
    });
  }
});

export default router;
