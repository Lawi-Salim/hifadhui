import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Utilisateur } from '../models/index.js';

// Configuration de la stratégie Google OAuth 2.0
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 [GOOGLE AUTH] Profile reçu:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Récupérer l'action depuis la session (si disponible)
    const action = req?.session?.oauthAction || 'register'; // Par défaut register pour sécurité
    const shouldCreate = action === 'register';

    console.log('🔍 [GOOGLE AUTH] Action détectée:', action, 'shouldCreate:', shouldCreate);

    // Utiliser la méthode du modèle pour trouver ou créer l'utilisateur
    let result;
    try {
      result = await Utilisateur.findOrCreateGoogleUser(profile, shouldCreate);
    } catch (error) {
      // Gérer le cas où le compte est marqué pour suppression
      if (error.message.startsWith('ACCOUNT_MARKED_FOR_DELETION:')) {
        const [, daysRemaining, deletionDate] = error.message.split(':');
        console.log(`❌ [GOOGLE AUTH] Compte marqué pour suppression: ${profile.emails?.[0]?.value} (${daysRemaining} jours restants)`);
        
        const fakeUser = {
          oauthMetadata: { 
            isNewAccount: false, 
            wasLinked: false, 
            action, 
            accountMarkedForDeletion: true,
            daysRemaining: parseInt(daysRemaining),
            deletionScheduledAt: deletionDate
          },
          email: profile.emails?.[0]?.value
        };
        return done(null, fakeUser);
      }
      throw error; // Re-lancer l'erreur si ce n'est pas le cas de suppression
    }
    
    const { user, isNewAccount, wasLinked } = result;
    
    if (user) {
      console.log('✅ [GOOGLE AUTH] Utilisateur traité:', {
        id: user.id,
        email: user.email,
        provider: user.provider,
        isNewAccount,
        wasLinked
      });

      // Attacher les métadonnées à l'utilisateur pour le callback
      user.oauthMetadata = { isNewAccount, wasLinked, action };
      
      return done(null, user);
    } else {
      // Utilisateur non trouvé et non créé (cas login avec compte inexistant)
      console.log('❌ [GOOGLE AUTH] Utilisateur non trouvé et non créé');
      const fakeUser = {
        oauthMetadata: { isNewAccount: true, wasLinked: false, action, accountNotFound: true },
        email: profile.emails?.[0]?.value
      };
      return done(null, fakeUser);
    }
  } catch (error) {
    console.error('❌ [GOOGLE AUTH] Erreur:', error);
    return done(error, null);
  }
}));

// Configuration de la stratégie JWT (pour l'authentification des API)
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await Utilisateur.findByPk(payload.userId);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Sérialisation pour les sessions (optionnel, si vous utilisez des sessions)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Utilisateur.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
