import React, { useState } from 'react';
import { FaFolder } from 'react-icons/fa';
import { FiUpload } from 'react-icons/fi';
import ItemList from '../Common/ItemList';
import ContentToolbar from '../Common/ContentToolbar';
import BulkActionsManager from '../Common/BulkActionsManager';
import FileDetailModal from '../Common/FileDetailModal';
import { useDownloadZip, DownloadProgressIndicator } from '../Common/DownloadZip';
import './FolderContentView.css';

const FolderContentView = ({ 
  selectedFolder,
  onFileDownload,
  onFileRename,
  onFileDelete,
  onFileShare,
  onFileUpload,
  onFolderAction,
  isSelectionMode = false,
  selectedItems = [],
  onSelectionChange,
  onToggleSelection,
  onBatchDelete,
  onBatchDownload,
  viewMode = 'grid',
  setViewMode
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);

  // Hook pour le téléchargement ZIP
  const {
    progressBar,
    handleDownloadZip,
    clearError
  } = useDownloadZip();

  if (!selectedFolder) {
    return (
      <div className="folder-content-view empty">
        <div className="empty-state">
          <FaFolder className="empty-icon" />
          <h3>Sélectionnez un dossier</h3>
          <p>Choisissez un dossier dans l'arborescence pour voir son contenu</p>
        </div>
      </div>
    );
  }

  const files = selectedFolder.dossierFiles || [];

  const toggleSelectionMode = () => {
    if (onToggleSelection) {
      onToggleSelection();
    }
    if (isSelectionMode && onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (item) => {
    if (onSelectionChange) {
      const isSelected = selectedItems.some(selected => selected.id === item.id);
      if (isSelected) {
        onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
      } else {
        onSelectionChange([...selectedItems, item]);
      }
    }
  };

  const toggleMenu = (e, itemId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveMenu(activeMenu?.id === itemId ? null : { id: itemId });
  };

  const handleSelectAll = () => {
    if (onSelectionChange) {
      if (selectedItems.length === files.length) {
        onSelectionChange([]);
      } else {
        onSelectionChange([...files]);
      }
    }
  };

  const handleBatchDelete = () => {
    if (onBatchDelete) {
      onBatchDelete();
    }
  };

  const handleBatchDownload = async () => {
    if (onBatchDownload) {
      onBatchDownload();
    }

    // Filtrer seulement les fichiers (pas les dossiers)
    const selectedFiles = selectedItems.filter(item => item.mimetype);
    console.log('📂 Fichiers filtrés:', selectedFiles);
    
    if (selectedFiles.length === 0) {
      console.warn('⚠️ Aucun fichier sélectionné pour le téléchargement');
      return;
    }

    console.log('🚀 Appel de handleDownloadZip avec', selectedFiles.length, 'fichiers');
    try {
      await handleDownloadZip(selectedFiles, 
        (result) => {
          console.log('✅ Succès callback FolderContentView:', result);
          console.log(`${result.fileCount} fichier(s) téléchargé(s) dans ${result.fileName}`);
          // Quitter le mode sélection après téléchargement
          if (onToggleSelection && isSelectionMode) {
            onToggleSelection();
          }
          if (onSelectionChange) {
            onSelectionChange([]);
          }
        },
        (error) => {
          console.error('❌ Erreur callback FolderContentView:', error);
        }
      );
    } catch (error) {
      console.error('❌ Erreur téléchargement ZIP FolderContentView:', error);
    }
  };

  const handlePreview = (file) => {
    setFileToPreview(file);
    setIsPreviewModalOpen(true);
  };

  return (
    <BulkActionsManager
      isSelectionMode={isSelectionMode}
      selectedItems={selectedItems}
      itemType="file"
      onSelectionModeChange={onToggleSelection}
      onItemsUpdated={() => {
        // Recharger les données si nécessaire
        console.log('Items updated');
      }}
      onSelectAll={handleSelectAll}
      totalItems={files.length}
    >
      <div className="folder-content-view">
        <div className="content-header">
          <div className="header-left">
            <h2>{selectedFolder.name}</h2>
            <span className="file-count">{files.length} fichier(s)</span>
          </div>
          <div className="header-right">
            {/* ContentToolbar déplacée vers DossiersPage.jsx */}
          </div>
        </div>

        <div className="content-body">
          {files.length === 0 ? (
            <div className="empty-folder">
              <FaFolder className="empty-icon" />
              <p>Ce dossier est vide</p>
              <button 
                onClick={() => onFileUpload(null, selectedFolder)}
                className="btn btn-primary"
              >
                <FiUpload className="mr-2" /> Uploader un fichier
              </button>
            </div>
          ) : (
            <ItemList
              items={files}
              viewMode={viewMode}
              activeMenu={activeMenu}
              toggleMenu={toggleMenu}
              // Handlers pour les actions
              handleOpenFile={onFileDownload}
              handleOpenFileRenameModal={onFileRename}
              handleOpenFileDeleteModal={onFileDelete}
              handleOpenPreviewModal={handlePreview}
              handleShare={onFileShare}
              // Props pour la sélection multiple
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              handleSelectItem={handleSelectItem}
              // Ajout du menuButtonRefs pour éviter les erreurs
              menuButtonRefs={{ current: {} }}
            />
          )}
        </div>
      </div>

      {fileToPreview && (
        <FileDetailModal
          isOpen={isPreviewModalOpen}
          file={fileToPreview}
          type="file"
          onClose={() => {
            setIsPreviewModalOpen(false);
            setFileToPreview(null);
          }}
        />
      )}

      {/* Indicateur de progrès pour le téléchargement ZIP */}
      <DownloadProgressIndicator
        progressBar={progressBar}
        onClose={clearError}
      />
    </BulkActionsManager>
  );
};

export default FolderContentView;
