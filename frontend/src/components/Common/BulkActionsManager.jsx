import React, { useState, useCallback, useEffect } from 'react';
import { FiMove, FiX } from 'react-icons/fi';
import { FaCheck, FaDownload } from 'react-icons/fa';
import MoveModal from './ModalMove';
import './BulkActionsManager.css';
import { useToast } from '../../hooks/useToast';
import ToastContainer from './ToastContainer';

const BulkActionsManager = ({
  isSelectionMode,
  selectedItems,
  itemType = 'file', // 'file', 'image', 'dossier'
  onSelectionModeChange,
  onItemsUpdated,
  onSelectAll,
  totalItems = 0, // Nombre total d'éléments disponibles
  onBindActions,
  onClearSelection,
  showBottomBar = false,
  children
}) => {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleMove = useCallback(() => {
    if (selectedItems.length === 0) return;
    console.log('🔄 [BULK-MANAGER] Ouverture modale déplacement:', { selectedItems, itemType });
    setShowMoveModal(true);
  }, [selectedItems, itemType]);


  const handleCancel = useCallback(() => {
    onSelectionModeChange(false);
    if (typeof onClearSelection === 'function') {
      onClearSelection();
    }
  }, [onSelectionModeChange, onClearSelection]);

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    }
  }, [onSelectAll]);

  useEffect(() => {
    if (typeof onBindActions === 'function') {
      // On ne passe que des fonctions stables pour éviter une boucle de mises à jour
      onBindActions({
        move: handleMove,
        cancel: handleCancel,
        selectAll: handleSelectAll
      });
    }
  }, [onBindActions, handleMove, handleCancel, handleSelectAll]);

  const onActionComplete = useCallback(() => {
    console.log('🔄 [BULK-MANAGER] Action terminée, rechargement des données...');
    onSelectionModeChange(false);
    onItemsUpdated();
  }, [onSelectionModeChange, onItemsUpdated]);

  const handleMoveSuccess = useCallback(() => {
    onActionComplete();
    showSuccess('Déplacement effectué avec succès');
  }, [onActionComplete, showSuccess]);

  const handleActionError = useCallback((message) => {
    if (!message) {
      showError('Erreur lors de l\'opération');
    } else {
      showError(message);
    }
  }, [showError]);

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'image': return 'image(s)';
      case 'dossier': return 'dossier(s)';
      default: return 'fichier(s)';
    }
  };

  return (
    <>
      {children}
      
      {showBottomBar && isSelectionMode && selectedItems.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-info">
            <span className="selected-count">
              {selectedItems.length} {getItemTypeLabel()} sélectionné{selectedItems.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="bulk-actions-buttons">
            <button 
              onClick={handleMove}
              className="btn btn-secondary bulk-action-btn"
              title="Déplacer"
            >
              <FiMove /> Déplacer
            </button>

            <button
              onClick={handleSelectAll}
              className={`btn bulk-action-btn ${selectedItems.length === totalItems && totalItems > 0 ? 'btn-primary' : 'btn-secondary'}`}
              title={selectedItems.length === totalItems && totalItems > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
            >
              <FaCheck/> {selectedItems.length === totalItems && totalItems > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            
            <button 
              onClick={handleCancel}
              className="btn btn-outline bulk-action-btn"
              title="Annuler"
            >
              <FiX /> Annuler
            </button>
          </div>
        </div>
      )}

      <MoveModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        selectedItems={selectedItems}
        itemType={itemType}
        onSuccess={handleMoveSuccess}
        onError={handleActionError}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </>
  );
};

export default BulkActionsManager;
