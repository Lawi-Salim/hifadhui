import React, { useState } from 'react';
import Modal from '../Modal';
import fileService from '../../services/fileService';
import ProgressBar from './ProgressBar';
import { useProgressBar } from '../../hooks/useProgressBar';

const DeleteFileModal = ({ isOpen, onClose, file, onFileDeleted }) => {
  const [error, setError] = useState(null);
  const [confirmationName, setConfirmationName] = useState('');

  // Hook centralisé pour la progression de suppression
  const deleteProgressBar = useProgressBar({ 
    type: 'delete',
    maxProgress: 95,
    interval: 200 
  });

  const handleDelete = async () => {
    // Vérifier que le nom saisi correspond au nom du fichier
    if (confirmationName !== file?.filename) {
      setError('Le nom saisi ne correspond pas au nom du fichier.');
      return;
    }

    setError(null);
    
    // Démarrer la progression avec la taille du fichier
    deleteProgressBar.startProgress('Suppression en cours...', file.size || 1024 * 1024);
    deleteProgressBar.updateCurrentItem(file.filename);
    
    try {
      await fileService.deleteFile(file.id);
      
      deleteProgressBar.completeProgress();
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 1000));

      onFileDeleted();
      setConfirmationName(''); // Réinitialiser le champ
      deleteProgressBar.resetProgress();
      onClose();
    } catch (err) {
      deleteProgressBar.setProgressError('Erreur lors de la suppression');
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression.');
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
    <Modal isOpen={isOpen} onClose={onClose} className="delete-modal" title="Supprimer le fichier">
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Ce fichier sera définitivement supprimé. Cette action est irréversible.
      </p>
      
      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label htmlFor="confirmationName" style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem',
          fontWeight: '500',
          color: 'var(--text-primary)' 
        }}>
          Pour confirmer, tapez le nom du fichier : <strong>"{file?.filename}"</strong>
        </label>
        <input
          id="confirmationName"
          type="text"
          value={confirmationName}
          onChange={(e) => {
            setConfirmationName(e.target.value);
            // Effacer l'erreur si le nom correspond
            if (e.target.value === file?.filename) {
              setError('');
            }
          }}
          placeholder={file?.filename}
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
      
      {deleteProgressBar.isActive && (
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
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
      
      <div className="modal-actions">
        <button onClick={onClose} className="btn btn-secondary" disabled={deleteProgressBar.isActive}>
          Annuler
        </button>
        <button 
          onClick={handleDelete} 
          className="btn btn-danger" 
          disabled={deleteProgressBar.isActive || confirmationName !== file?.filename}
        >
          {deleteProgressBar.isActive ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteFileModal;
