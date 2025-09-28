import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal';
import ProgressBar from './ProgressBar';
import { useProgressBar } from '../../hooks/useProgressBar';

const DeleteBatchModal = ({ isOpen, onClose, onConfirm, imageCount, itemType = 'image', selectedItems = [] }) => {
  // Hook centralisé pour la progression de suppression
  const deleteProgressBar = useProgressBar({ 
    type: 'delete',
    maxProgress: 95,
    interval: 200 
  });

  const handleConfirm = async () => {
    // Calculer la taille totale des éléments à supprimer
    const totalSize = selectedItems.reduce((acc, item) => acc + (item.size || 1024 * 1024), 0);
    
    // Démarrer la progression avec la taille totale
    deleteProgressBar.startProgress('Suppression en cours...', totalSize);
    
    try {
      // Simuler la progression par élément
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        deleteProgressBar.updateCurrentItem(item.filename || item.name || `Élément ${i + 1}`);
        deleteProgressBar.updateStats(i + 1, selectedItems.length);
        
        // Attendre un peu pour la simulation
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Appeler la fonction de confirmation originale
      await onConfirm();
      
      deleteProgressBar.completeProgress();
      
      // Fermer après un délai
      setTimeout(() => {
        deleteProgressBar.resetProgress();
        onClose();
      }, 2000);
      
    } catch (error) {
      deleteProgressBar.setProgressError('Erreur lors de la suppression');
    }
  };
  const getItemMessage = () => {
    if (itemType === 'image') {
      return imageCount === 1 
        ? 'cette 1 image sélectionnée' 
        : `ces ${imageCount} images sélectionnées`;
    } else if (itemType === 'pdf' || itemType === 'file') {
      return imageCount === 1 
        ? 'ce 1 PDF sélectionné' 
        : `ces ${imageCount} PDFs sélectionnés`;
    } else if (itemType === 'dossier') {
      return imageCount === 1 
        ? 'ce 1 dossier sélectionné' 
        : `ces ${imageCount} dossiers sélectionnés`;
    } else if (itemType === 'notification') {
      return imageCount === 1 
        ? 'cette 1 notification sélectionnée' 
        : `ces ${imageCount} notifications sélectionnées`;
    } else if (itemType === 'message') {
      return imageCount === 1 
        ? 'ce 1 message sélectionné' 
        : `ces ${imageCount} messages sélectionnés`;
    } else {
      return imageCount === 1 
        ? 'cet 1 élément sélectionné' 
        : `ces ${imageCount} éléments sélectionnés`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="delete-modal">
      <div className="delete-batch-modal-content">
        <h2>Confirmation de suppression</h2>
        <p>
          Êtes-vous sûr de vouloir supprimer {getItemMessage()} ?
          <br />
          Cette action est irréversible.
        </p>
        
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
        
        <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={deleteProgressBar.isActive}>
            Annuler
          </button>
          <button onClick={handleConfirm} className="btn btn-danger" disabled={deleteProgressBar.isActive}>
            {deleteProgressBar.isActive ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

DeleteBatchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  imageCount: PropTypes.number.isRequired,
  itemType: PropTypes.oneOf(['image', 'pdf', 'file', 'dossier', 'notification', 'message']),
  selectedItems: PropTypes.array,
};

export default DeleteBatchModal;
