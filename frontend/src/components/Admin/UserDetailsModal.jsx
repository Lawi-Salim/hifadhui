import React, { useState, useEffect } from 'react';
import { 
  FiShield
} from 'react-icons/fi';
import SmartAvatar from '../Layout/SmartAvatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './AdminDashboard.css';
import '../Layout/Profil.css';

const UserDetailsModal = ({ user, isOpen, onClose, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    imagesCount: 0,
    pdfsCount: 0,
    storageUsed: '0 B',
    lastActivity: null,
    sessionStatus: 'unknown',
    reportsCount: 0,
    warningsCount: 0
  });

  // Le modal affiche uniquement les détails utilisateur

  useEffect(() => {
    if (isOpen && user) {
      // Réinitialiser les stats avant de charger les nouvelles
      setUserStats({
        imagesCount: 0,
        pdfsCount: 0,
        storageUsed: '0 B',
        lastActivity: null,
        sessionStatus: 'unknown',
        reportsCount: 0,
        warningsCount: 0
      });
      
      loadUserDetails();
    }
  }, [isOpen, user]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      
      console.log('Loading details for user:', user);
      
      // Récupérer les détails utilisateur par email ou ID
      const token = localStorage.getItem('token');
      let userId = user.id;
      
      // Si on n'a que l'email, récupérer l'utilisateur d'abord
      if (!userId && user.email) {
        const encodedEmail = encodeURIComponent(user.email);
        const userResponse = await fetch(`/api/v1/admin/users/by-email/${encodedEmail}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.user.id;
        }
      }
      
      if (userId) {
        console.log('Fetching stats for userId:', userId);
        
        // Récupérer les statistiques utilisateur
        const statsResponse = await fetch(`/api/v1/admin/users/${userId}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Récupérer la vraie activité utilisateur
        const activityResponse = await fetch(`/api/v1/admin/users/${userId}/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        let lastActivity = null;
        let sessionStatus = 'unknown';

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          lastActivity = activityData.data.lastActivity;
          sessionStatus = activityData.data.sessionStatus;
        } else {
          console.warn('Endpoint d\'activité non disponible:', activityResponse.status);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('Stats data received:', statsData); // Debug
          
          // ATTENTION: Les données arrivent directement, pas dans statsData.stats !
          const stats = statsData; // Pas de .stats !
          const filesCount = stats.filesCount || {};
          const moderationActions = stats.moderationActions || {};
          
          console.log('Processed stats:', stats);
          console.log('Processed filesCount:', filesCount);
          
          const newStats = {
            imagesCount: filesCount.images || 0,
            pdfsCount: filesCount.pdfs || 0,
            storageUsed: stats.storageUsed || '0 B',
            lastActivity: lastActivity || stats.lastActivity,
            sessionStatus: sessionStatus,
            reportsCount: stats.reportsReceived || 0,
            warningsCount: moderationActions.warnings || 0
          };
          
          console.log('Setting userStats to:', newStats);
          setUserStats(newStats);
        } else {
          console.error('Erreur API stats:', statsResponse.status, statsResponse.statusText);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails utilisateur:', error);
      setUserStats({
        imagesCount: 0,
        pdfsCount: 0,
        storageUsed: '0 B',
        lastActivity: null,
        sessionStatus: 'unknown',
        reportsCount: 0,
        warningsCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const renderDetailsPage = () => {
    return (
      <>
        {/* User Avatar */}
        <div className="profil-avatar-container">
          <SmartAvatar user={user} size={80} />
        </div>

        {/* User Details */}
        <div className="profil-modal-body">
          <div className="info-group">
            <label>Nom d'utilisateur</label>
            <p>{user.username}</p>
          </div>

          <div className="info-group">
            <label>Email</label>
            <p>{user.email}</p>
          </div>

          <div className="info-group">
            <label>Type de compte</label>
            <p>{user.provider === 'google' ? 'Compte Google' : 'Compte local'}</p>
          </div>

          <div className="info-group">
            <label>Plan</label>
            <p>{user.subscription_type === 'premium' ? 'Premium' : 'Free'}</p>
          </div>

          <div className="info-group">
            <label>Fichiers uploadés</label>
            <p>{userStats.imagesCount} images et {userStats.pdfsCount} PDFs</p>
            {/* Debug: afficher les valeurs dans la console */}
            {console.log('Rendering with userStats:', userStats)}
          </div>

          <div className="info-group">
            <label>Stockage utilisé</label>
            <p>{userStats.storageUsed}</p>
          </div>

          <div className="info-group">
            <label>Dernière activité</label>
            <p>
              {userStats.lastActivity ? (
                <>
                  {format(new Date(userStats.lastActivity), 'd MMMM yyyy à HH:mm', { locale: fr })}
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: userStats.sessionStatus === 'active' ? '#10b981' : 
                                   userStats.sessionStatus === 'inactive' ? '#f59e0b' : '#6b7280',
                    color: 'white'
                  }}>
                    {userStats.sessionStatus === 'active' ? 'EN LIGNE' : 
                     userStats.sessionStatus === 'inactive' ? 'HORS LIGNE' : 'INCONNU'}
                  </span>
                </>
              ) : (
                'Aucune activité enregistrée'
              )}
            </p>
          </div>

          <div className="info-group">
            <label>Statut du compte</label>
            <p className={
              user.deleted_at ? 'status-suspended' : 
              userStats.warningsCount > 0 ? 'status-warning' : 
              'status-normal'
            }>
              {user.deleted_at ? 
                'Compte suspendu - En période de grâce' : 
                userStats.warningsCount > 0 ? 
                `Compte averti - ${userStats.warningsCount} avertissement(s)` :
                'Compte normal - Aucune restriction'
              }
            </p>
          </div>
        </div>

      </>
    );
  };


  if (!isOpen || !user) return null;

  return (
    <div className="profil-modal-overlay" onClick={handleClose}>
      <div className="profil-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profil-modal-header">
          <h2>Détails de l'utilisateur</h2>
          <button onClick={handleClose} className="profil-modal-close-btn">&times;</button>
        </div>

        {renderDetailsPage()}
      </div>
    </div>
  );
};

export default UserDetailsModal;
