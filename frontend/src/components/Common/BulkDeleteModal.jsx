import React, { useState } from 'react';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import Modal from '../Modal';
import bulkActionsService from '../../services/bulkActionsService';

const BulkDeleteModal = ({ isOpen, onClose, selectedItems, itemType, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setProgress(0);
      setError('');
      
      // Simuler la progression pendant la suppression en lot (plus lent pour plusieurs éléments)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // S'arrêter à 90% jusqu'à la fin réelle
          return Math.round(prev + Math.random() * 2 + 1); // Progression de 1-3% par étape
        });
      }, 600); // Plus lent pour suppressions en lot
      
      await bulkActionsService.deleteItems(selectedItems, itemType);
      
      // Compléter la progression
      clearInterval(progressInterval);
      setProgress(100);
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'image': return 'image(s)';
      case 'dossier': return 'dossier(s)';
      default: return 'fichier(s)';
    }
  };

  const getWarningMessage = () => {
    const count = selectedItems.length;
    const typeLabel = getItemTypeLabel();
    
    if (itemType === 'dossier') {
      return `Êtes-vous sûr de vouloir supprimer ${count} ${typeLabel} ? Cette action supprimera également tous les fichiers contenus dans ${count > 1 ? 'ces dossiers' : 'ce dossier'}.`;
    }
    
    return `Êtes-vous sûr de vouloir supprimer ${count} ${typeLabel} ?`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="delete-modal">
      <div className="modal-header">
        <div className="modal-title-with-icon">
          <FiTrash2 className="modal-icon text-danger" />
          <h2>Supprimer {selectedItems.length} {getItemTypeLabel()}</h2>
        </div>
      </div>

      <div className="modal-body">
        <div className="warning-section">
          <FiAlertTriangle className="warning-icon" />
          <div className="warning-content">
            <p className="warning-message">
              {getWarningMessage()}
            </p>
            <p className="warning-note">
              <strong>Cette action est irréversible.</strong>
            </p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
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

        <div className="items-preview">
          <h4>Éléments à supprimer :</h4>
          <div className="items-count">
            {selectedItems.length} {getItemTypeLabel()} sélectionné{selectedItems.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button 
          onClick={onClose} 
          className="btn btn-secondary"
          disabled={loading}
        >
          Annuler
        </button>
        <button 
          onClick={handleDelete}
          className="btn btn-danger"
          disabled={loading}
        >
          {loading ? 'Suppression...' : 'Supprimer définitivement'}
        </button>
      </div>
    </Modal>
  );
};

export default BulkDeleteModal;
