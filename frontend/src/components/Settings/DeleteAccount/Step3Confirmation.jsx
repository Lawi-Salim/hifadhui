import React, { useState } from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import api from '../../../services/api';

const Step3Confirmation = ({ 
  wizardData, 
  updateWizardData, 
  onNext, 
  onPrevious, 
  canProceed, 
  user,
  onAccountDeleted 
}) => {
  const [confirmationText, setConfirmationText] = useState(wizardData.confirmationText || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const isGoogleUser = user?.provider === 'google';

  const handleConfirmationChange = (e) => {
    const value = e.target.value;
    setConfirmationText(value);
    updateWizardData({ confirmationText: value });
  };

  const isConfirmationValid = confirmationText === 'SUPPRIMER';

  // Fonction pour supprimer le compte Google directement
  const handleGoogleAccountDeletion = async () => {
    if (!isConfirmationValid) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      await api.delete('/auth/delete-account');
      
      // Appeler la fonction de callback pour gérer la déconnexion
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      setError(error.response?.data?.message || 'Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction pour gérer le clic sur le bouton
  const handleNextClick = () => {
    if (isGoogleUser) {
      handleGoogleAccountDeletion();
    } else {
      onNext();
    }
  };

  return (
    <div className="wizard-step step-confirmation">
      <div className="step-header">
        <FiCheck className="step-icon warning" />
        <h2>Confirmation finale</h2>
        <p className="step-subtitle">
          Dernière étape avant la suppression définitive de votre compte.
        </p>
      </div>

      <div className="confirmation-content">
        <div className="confirmation-summary">
          <h3>📋 Récapitulatif</h3>
          <div className="summary-items">
            <div className="summary-item">
              <strong>Compte :</strong> {user?.email}
            </div>
            <div className="summary-item">
              <strong>Type :</strong> {user?.provider === 'google' ? 'Compte Google' : 'Compte local'}
            </div>
            <div className="summary-item">
              <strong>Export des données :</strong> 
              <span className={wizardData.exportCompleted ? 'text-success' : 'text-warning'}>
                {wizardData.exportCompleted ? ' ✅ Effectué' : ' ⚠️ Non effectué'}
              </span>
            </div>
          </div>
        </div>

        {!wizardData.exportCompleted && (
          <div className="warning-box">
            <FiAlertCircle className="warning-icon" />
            <div>
              <strong>Attention :</strong> Vous n'avez pas exporté vos données. 
              Elles seront définitivement perdues après la suppression.
            </div>
          </div>
        )}

        <div className="confirmation-input">
          <h4>Confirmation requise</h4>
          <p>
            Pour confirmer la suppression, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous :
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={handleConfirmationChange}
            placeholder="Tapez SUPPRIMER"
            className={`confirmation-field ${isConfirmationValid ? 'valid' : ''}`}
            autoComplete="off"
          />
          {confirmationText && !isConfirmationValid && (
            <div className="validation-error">
              Veuillez taper exactement "SUPPRIMER" (en majuscules)
            </div>
          )}
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: 'var(--danger-color)'
          }}>
            <FiAlertCircle style={{ marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        <div className="final-warning">
          <h4>⚠️ Dernière chance</h4>
          <p>
            Une fois que vous cliquerez sur "Confirmer la suppression", 
            {isGoogleUser 
              ? ' votre compte sera immédiatement supprimé.'
              : ' vous devrez saisir votre mot de passe pour finaliser la suppression.'
            }
          </p>
          <p>
            <strong>Cette action est irréversible.</strong>
          </p>
        </div>
      </div>

      <div className="step-actions">
        <button 
          onClick={onPrevious}
          className="btn btn-secondary"
        >
          Précédent
        </button>
        
        <button 
          onClick={handleNextClick}
          className="btn btn-danger"
          disabled={!isConfirmationValid || isDeleting}
        >
          {isDeleting ? 'Suppression en cours...' : (isGoogleUser ? 'Supprimer définitivement' : 'Confirmer la suppression')}
        </button>
      </div>
    </div>
  );
};

export default Step3Confirmation;
