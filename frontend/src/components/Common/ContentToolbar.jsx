import React from 'react';
import { FiGrid, FiList } from 'react-icons/fi';
import './ContentToolbar.css';
import { FaTrash, FaCheck, FaDownload, FaPencilAlt } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
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
  showPagination = true
}) => {
  return (
    <div className={`content-toolbar ${className}`}>
      {true ? (
        <div className="toolbar-left">
          {showSelectionTools && (
            <>
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
                  title={selectedCount === 1 ? 'Renommer l\'élément sélectionné' : 'Renommer (sélectionnez un seul élément)'}
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
      ) : (
        <div className="toolbar-left-menu">
          <div className="menu">
            <FiMenu />
          </div>
        </div>
      )}
        
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