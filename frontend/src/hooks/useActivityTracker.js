import { useEffect, useRef, useCallback } from 'react';

export const useActivityTracker = () => {
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const lastServerResponseRef = useRef(Date.now()); // Dernière réponse serveur réussie
  const serverTimeoutCheckRef = useRef(null);

  // Configuration
  const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // Heartbeat toutes les 2 minutes
  const ACTIVITY_UPDATE_INTERVAL = 30 * 1000; // Mise à jour activité toutes les 30s
  const SERVER_TIMEOUT = 30 * 60 * 1000; // 30 minutes sans réponse serveur = session terminée

  // Fonction pour envoyer l'activité au serveur
  const sendActivityUpdate = useCallback(async (type = 'active', timestamp = Date.now()) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Pas de token d\'authentification - activité non envoyée');
        }
        return;
      }

      const response = await fetch('/api/v1/user/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type, // 'active', 'inactive', 'logout', 'beforeunload'
          timestamp: new Date(timestamp).toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      // Si la réponse est OK, mettre à jour la dernière réponse serveur
      if (response.ok) {
        lastServerResponseRef.current = Date.now();
      } else if (response.status === 401) {
        console.warn('Token d\'authentification invalide - activité non envoyée');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'activité:', error);
    }
  }, []);

  // Fonction pour envoyer fin de session
  const sendSessionEnd = useCallback(async (reason = 'unknown') => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Pas de token d\'authentification - fin de session non envoyée');
        }
        return;
      }

      // Utiliser sendBeacon pour garantir l'envoi même si la page se ferme
      const data = JSON.stringify({
        type: 'session_end',
        reason, // 'logout', 'beforeunload', 'inactivity', 'server_error'
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      // Utiliser fetch avec keepalive au lieu de sendBeacon pour pouvoir envoyer les headers
      await fetch('/api/v1/user/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data,
        keepalive: true // Permet l'envoi même si la page se ferme
      });
    } catch (error) {
      console.warn('Erreur lors de l\'envoi de fin de session:', error);
    }
  }, []);

  // Fonction pour mettre à jour la dernière activité
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Fonction pour gérer les événements d'activité utilisateur
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    
    // Envoyer une mise à jour d'activité périodiquement
    if (now - lastActivityRef.current > ACTIVITY_UPDATE_INTERVAL) {
      sendActivityUpdate('active');
      updateLastActivity();
    }
  }, [updateLastActivity, sendActivityUpdate, ACTIVITY_UPDATE_INTERVAL]);

  // Fonction pour gérer la fermeture de page/navigateur
  const handleBeforeUnload = useCallback((event) => {
    // Ne pas fermer la session sur beforeunload car cela inclut les actualisations
    // Les sessions seront fermées par inactivité ou déconnexion explicite
    
    // Optionnel : Afficher un message de confirmation
    // event.preventDefault();
    // event.returnValue = '';
  }, []);

  // Fonction pour gérer la déconnexion volontaire
  const handleLogout = useCallback(() => {
    sendSessionEnd('logout');
  }, [sendSessionEnd]);

  // Fonction heartbeat pour vérifier la connexion serveur
  const sendHeartbeat = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Pas de token d\'authentification - heartbeat non envoyé');
        }
        return;
      }

      const response = await fetch('/api/v1/user/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Serveur répond, mettre à jour la dernière réponse
        lastServerResponseRef.current = Date.now();
      } else {
        // Serveur inaccessible, mais ne pas fermer la session immédiatement
        console.warn('🔴 [HEARTBEAT] Serveur inaccessible, mais session maintenue');
      }
    } catch (error) {
      console.error('🔴 [HEARTBEAT] Heartbeat failed:', error);
      // Ne pas fermer la session sur une erreur ponctuelle
    }
  }, [sendSessionEnd]);

  // Fonction pour vérifier si le serveur est silencieux depuis trop longtemps
  const checkServerTimeout = useCallback(() => {
    const timeSinceLastResponse = Date.now() - lastServerResponseRef.current;
    
    if (timeSinceLastResponse > SERVER_TIMEOUT) {
      console.warn(`🔴 [TIMEOUT] Serveur silencieux depuis ${Math.round(timeSinceLastResponse / 60000)} minutes. Session maintenue.`);
      // Ne fermer la session qu'après un timeout très long (ex: 30 minutes)
      if (timeSinceLastResponse > 30 * 60 * 1000) {
        sendSessionEnd('server_timeout');
      }
    }
  }, [sendSessionEnd, SERVER_TIMEOUT]);

  useEffect(() => {
    // Ne rien démarrer tant qu'il n'y a pas de token
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Événements d'activité utilisateur
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus'
    ];

    // Ajouter les listeners d'activité
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Listener pour fermeture de page
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    // Démarrer le heartbeat
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Démarrer la vérification du timeout serveur (toutes les 5 minutes)
    serverTimeoutCheckRef.current = setInterval(checkServerTimeout, 5 * 60 * 1000);

    // Envoyer activité initiale
    sendActivityUpdate('active');

    // Cleanup
    return () => {
      // Supprimer les listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);

      // Nettoyer les timers
    };
  }, [
    handleUserActivity, 
    handleBeforeUnload, 
    sendHeartbeat, 
    checkServerTimeout,
    sendActivityUpdate, 
    sendSessionEnd,
    HEARTBEAT_INTERVAL
  ]);

  return {
    handleLogout,
    sendActivityUpdate,
    sendSessionEnd
  };
};
