import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  // Log du secret utilisé
  console.log('JWT_SECRET utilisé :', JWT_SECRET);

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    // Log du payload décodé
    console.log('Payload JWT décodé :', user);

    try {
      // Pour Supabase, l'ID utilisateur est dans user.sub
      const userId = user.sub;
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        return res.status(403).json({ error: 'Utilisateur non trouvé' });
      }
      req.user = { ...user, id: userId };
      console.log('req.user après mapping :', req.user);
      next();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      return res.status(500).json({ error: 'Erreur serveur lors de l\'authentification' });
    }
  });
};

export { authenticateToken };
