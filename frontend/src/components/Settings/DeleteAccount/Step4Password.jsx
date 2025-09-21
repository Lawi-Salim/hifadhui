import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useProgressBar } from '../../../hooks/useProgressBar';
import ProgressBar from '../../Common/ProgressBar';
import api from '../../../services/api';

const Step4Password = ({ 
  wizardData, 
  updateWizardData, 
  onPrevious, 
  onAccountDeleted, 
  user 
}) => {
  const [password, setPassword] = useState(wizardData.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const deleteProgressBar = useProgressBar({ 
    type: 'delete',
    maxProgress: 90,
    interval: 150 
  });

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    updateWizardData({ password: value });
    if (error) setError(null);
  };

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return;
    }

    try {
      setError(null);
      deleteProgressBar.startProgress();
      
      // Appel à l'API pour supprimer le compte
      await api.delete('/auth/delete-account', {
        data: { password }
      });
      
      deleteProgressBar.completeProgress();
      
      // Attendre un peu pour montrer le succès
      setTimeout(() => {
        onAccountDeleted();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      
      if (error.response?.status === 401) {
        setError('Mot de passe incorrect');
      } else {
        setError(`Erreur lors de la suppression: ${error.response?.data?.error || error.message}`);
      }
      
      deleteProgressBar.resetProgress();
    }
  };

  return (
    <div className="wizard-step step-password">
      <div className="step-header">
        <FiLock className="step-icon danger" />
        <h2>Authentification requise</h2>
        <p className="step-subtitle">
          Saisissez votre mot de passe pour confirmer la suppression définitive.
        </p>
      </div>

      <div className="password-content">
        <div className="security-notice">
          <h3>🔒 Sécurité</h3>
          <p>
            Pour des raisons de sécurité, nous devons vérifier votre identité 
            avant de supprimer définitivement votre compte.
          </p>
        </div>

        <div className="account-info">
          <strong>Compte à supprimer :</strong> {user?.email}
        </div>

        <div className="password-input">
          <label htmlFor="delete-password">Mot de passe actuel</label>
          <div className="password-field">
            <input
              id="delete-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Saisissez votre mot de passe"
              className={error ? 'error' : ''}
              disabled={deleteProgressBar.isActive}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              disabled={deleteProgressBar.isActive}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {error && (
            <div className="validation-error">
              {error}
            </div>
          )}
        </div>

        {deleteProgressBar.isActive && (
          <div className="delete-progress">
            <ProgressBar
              isVisible={true}
              progress={deleteProgressBar.progress}
              type={deleteProgressBar.type}
              currentItem={deleteProgressBar.currentItem}
              stats={deleteProgressBar.stats}
              error={deleteProgressBar.error}
              completed={deleteProgressBar.completed}
              showAsModal={false}
            />
          </div>
        )}

        <div className="final-warning">
          <h4>⚠️ Action irréversible</h4>
          <p>
            Une fois votre mot de passe confirmé, votre compte et toutes vos données 
            seront <strong>définitivement supprimés</strong>.
          </p>
        </div>
      </div>

      <div className="step-actions">
        <button 
          onClick={onPrevious}
          className="btn btn-secondary"
          disabled={deleteProgressBar.isActive}
        >
          Précédent
        </button>
        
        <button 
          onClick={handleDeleteAccount}
          className="btn btn-danger"
          disabled={!password.trim() || deleteProgressBar.isActive}
        >
          {deleteProgressBar.isActive ? 'Suppression...' : 'Supprimer définitivement'}
        </button>
      </div>
    </div>
  );
};

export default Step4Password;
