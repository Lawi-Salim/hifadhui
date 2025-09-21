import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SmartAvatar from './SmartAvatar';
import UserDisplayName from './UserDisplayName';
import './Profil.css';

const Profil = ({ isOpen, onClose }) => {
  const { user } = useAuth();

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
          {/* Vous pouvez ajouter d'autres informations ici */}
        </div>
      </div>
    </div>
  );
};

export default Profil;
