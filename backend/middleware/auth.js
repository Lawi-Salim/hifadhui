import jwt from 'jsonwebtoken';
import { Utilisateur } from '../models/index.js';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }

    try {
      // Vérifier que l'utilisateur existe toujours
      const user = await Utilisateur.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          error: 'Utilisateur non trouvé' 
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

      req.user = user;
      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return res.status(500).json({ 
        error: 'Erreur d\'authentification' 
      });
    }
  });
};

const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000) // Timestamp de création pour tracking
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Session de 7 jours
  );
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Accès refusé. Rôle administrateur requis.' });
  }
};

export {
  authenticateToken,
  generateToken,
  authorizeAdmin
};
