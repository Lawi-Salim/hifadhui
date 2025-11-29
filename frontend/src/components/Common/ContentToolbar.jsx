import React, { useState } from 'react';
import './ContentToolbar.css';
import { FaTrash, FaCheck, FaCheckDouble, FaDownload, FaPencilAlt } from 'react-icons/fa';
import { FiMenu, FiScissors, FiX } from 'react-icons/fi';
import ViewModeSwitcher from './ViewModeSwitcher';

const ContentToolbar =({ 
  viewMode, 
  onViewModeChange, 
  showSelectionTools = true, 
  isSelectionMode = false, 
  onToggleSelection, 
  selectedCount = 0, 
  onBatchDelete,
  onBatchDownload,
  showRenameIcon = false,
  onBatchRename,
  pagination,
  onPageChange,
  currentPage = 1,
  className = '',
  showViewSwitcher = true,
  setViewMode,
  storageKey,
  showPagination = true,
  onBulkSelectAll,
  onBulkMove,
  onBulkCancel
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuAction = (action) => {
    if (typeof action === 'function') {
      action();
    }
    setIsMenuOpen(false);
  };

  return (
    <div className={`content-toolbar ${className}`}>
      <div className="toolbar-left">
        {showSelectionTools && (
          <>
            <div 
              className={`allChecked ${isSelectionMode ? 'enabled' : 'disabled'}`}
              title={isSelectionMode ? (selectedCount > 0 ? `Tout sélectionner / désélectionner (${selectedCount} sélectionné(s))` : 'Tout sélectionner') : 'Activer le mode sélection pour tout sélectionner'}
              onClick={isSelectionMode && onBulkSelectAll ? onBulkSelectAll : undefined}
            >
              <FaCheckDouble />
            </div>

            <div 
              className={`move ${selectedCount > 0 ? 'enabled' : 'disabled'}`}
              title={selectedCount > 0 ? `Déplacer ${selectedCount} élément(s)` : 'Aucun élément sélectionné pour le déplacement'}
              onClick={selectedCount > 0 && onBulkMove ? onBulkMove : undefined}
            >
              <FiScissors />
            </div>

            <div 
              className={`download ${selectedCount > 0 ? 'enabled' : 'disabled'}`} 
              title={selectedCount > 0 ? `Télécharger ${selectedCount} élément(s) en ZIP` : 'Télécharger en ZIP (aucun élément sélectionné)'}
              onClick={() => {
                if (selectedCount > 0 && onBatchDownload) {
                  onBatchDownload();
                }
              }}
            >
              <FaDownload />
            </div>

            <div 
              className={`check ${isSelectionMode ? 'active' : ''}`} 
              title={isSelectionMode ? 'Annuler la sélection' : 'Sélectionner des éléments'}
              onClick={onToggleSelection}
            >
              <FaCheck />
            </div>
            {showRenameIcon && (
              <div 
                className={`rename ${selectedCount === 1 ? 'enabled' : 'disabled'}`} 
                title={selectedCount === 1 ? "Renommer l'élément sélectionné" : 'Renommer (sélectionnez un seul élément)'}
                onClick={selectedCount === 1 && onBatchRename ? onBatchRename : undefined}
              >
                <FaPencilAlt />
              </div>
            )}
            
            <div 
              className={`trash ${selectedCount > 0 ? 'enabled' : 'disabled'}`} 
              title={selectedCount > 0 ? `Supprimer ${selectedCount} élément(s)` : 'Supprimer (aucun élément sélectionné)'}
              onClick={selectedCount > 0 ? onBatchDelete : undefined}
            >
              <FaTrash />
            </div>

            <div 
              className={`crash ${isSelectionMode ? 'enabled' : 'disabled'}`}
              title={isSelectionMode ? 'Annuler la sélection' : 'Aucune sélection en cours'}
              onClick={isSelectionMode && onBulkCancel ? onBulkCancel : undefined}
            >
              <FiX />
            </div>
          </>
        )}
        
        {showViewSwitcher && (
          <ViewModeSwitcher 
            viewMode={viewMode}
            setViewMode={setViewMode}
            storageKey={storageKey}
          />
        )}
      </div>

      <div className="toolbar-left-menu">
        <button
          type="button"
          className="menu"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-label="Actions de contenu"
        >
          <FiMenu />
        </button>

        {isMenuOpen && (
          <div className="toolbar-actions-menu">
            {showSelectionTools && (
              <>
                <button
                  type="button"
                  className={`toolbar-action-item ${isSelectionMode ? '' : 'disabled'}`}
                  onClick={isSelectionMode && onBulkSelectAll ? () => handleMenuAction(onBulkSelectAll) : undefined}
                >
                  <FaCheckDouble />
                  <span>Tout sélectionner</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-action-item ${selectedCount > 0 ? '' : 'disabled'}`}
                  onClick={selectedCount > 0 && onBulkMove ? () => handleMenuAction(onBulkMove) : undefined}
                >
                  <FiScissors />
                  <span>Déplacer</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-action-item ${selectedCount > 0 ? '' : 'disabled'}`}
                  onClick={selectedCount > 0 && onBatchDownload ? () => handleMenuAction(onBatchDownload) : undefined}
                >
                  <FaDownload />
                  <span>Télécharger (ZIP)</span>
                </button>

                <button
                  type="button"
                  className="toolbar-action-item"
                  onClick={onToggleSelection ? () => handleMenuAction(onToggleSelection) : undefined}
                >
                  <FaCheck />
                  <span>{isSelectionMode ? 'Annuler la sélection' : 'Mode sélection'}</span>
                </button>

                {showRenameIcon && (
                  <button
                    type="button"
                    className={`toolbar-action-item ${selectedCount === 1 ? '' : 'disabled'}`}
                    onClick={selectedCount === 1 && onBatchRename ? () => handleMenuAction(onBatchRename) : undefined}
                  >
                    <FaPencilAlt />
                    <span>Renommer</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`toolbar-action-item ${selectedCount > 0 ? '' : 'disabled'}`}
                  onClick={selectedCount > 0 && onBatchDelete ? () => handleMenuAction(onBatchDelete) : undefined}
                >
                  <FaTrash />
                  <span>Supprimer</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-action-item ${isSelectionMode ? '' : 'disabled'}`}
                  onClick={isSelectionMode && onBulkCancel ? () => handleMenuAction(onBulkCancel) : undefined}
                >
                  <FiX />
                  <span>Annuler</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
        
      <div className="toolbar-right">
        {showPagination && pagination && (
          <div className="pagination-info">
            Page {currentPage} sur {pagination.totalPages}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentToolbar;