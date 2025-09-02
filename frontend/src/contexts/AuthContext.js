import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Le service api gère automatiquement les tokens

  // Vérifier le token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const loginTimestamp = localStorage.getItem('loginTimestamp') || sessionStorage.getItem('loginTimestamp');
      
      if (token) {
        // Vérifier l'expiration de 7 jours si timestamp disponible
        if (loginTimestamp) {
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
          const isExpired = Date.now() - parseInt(loginTimestamp) > sevenDaysInMs;
          
          if (isExpired) {
            console.log('Session expirée (>7 jours)');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('loginTimestamp');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('loginTimestamp');
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token invalide:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTimestamp');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('loginTimestamp');
          setUser(null);
        }
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('loginTimestamp');
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data;
      
      // Stocker le token avec timestamp
      const loginData = {
        token,
        user,
        timestamp: Date.now()
      };
      
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('loginTimestamp', loginData.timestamp.toString());
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('loginTimestamp', loginData.timestamp.toString());
      }
      // Marquer qu'un utilisateur s'est déjà connecté sur cette machine
      localStorage.setItem('hasLoggedInBefore', 'true');
      // Le service api gère automatiquement les tokens
      
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      });

      // L'utilisateur n'est plus connecté automatiquement après l'inscription.
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Erreur lors de l\'inscription'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    // Marquer qu'un utilisateur s'est déjà connecté sur cette machine
    localStorage.setItem('hasLoggedInBefore', 'true');
    // Le service api gère automatiquement le nettoyage
    setUser(null);
  };

  const forceLogout = () => {
    // Nettoyage complet de tous les états d'authentification
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Erreur lors de la mise à jour'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forceLogout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
