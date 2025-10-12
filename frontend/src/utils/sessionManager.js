// Gestionnaire de session pour déclencher des événements de déconnexion

export const SessionManager = {
  // Déclencher une déconnexion volontaire
  logout: () => {
    // Déclencher l'événement personnalisé
    window.dispatchEvent(new CustomEvent('logout'));
    
    // Nettoyer le localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  },

  // Déclencher une déconnexion forcée (session expirée, etc.)
  forceLogout: (reason = 'session_expired') => {
    // Déclencher l'événement avec la raison
    window.dispatchEvent(new CustomEvent('logout', { 
      detail: { reason, forced: true } 
    }));
    
    // Nettoyer le localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Afficher un message selon la raison
    let message = 'Votre session a expiré. Veuillez vous reconnecter.';
    switch (reason) {
      case 'server_error':
        message = 'Erreur serveur détectée. Reconnexion nécessaire.';
        break;
      case 'network_offline':
        message = 'Connexion réseau perdue. Veuillez vous reconnecter.';
        break;
      case 'inactivity':
        message = 'Session fermée pour inactivité prolongée.';
        break;
    }
    
    // Stocker le message pour l'afficher sur la page de connexion
    sessionStorage.setItem('logoutMessage', message);
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  },

  // Vérifier si l'utilisateur est connecté
  isLoggedIn: () => {
    const token = localStorage.getItem('token');
    return token !== null;
  },

  // Obtenir les informations utilisateur
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

// Fonction utilitaire pour envoyer une fin de session
export const sendSessionEnd = async (reason = 'logout') => {
  try {
    const token = SessionManager.getToken();
    if (!token) return;

    const data = JSON.stringify({
      type: 'session_end',
      reason,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Utiliser sendBeacon pour garantir l'envoi
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon('/api/v1/user/activity', blob);
    } else {
      // Fallback pour navigateurs anciens
      await fetch('/api/v1/user/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data,
        keepalive: true
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de fin de session:', error);
  }
};

export default SessionManager;
