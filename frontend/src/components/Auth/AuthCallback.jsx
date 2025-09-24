import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const processedRef = useRef(false); // Éviter le double traitement

  useEffect(() => {
    // Éviter le double traitement en mode développement (React.StrictMode)
    if (processedRef.current) {
      return;
    }

    const handleAuthCallback = async () => {
      try {
        processedRef.current = true; // Marquer comme traité
        
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');
        const isNewAccount = searchParams.get('isNewAccount') === 'true';
        const wasLinked = searchParams.get('wasLinked') === 'true';

        console.log('🔍 [AUTH CALLBACK] Traitement unique du callback');

        // Gestion des erreurs - redirection vers login avec message d'erreur
        if (errorParam) {
          let errorMessage = 'Erreur d\'authentification';
          switch (errorParam) {
            case 'google_auth_failed':
              errorMessage = 'Échec de l\'authentification Google';
              break;
            case 'auth_callback_failed':
              errorMessage = 'Erreur lors du traitement de l\'authentification';
              break;
            default:
              errorMessage = 'Erreur d\'authentification inconnue';
          }
          navigate(`/login?error=${encodeURIComponent(errorMessage)}`, { replace: true });
          return;
        }

        // Vérification du token et des données utilisateur
        if (!token || !userParam) {
          navigate('/login?error=Données d\'authentification manquantes', { replace: true });
          return;
        }

        // Décoder les données utilisateur
        const user = JSON.parse(decodeURIComponent(userParam));
        
        console.log('✅ [AUTH CALLBACK] Token et utilisateur reçus:', {
          hasToken: !!token,
          user: {
            id: user.id,
            email: user.email,
            provider: user.provider
          }
        });

        // Utiliser la méthode OAuth du contexte d'authentification
        const result = loginWithToken(user, token);
        
        if (!result.success) {
          navigate(`/login?error=${encodeURIComponent(result.message || 'Erreur lors de la connexion')}`, { replace: true });
          return;
        }

        // Redirection vers le dashboard avec message de bienvenue approprié
        let welcomeMessage = '';
        if (isNewAccount) {
          welcomeMessage = `Bienvenue ${user.username || user.email} ! Votre compte Google a été créé avec succès.`;
        } else if (wasLinked) {
          welcomeMessage = `Compte Google lié avec succès ! Bienvenue ${user.username || user.email}.`;
        } else {
          welcomeMessage = `Bon retour ${user.username || user.email} !`;
        }
        
        // Redirection vers le bon dashboard selon le rôle
        const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        console.log(`✅ [AUTH CALLBACK] Redirection vers ${dashboardPath}: ${welcomeMessage}`);
        navigate(dashboardPath, { 
          replace: true,
          state: { 
            welcomeMessage,
            isNewAccount,
            wasLinked 
          }
        });

      } catch (error) {
        console.error('❌ [AUTH CALLBACK] Erreur:', error);
        navigate('/login?error=Erreur lors du traitement de l\'authentification', { replace: true });
      }
    };

    handleAuthCallback();
  }, []); // Dépendances vides pour éviter les re-exécutions

  // Composant invisible - traitement en arrière-plan uniquement
  return null;
};

export default AuthCallback;
