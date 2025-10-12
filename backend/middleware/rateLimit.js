import rateLimit from 'express-rate-limit';

// Configuration des limites selon le plan d'action
const RATE_LIMITS = {
  // Limitation générale pour tous les endpoints
  general: {
    windowMs: 1 * 60 * 1000,    // 1 minute
    max: 100,                   // 100 requêtes par minute max
    message: {
      error: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
      retryAfter: '1 minute'
    }
  },
  
  // Limitation stricte pour les uploads
  upload: {
    windowMs: 5 * 60 * 1000,    // 5 minutes
    max: 5,                     // 5 uploads max par 5 minutes
    message: {
      error: 'Limite d\'upload atteinte. Maximum 5 fichiers par 5 minutes.',
      retryAfter: '5 minutes'
    }
  },
  
  // Limitation pour les tentatives de connexion
  login: {
    windowMs: 10 * 60 * 1000,   // 10 minutes
    max: 5,                     // 5 tentatives max par 10 minutes
    message: {
      error: 'Trop de tentatives de connexion. Compte temporairement bloqué.',
      retryAfter: '10 minutes'
    }
  },
  
  // Limitation pour les modifications de profil
  profile: {
    windowMs: 60 * 60 * 1000,   // 1 heure
    max: 3,                     // 3 modifications max par heure
    message: {
      error: 'Limite de modifications de profil atteinte. Maximum 3 par heure.',
      retryAfter: '1 heure'
    }
  },
  
  // Limitation pour les API sensibles
  sensitive: {
    windowMs: 1 * 60 * 1000,    // 1 minute
    max: 20,                    // 20 requêtes max par minute
    message: {
      error: 'Limite d\'API atteinte. Ralentissez vos requêtes.',
      retryAfter: '1 minute'
    }
  }
};

/**
 * Fonction pour identifier l'utilisateur (par ID ou IP)
 */
const keyGenerator = (req) => {
  // Utiliser l'ID utilisateur si authentifié, sinon l'IP
  return req.user?.id || req.ip || 'anonymous';
};

/**
 * Gestionnaire personnalisé pour les dépassements de limite
 */
const createLimitHandler = (limitType) => {
  return (req, res) => {
    const userId = req.user?.id || 'anonymous';
    const userIP = req.ip;
    
    console.log(`🚫 Rate limit dépassé [${limitType}]: User ${userId}, IP ${userIP}`);
    
    // Log pour l'admin
    console.log(`📊 Détails: ${req.method} ${req.path}, User-Agent: ${req.get('User-Agent')}`);
    
    return res.status(429).json({
      error: RATE_LIMITS[limitType].message.error,
      retryAfter: RATE_LIMITS[limitType].message.retryAfter,
      limitType: limitType,
      timestamp: new Date().toISOString()
    });
  };
};

/**
 * Rate limiter général pour toutes les requêtes
 */
export const generalRateLimit = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  keyGenerator,
  handler: createLimitHandler('general'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ignorer les requêtes statiques et de santé
    return req.path.startsWith('/static') || 
           req.path === '/health' || 
           req.path === '/api/health';
  }
});

/**
 * Rate limiter strict pour les uploads de fichiers
 */
export const uploadRateLimit = rateLimit({
  windowMs: RATE_LIMITS.upload.windowMs,
  max: RATE_LIMITS.upload.max,
  keyGenerator,
  handler: createLimitHandler('upload'),
  standardHeaders: true,
  legacyHeaders: false,
  // Appliquer seulement aux requêtes d'upload
  skip: (req) => !req.path.includes('/upload')
});

/**
 * Rate limiter pour les tentatives de connexion
 */
export const loginRateLimit = rateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  keyGenerator: (req) => {
    // Pour les connexions, utiliser l'IP ET l'email tenté
    const email = req.body?.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `${ip}:${email}`;
  },
  handler: createLimitHandler('login'),
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour les modifications de profil
 */
export const profileRateLimit = rateLimit({
  windowMs: RATE_LIMITS.profile.windowMs,
  max: RATE_LIMITS.profile.max,
  keyGenerator,
  handler: createLimitHandler('profile'),
  standardHeaders: true,
  legacyHeaders: false,
  // Appliquer seulement aux modifications de profil
  skip: (req) => {
    return !(req.method === 'PUT' || req.method === 'PATCH') || 
           !req.path.includes('/user');
  }
});

/**
 * Rate limiter pour les API sensibles (admin, suppression, etc.)
 */
