import React, { useState, useEffect } from 'react';
import { FiFolder, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import Modal from '../Modal';
import bulkActionsService from '../../services/bulkActionsService';

const ModalMove = ({ isOpen, onClose, selectedItems = [], itemType = 'file', onSuccess, onError }) => {
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

  const getSelectedFolderPathLabel = () => {
    if (!selectedFolder) {
      return 'Aucune destination sélectionnée';
    }

    const buildPath = (list, targetId, parents = []) => {
      for (const folder of list) {
        const newParents = [...parents, folder];
        if (folder.id === targetId) {
          return newParents;
        }
        if (folder.children && folder.children.length > 0) {
          const found = buildPath(folder.children, targetId, newParents);
          if (found) return found;
        }
      }
      return null;
    };

    const pathNodes = buildPath(folders || [], selectedFolder.id);
    if (!pathNodes || pathNodes.length === 0) {
      return selectedFolder.name;
    }

    const names = pathNodes.map((f) => f.name);
    return names.join(' / ');
  };

  const renderFolderRows = (folderList, level = 0) => {
    return folderList.map((folder) => (
      <div key={folder.id} className="folder-row">
        <button
          type="button"
          className={`folder-row-inner ${selectedFolder?.id === folder.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            setSelectedFolder(folder);
            if (folder.children && folder.children.length > 0) {
              toggleFolder(folder.id);
            }
          }}
        >
          <div className="folder-row-chevron">
            {folder.children && folder.children.length > 0 ? (
              <span
                className="folder-row-chevron-btn"
              >
                {expandedFolders.has(folder.id) ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            ) : (
              <span className="folder-row-chevron-placeholder" />
            )}
          </div>
          <FiFolder className="folder-row-icon" />
          <span className="folder-row-name">{folder.name}</span>
        </button>
        {folder.children && folder.children.length > 0 && expandedFolders.has(folder.id) && (
          <div className="folder-row-children">
            {renderFolderRows(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleMove = async () => {
    if (!selectedFolder) {
      setError('Veuillez sélectionner un dossier de destination');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const itemIds = selectedItems.map((item) =>
        typeof item === 'object' && item !== null ? item.id : item
      );
      await bulkActionsService.moveItems(itemIds, selectedFolder.id, itemType);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors du déplacement:', err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Erreur lors du déplacement';
      setError(message);
      if (onError) onError(message);
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'image':
        return 'image(s)';
      case 'dossier':
        return 'dossier(s)';
      default:
        return 'fichier(s)';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="modal-move-new">
      <div className="modal-header">
        <h2>Déplacer {selectedItems.length} {getItemTypeLabel()}</h2>
      </div>

      <div className="modal-body">
        <p className="modal-description">
          Sélectionnez le dossier de destination pour déplacer les éléments sélectionnés.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="folder-selector-new">
          {loading ? (
            <div className="loading-state">Chargement des dossiers...</div>
          ) : folders.length === 0 ? (
            <div className="empty-state">Aucun dossier disponible</div>
          ) : (
            <div className="folder-list">
              <div className="folder-list-header">
                <span className="folder-list-header-name">Nom</span>
              </div>
              <div className="folder-list-body">
                {renderFolderRows(folders)}
              </div>
            </div>
          )}
        </div>

        <div className="destination-summary">
          <span className="destination-label">Destination :</span>
          <span className="destination-value">
            {getSelectedFolderPathLabel()}
          </span>
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
          onClick={handleMove}
          className="btn btn-primary"
          disabled={loading || !selectedFolder}
        >
          {loading ? 'Déplacement...' : 'Déplacer'}
        </button>
      </div>
    </Modal>
  );
};

export default ModalMove;
