import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLock, FiTrash2, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import './SettingsPage.css';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');


  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setPasswordLoading(false);
      return;
    }

    try {
      // TODO: Implémenter l'appel API pour changer le mot de passe
      // const response = await authService.changePassword(passwordData);
      
      // Simulation pour le moment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswordSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.message || 'Erreur lors de la modification du mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };


  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(false);
  };

  const sections = [
    { id: 'profile', label: 'Profil', icon: FiUser },
    { id: 'security', label: 'Sécurité', icon: FiLock },
    { id: 'danger', label: 'Zone de danger', icon: FiTrash2 }
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Paramètres</h1>
        <p>Gérez vos préférences et paramètres de compte</p>
      </div>

      <div className="settings-container">
        {/* Navigation latérale */}
        <div className="settings-nav">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`settings-nav-item ${
                  activeSection === section.id ? 'active' : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="settings-nav-icon" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenu principal */}
        <div className="settings-content">
          {/* Section Profil */}
          {activeSection === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Informations du profil</h2>
                <p>Consultez et gérez vos informations personnelles</p>
              </div>

              <div className="profile-info">
                <div className="profile-avatar">
                  <SmartAvatar user={user} size={100} className="settings-avatar" />
                </div>

                <div className="profile-details">
                    <div className="form-group">
                        <label className="form-label">Nom d'utilisateur</label>
                        <input
                            type="text"
                            className="form-input"
                            value={user.username || ''}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nom d'identifiant</label>
                        <input
                            type="text"
                            className="form-input"
                            value={UserDisplayName({ user }) || ''}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={user.email || ''}
                            disabled
                        />
                    </div>

                  <div className="form-group">
                    <label className="form-label">Type de compte</label>
                    <div className="account-type">
                      <ProviderIcon user={user} size="medium" showLabel={true} className="with-background" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Membre depuis</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Date non disponible'}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Sécurité */}
          {activeSection === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Sécurité</h2>
                <p>Gérez la sécurité de votre compte</p>
              </div>

              <div className="security-options">
                {user.provider === 'local' && (
                  <div className="security-item">
                    <div className="security-item-info">
                      <h3>Mot de passe</h3>
                      <p>Modifiez votre mot de passe pour sécuriser votre compte</p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Changer le mot de passe
                    </button>
                  </div>
                )}

                <div className="security-item">
                  <div className="security-item-info">
                    <h3>Sessions actives</h3>
                    <p>Vous êtes actuellement connecté sur cet appareil</p>
                  </div>
                  <button className="btn btn-secondary" onClick={logout}>
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Zone de danger */}
          {activeSection === 'danger' && (
            <div className="settings-section danger-section">
              <div className="section-header">
                <h2>Zone de danger</h2>
                <p>Actions irréversibles concernant votre compte</p>
              </div>

              <div className="danger-item">
                <div className="danger-item-info">
                  <h3>Supprimer mon compte</h3>
                  <p>
                    Cette action supprimera définitivement votre compte et toutes vos données.
                    Cette action est irréversible.
                  </p>
                  <ul className="danger-list">
                    <li>Tous vos fichiers seront supprimés</li>
                    <li>Tous vos dossiers seront supprimés</li>
                    <li>Votre compte ne pourra pas être récupéré</li>
                  </ul>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => navigate('/settings/delete-account/step-1')}
                >
                  <FiTrash2 />
                  Supprimer mon compte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal changement de mot de passe */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Changer le mot de passe</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={resetPasswordModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="modal-body">
                {passwordError && (
                  <div className="alert alert-error">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="alert alert-success">{passwordSuccess}</div>
                )}

                <div className="form-group">
                  <label className="form-label">Mot de passe actuel</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className="form-input"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current
                      })}
                    >
                      {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nouveau mot de passe</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      className="form-input"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new
                      })}
                    >
                      {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmer le nouveau mot de passe</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className="form-input"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm
                      })}
                    >
                      {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetPasswordModal}
                  disabled={passwordLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <div className="loading" />
                      Modification...
                    </>
                  ) : (
                    'Changer le mot de passe'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;