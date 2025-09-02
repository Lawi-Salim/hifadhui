import React, { useState } from 'react';
import Modal from '../Modal';
import fileService from '../../services/fileService';

const DeleteFileModal = ({ isOpen, onClose, file, onFileDeleted }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');

  const handleDelete = async () => {
    // Vérifier que le nom saisi correspond au nom du fichier
    if (confirmationName !== file?.filename) {
      setError('Le nom saisi ne correspond pas au nom du fichier.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await fileService.deleteFile(file.id);
      onFileDeleted();
      setConfirmationName(''); // Réinitialiser le champ
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression.');
    } finally {
      setLoading(false);
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
      
      <div className="modal-actions">
        <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
          Annuler
        </button>
        <button 
          onClick={handleDelete} 
          className="btn btn-danger" 
          disabled={loading || confirmationName !== file?.filename}
        >
          {loading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteFileModal;
