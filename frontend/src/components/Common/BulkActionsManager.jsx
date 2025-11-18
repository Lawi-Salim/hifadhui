import React, { useState, useCallback } from 'react';
import { FiMove, FiCopy, FiX } from 'react-icons/fi';
import { FaCheck, FaDownload } from 'react-icons/fa';
import MoveModal from './MoveModal';
import CopyModal from './CopyModal';
import './BulkActionsManager.css';

const BulkActionsManager = ({
  isSelectionMode,
  selectedItems,
  itemType = 'file', // 'file', 'image', 'dossier'
  onSelectionModeChange,
  onItemsUpdated,
  onSelectAll,
  totalItems = 0, // Nombre total d'éléments disponibles
  children
}) => {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const handleMove = useCallback(() => {
    if (selectedItems.length === 0) return;
    console.log('🔄 [BULK-MANAGER] Ouverture modale déplacement:', { selectedItems, itemType });
    setShowMoveModal(true);
  }, [selectedItems, itemType]);

  const handleCopy = useCallback(() => {
    if (selectedItems.length === 0) return;
    console.log('📋 [BULK-MANAGER] Ouverture modale copie:', { selectedItems, itemType });
    setShowCopyModal(true);
  }, [selectedItems, itemType]);


  const handleCancel = useCallback(() => {
    onSelectionModeChange(false);
  }, [onSelectionModeChange]);

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    }
  }, [onSelectAll]);

  const onActionComplete = useCallback(() => {
    console.log('🔄 [BULK-MANAGER] Action terminée, rechargement des données...');
    onSelectionModeChange(false);
    onItemsUpdated();
  }, [onSelectionModeChange, onItemsUpdated]);

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
      
      {isSelectionMode && selectedItems.length > 0 && (
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
              onClick={handleCopy}
              className="btn btn-secondary bulk-action-btn"
              title="Copier"
            >
              <FiCopy /> Copier
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
        onSuccess={onActionComplete}
      />

      <CopyModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        selectedItems={selectedItems}
        itemType={itemType}
        onSuccess={onActionComplete}
      />

    </>
  );
};

export default BulkActionsManager;
