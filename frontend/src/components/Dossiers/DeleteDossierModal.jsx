import React, { useState } from 'react';
import dossierService from '../../services/dossierService';

const DeleteDossierModal = ({ isOpen, onClose, dossier, onDossierDeleted }) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [progress, setProgress] = useState(0);

  const handleDelete = async () => {
    const expectedName = dossier?.name_original || dossier?.name;
    // Vérifier que le nom saisi correspond au nom du dossier
    if (confirmationName !== expectedName) {
      setError('Le nom saisi ne correspond pas au nom du dossier.');
      return;
    }

    setIsSubmitting(true);
    setProgress(0);
    setError('');
    
    let progressInterval;
    
    try {
      // Simuler la progression pendant la suppression (dossier avec potentiellement plusieurs fichiers)
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // S'arrêter à 90% jusqu'à la fin réelle
          return Math.round(prev + Math.random() * 2 + 1); // Progression de 1-3% par étape (plus lent pour dossiers)
        });
      }, 500); // Plus lent pour dossiers volumineux

      await dossierService.deleteDossier(dossier.id);
      
      // Compléter la progression
      clearInterval(progressInterval);
      setProgress(100);
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      onDossierDeleted(dossier.id);
      setConfirmationName(''); // Réinitialiser le champ
      onClose();
    } catch (err) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('Erreur lors de la suppression du dossier:', err);
      
      // Vérifier si c'est vraiment une erreur ou juste un problème de réseau
      if (err.response?.status === 204) {
        // Status 204 = No Content = Succès
        onDossierDeleted(dossier.id);
        setConfirmationName('');
        onClose();
        return;
      }
      
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la suppression.');
    } finally {
      setIsSubmitting(false);
      setProgress(0);
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
            Pour confirmer, tapez le nom du dossier : <strong>"{dossier?.name_original || dossier?.name}"</strong>
          </label>
          <input
            id="confirmationName"
            type="text"
            value={confirmationName}
            onChange={(e) => {
              setConfirmationName(e.target.value);
              // Effacer l'erreur si le nom correspond
              const expected = dossier?.name_original || dossier?.name;
              if (e.target.value === expected) {
                setError('');
              }
            }}
            placeholder={dossier?.name_original || dossier?.name}
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
        
        {isSubmitting && (
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: '#9CA3AF'
            }}>
              <span>Suppression en cours...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '1rem',
              backgroundColor: '#374151',
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden',
              border: '1px solid #4B5563'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#EF4444',
                borderRadius: 'var(--border-radius)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleDelete} 
            disabled={isSubmitting || confirmationName !== (dossier?.name_original || dossier?.name)}
          >
            {isSubmitting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDossierModal;
