import React, { useState, useEffect } from 'react';
import { FiFolder, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import Modal from '../Modal';
import bulkActionsService from '../../services/bulkActionsService';

const CopyModal = ({ isOpen, onClose, selectedItems, itemType, onSuccess }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await bulkActionsService.getFoldersForSelection();
      setFolders(response.folders || response);
    } catch (err) {
      setError('Erreur lors du chargement des dossiers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (folderList, level = 0) => {
    return folderList.map(folder => (
      <div key={folder.id} className="folder-tree-item">
        <div 
          className={`folder-item ${selectedFolder?.id === folder.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => setSelectedFolder(folder)}
        >
          <div className="folder-toggle">
            {folder.children && folder.children.length > 0 ? (
              <button
                className="folder-chevron"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
              >
                {expandedFolders.has(folder.id) ? <FiChevronDown /> : <FiChevronRight />}
              </button>
            ) : (
              <span className="folder-toggle-placeholder"></span>
            )}
          </div>
          <FiFolder className="folder-icon" />
          <span className="folder-name">{folder.name}</span>
        </div>
        {folder.children && folder.children.length > 0 && expandedFolders.has(folder.id) && (
          <div className="folder-children">
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleCopy = async () => {
    if (!selectedFolder) {
      setError('Veuillez sélectionner un dossier de destination');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📋 [COPY-MODAL] Début copie:', { selectedItems, selectedFolder, itemType });
      const itemIds = selectedItems.map(item => item.id);
      await bulkActionsService.copyItems(itemIds, selectedFolder.id, itemType);
      console.log('✅ [COPY-MODAL] Copie terminée avec succès');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ [COPY-MODAL] Erreur copie:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la copie');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'image': return 'image(s)';
      case 'dossier': return 'dossier(s)';
      default: return 'fichier(s)';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="copy-modal">
      <div className="modal-header">
        <h2>Copier {selectedItems.length} {getItemTypeLabel()}</h2>
      </div>

      <div className="modal-body">
        <p className="modal-description">
          Sélectionnez le dossier de destination pour copier les éléments sélectionnés.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="folder-selector">
          {loading ? (
            <div className="loading-state">Chargement des dossiers...</div>
          ) : folders.length === 0 ? (
            <div className="empty-state">Aucun dossier disponible</div>
          ) : (
            <div className="folder-tree">
              {renderFolderTree(folders)}
            </div>
          )}
        </div>

        {selectedFolder && (
          <div className="selected-destination">
            <strong>Destination sélectionnée :</strong> {selectedFolder.name}
          </div>
        )}
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
          onClick={handleCopy}
          className="btn btn-primary"
          disabled={loading || !selectedFolder}
        >
          {loading ? 'Copie...' : 'Copier'}
        </button>
      </div>
    </Modal>
  );
};

export default CopyModal;
