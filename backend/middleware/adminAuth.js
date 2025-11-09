/**
 * Middleware pour vérifier que l'utilisateur est administrateur
 */
export const isAdmin = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }

  next();
};

/**
 * Middleware pour extraire les informations de la requête (IP, User-Agent)
 * Utile pour les logs d'audit
 */
export const extractRequestInfo = (req, res, next) => {
  req.clientInfo = {
    ipAddress: req.ip || req.connection.remoteAddress || null,
    userAgent: req.get('user-agent') || null
  };
  next();
};
