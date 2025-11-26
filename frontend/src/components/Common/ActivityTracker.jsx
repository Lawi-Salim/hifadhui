import React, { useEffect, useRef } from 'react';
import { useActivityTracker } from '../../hooks/useActivityTracker';

const ActivityTracker = ({ children }) => {
  const { handleLogout, sendSessionEnd, sendActivityUpdate } = useActivityTracker();
  const sessionEndSentRef = useRef(false);

  useEffect(() => {
    // Ne pas activer le tracker si l'utilisateur n'est pas connecté
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return;
    }
    // Écouter les événements de déconnexion personnalisés
    const handleCustomLogout = () => {
      if (!sessionEndSentRef.current) {
        sessionEndSentRef.current = true;
        handleLogout();
      }
    };

    // Écouter les erreurs de réseau pour détecter les crashes serveur
    const handleNetworkError = (event) => {
      if (event.type === 'error' && event.target.tagName === 'SCRIPT') {
        // Erreur de chargement de script, possible crash serveur
        if (!sessionEndSentRef.current) {
          sessionEndSentRef.current = true;
          sendSessionEnd('server_error');
        }
      }
    };

    // Écouter les changements de statut de connexion
    const handleOnline = () => {
      sessionEndSentRef.current = false; // Réinitialiser pour permettre de nouveaux envois
    };

    const handleOffline = () => {
      if (!sessionEndSentRef.current) {
        sessionEndSentRef.current = true;
        sendSessionEnd('network_offline');
      }
    };

    // Gérer la fermeture de l'onglet/navigateur
    const handleBeforeUnload = (event) => {
      // Ne pas fermer la session sur beforeunload car cela inclut les actualisations
      // Les sessions seront fermées par déconnexion explicite ou inactivité prolongée
    };

    // Gérer la perte de focus de la page (changement d'onglet)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page redevient visible, envoyer activité
        sendActivityUpdate('page_visible');
      } else {
        // Page cachée, envoyer inactivité
        sendActivityUpdate('page_hidden');
      }
    };

    // Détecter les tentatives de connexion pendant un crash serveur
    const detectServerCrash = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/v1/user/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 secondes de timeout
        });

        if (!response.ok && !sessionEndSentRef.current) {
          sessionEndSentRef.current = true;
          sendSessionEnd('server_unavailable');
        }
      } catch (error) {
        if (!sessionEndSentRef.current) {
          sessionEndSentRef.current = true;
          sendSessionEnd('server_crash');
        }
      }
    };

    // Ajouter les listeners
    window.addEventListener('logout', handleCustomLogout);
    window.addEventListener('error', handleNetworkError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Vérifier périodiquement la connexion serveur
    const serverCheckInterval = setInterval(detectServerCrash, 30000); // Toutes les 30 secondes

    return () => {
      window.removeEventListener('logout', handleCustomLogout);
      window.removeEventListener('error', handleNetworkError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(serverCheckInterval);
    };
  }, [handleLogout, sendSessionEnd, sendActivityUpdate]);

  return <>{children}</>;
};

export default ActivityTracker;
