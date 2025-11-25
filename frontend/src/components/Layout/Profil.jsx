import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SmartAvatar from './SmartAvatar';
import UserDisplayName from './UserDisplayName';
import './Profil.css';

const Profil = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    warningsCount: 0,
    reportsCount: 0,
    loading: true
  });

  // Récupérer les stats utilisateur quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserStats();
    }
  }, [isOpen, user]);

  const loadUserStats = async () => {
    try {
      setUserStats(prev => ({ ...prev, loading: true }));
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Récupérer les stats utilisateur via l'endpoint profil
      const response = await fetch('/api/v1/user/profile/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        const moderationActions = data.moderationActions || {};
        
        console.log('📊 [PROFIL] Stats utilisateur reçues:', data);
        
        setUserStats({
          warningsCount: moderationActions.warnings || 0,
          reportsCount: data.reportsReceived || 0,
          loading: false
        });
      } else {
        console.warn('Impossible de récupérer les stats utilisateur:', response.status);
        setUserStats({
          warningsCount: 0,
          reportsCount: 0,
          loading: false
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats utilisateur:', error);
      setUserStats({
        warningsCount: 0,
        reportsCount: 0,
        loading: false
      });
    }
  };

  // Fonction pour obtenir le statut du compte
  const getAccountStatus = () => {
    if (user?.deleted_at) {
      return {
        text: 'Compte en période de grâce',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)'
      };
    }
    
    if (userStats.warningsCount > 0) {
      return {
        text: `Compte averti (${userStats.warningsCount} avertissement${userStats.warningsCount > 1 ? 's' : ''})`,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)'
      };
    }
    
    return {
      text: 'Compte normal',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    };
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="profil-modal-overlay" onClick={onClose}>
      <div className="profil-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profil-modal-header">
          <h2>Mon profil</h2>
          <button onClick={onClose} className="profil-modal-close-btn">&times;</button>
        </div>
                <div className="profil-avatar-container">
          <SmartAvatar user={user} size={80} />
        </div>
        <div className="profil-modal-body">
          <div className="info-group">
            <label>Nom d'utilisateur</label>
            <p>{user?.username || 'Non défini'}</p>
          </div>
          <div className="info-group">
            <label>Nom d'identifiant</label>
            <p><UserDisplayName user={user} fallback="Non défini" /></p>
          </div>
          <div className="info-group">
            <label>Email</label>
            <p>{user?.email || 'Non défini'}</p>
          </div>
          <div className="info-group">
            <label>Rôle</label>
            <p>{user?.role || 'Utilisateur'}</p>
          </div>
          <div className="info-group">
            <label>Plan</label>
            <p>{user?.subscription_type === 'premium' ? 'Premium' : 'Free'}</p>
          </div>
          <div className="info-group">
            <label>Statut du compte</label>
            {userStats.loading ? (
              <p>Chargement...</p>
            ) : (
              <p style={{
                color: getAccountStatus().color,
                fontWeight: '600',
                borderRadius: '6px',
                margin: '4px 0'
              }}>
                {getAccountStatus().text}
              </p>
            )}
          </div>

          {userStats.reportsCount > 0 && (
            <div className="info-group">
              <label>Signalements reçus</label>
              <p style={{
                color: '#f59e0b',
                fontWeight: '600'
              }}>
                {userStats.reportsCount} signalement{userStats.reportsCount > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Vous pouvez ajouter d'autres informations ici */}
        </div>
      </div>
    </div>
  );
};

export default Profil;
