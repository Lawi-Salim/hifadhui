import React, { useState } from 'react';
import dossierService from '../../services/dossierService';

const DeleteDossierModal = ({ isOpen, onClose, dossier, onDossierDeleted }) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');

  const handleDelete = async () => {
    // Vérifier que le nom saisi correspond au nom du dossier
    if (confirmationName !== dossier?.name) {
      setError('Le nom saisi ne correspond pas au nom du dossier.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await dossierService.deleteDossier(dossier.id);
      onDossierDeleted(dossier.id);
      setConfirmationName(''); // Réinitialiser le champ
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la suppression.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Réinitialiser le champ de confirmation quand le modal s'ouvre/ferme
  React.useEffect(() => {
    if (isOpen) {
      setConfirmationName('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay delete-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button">
          &times;
        </button>
        <h2>Supprimer le dossier</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Tous les fichiers et sous-dossiers seront définitivement supprimés. Cette action est irréversible.
        </p>
        
        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label htmlFor="confirmationName" style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
            color: 'var(--text-primary)' 
          }}>
            Pour confirmer, tapez le nom du dossier : <strong>"{dossier?.name}"</strong>
          </label>
          <input
            id="confirmationName"
            type="text"
            value={confirmationName}
            onChange={(e) => {
              setConfirmationName(e.target.value);
              // Effacer l'erreur si le nom correspond
              if (e.target.value === dossier?.name) {
                setError('');
              }
            }}
            placeholder={dossier?.name}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && <p className="error-message" style={{ marginTop: '0.5rem' }}>{error}</p>}
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleDelete} 
            disabled={isSubmitting || confirmationName !== dossier?.name}
          >
            {isSubmitting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDossierModal;