export const sensitiveRateLimit = rateLimit({
  windowMs: RATE_LIMITS.sensitive.windowMs,
  max: RATE_LIMITS.sensitive.max,
  keyGenerator,
  handler: createLimitHandler('sensitive'),
  standardHeaders: true,
  legacyHeaders: false,
  // Appliquer aux endpoints sensibles
  skip: (req) => {
    const sensitivePaths = ['/admin', '/delete', '/moderation', '/reports'];
    return !sensitivePaths.some(path => req.path.includes(path));
  }
});

/**
 * Rate limiter adaptatif basé sur le score de risque
 */
export const adaptiveRateLimit = (req, res, next) => {
  try {
    // Importer dynamiquement pour éviter les dépendances circulaires
    import('./behaviorMonitor.js').then(({ getUserActivityStats }) => {
      const userId = req.user?.id;
      
      if (!userId) {
        return next(); // Pas d'utilisateur authentifié
      }
      
      const userStats = getUserActivityStats(userId);
      
      if (!userStats) {
        return next(); // Pas de données d'activité
      }
      
      const riskScore = userStats.riskScore;
      
      // Appliquer des limites plus strictes selon le score de risque
      if (riskScore >= 70) {
        // Score critique : Très strict
        return applyStrictLimit(req, res, next, 5, 1); // 5 req/min
      } else if (riskScore >= 40) {
        // Score suspect : Modérément strict  
        return applyStrictLimit(req, res, next, 20, 1); // 20 req/min
      } else {
        // Score normal : Limite standard
        return next();
      }
    }).catch(error => {
      console.error('❌ Erreur dans adaptiveRateLimit:', error);
      next(); // Continuer en cas d'erreur
    });
  } catch (error) {
    console.error('❌ Erreur dans adaptiveRateLimit:', error);
    next();
  }
};

/**
 * Appliquer une limite stricte temporaire
 */
function applyStrictLimit(req, res, next, maxRequests, windowMinutes) {
  const userId = req.user?.id;
  const key = `strict_${userId}`;
  
  // Utiliser un rate limiter temporaire
  const strictLimiter = rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    keyGenerator: () => key,
    handler: (req, res) => {
      console.log(`🔒 Limite stricte appliquée pour utilisateur à risque: ${userId}`);
      return res.status(429).json({
        error: 'Limite temporaire appliquée en raison d\'une activité suspecte',
        maxRequests,
        windowMinutes,
        reason: 'Comportement automatique détecté'
      });
    }
  });
  
  return strictLimiter(req, res, next);
}

/**
 * Middleware pour logger les informations de rate limiting
 */
export const rateLimitLogger = (req, res, next) => {
  // Ajouter des headers informatifs
  res.on('finish', () => {
    if (res.statusCode === 429) {
      const userId = req.user?.id || 'anonymous';
      const endpoint = `${req.method} ${req.path}`;
      
      console.log(`📈 Rate Limit Hit: User ${userId}, Endpoint ${endpoint}, IP ${req.ip}`);
    }
  });
  
  next();
};

/**
 * Configuration des rate limiters par endpoint
 */
export const configureRateLimits = (app) => {
  // Logger pour toutes les requêtes
  app.use(rateLimitLogger);
  
  // Rate limiter général (appliqué à toutes les routes)
  app.use(generalRateLimit);
  
  // Rate limiters spécifiques par route
  app.use('/api/v1/auth/login', loginRateLimit);
  app.use('/api/v1/files/upload', uploadRateLimit);
  app.use('/api/v1/user', profileRateLimit);
  app.use('/api/v1/admin', sensitiveRateLimit);
  
  // Rate limiter adaptatif (appliqué après l'authentification)
  app.use(adaptiveRateLimit);
  
  console.log('✅ Rate limiters configurés avec succès');
};

/**
 * Obtenir les statistiques de rate limiting (pour l'admin)
 */
export const getRateLimitStats = () => {
  // En production, ces stats seraient stockées dans Redis
  // Pour l'instant, on retourne des informations basiques
  return {
    general: {
      windowMs: RATE_LIMITS.general.windowMs,
      max: RATE_LIMITS.general.max,
      current: 'Variable selon utilisateur'
    },
    upload: {
      windowMs: RATE_LIMITS.upload.windowMs,
      max: RATE_LIMITS.upload.max,
      current: 'Variable selon utilisateur'
    },
    login: {
      windowMs: RATE_LIMITS.login.windowMs,
      max: RATE_LIMITS.login.max,
      current: 'Variable selon IP/email'
    },
    profile: {
      windowMs: RATE_LIMITS.profile.windowMs,
      max: RATE_LIMITS.profile.max,
      current: 'Variable selon utilisateur'
    }
  };
};

export default {
  generalRateLimit,
  uploadRateLimit,
  loginRateLimit,
  profileRateLimit,
  sensitiveRateLimit,
  adaptiveRateLimit,
  configureRateLimits,
  getRateLimitStats
};
