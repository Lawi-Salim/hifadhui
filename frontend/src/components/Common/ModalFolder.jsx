import React, { useState, useEffect } from 'react';
import { FiFolder, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import Modal from '../Modal';
import bulkActionsService from '../../services/bulkActionsService';
import dossierService from '../../services/dossierService';

const ModalFolder = ({ isOpen, onClose, initialParentId = null, onDossierCreated, onError }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setError('');
      setName('');
      setSelectedFolder(null);
      setExpandedFolders(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialParentId) return;

    const selectInitial = (list) => {
      for (const folder of list) {
        if (folder.id === initialParentId) {
          setSelectedFolder(folder);
          return true;
        }
        if (folder.children && folder.children.length > 0) {
          if (selectInitial(folder.children)) {
            setExpandedFolders((prev) => new Set(prev).add(folder.id));
            return true;
          }
        }
      }
      return false;
    };

    if (folders && folders.length > 0) {
      const clonedExpanded = new Set();
      const recurse = (list, parents = []) => {
        for (const folder of list) {
          if (folder.id === initialParentId) {
            setSelectedFolder(folder);
            parents.forEach((p) => clonedExpanded.add(p));
            break;
          }
          if (folder.children && folder.children.length > 0) {
            recurse(folder.children, [...parents, folder.id]);
          }
        }
      };
      recurse(folders, []);
      if (clonedExpanded.size > 0) {
        setExpandedFolders(clonedExpanded);
      }
    }
  }, [isOpen, initialParentId, folders]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await bulkActionsService.getFoldersForSelection();
      const tree = response.folders || response;
      setFolders(tree);
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
              <span className="folder-row-chevron-btn">
                {expandedFolders.has(folder.id) ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            ) : (
              <span className="folder-row-chevron-placeholder" />
            )}
          </div>
          <FiFolder className="folder-row-icon" />
          <span className="folder-row-name">{folder.name_original || folder.name}</span>
        </button>
        {folder.children && folder.children.length > 0 && expandedFolders.has(folder.id) && (
          <div className="folder-row-children">
            {renderFolderRows(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const sanitizeName = (value) => value.trim();

  const buildFolderPath = (list, targetId, parents = []) => {
    for (const folder of list) {
      const newParents = [...parents, folder];
      if (folder.id === targetId) {
        return newParents;
      }
      if (folder.children && folder.children.length > 0) {
        const found = buildFolderPath(folder.children, targetId, newParents);
        if (found) return found;
      }
    }
    return null;
  };

  const getSelectedFolderPathLabel = () => {
    if (!selectedFolder) {
      return 'Racine (Mes Dossiers)';
    }

    const pathNodes = buildFolderPath(folders || [], selectedFolder.id);
    if (!pathNodes || pathNodes.length === 0) {
      return selectedFolder.name_original || selectedFolder.name;
    }

    const names = pathNodes.map((f) => f.name_original || f.name);
    return names.join(' / ');
  };

  const handleCreate = async () => {
    const trimmedName = sanitizeName(name);

    if (!trimmedName) {
      setError('Le nom du dossier ne peut pas être vide.');
      return;
    }

    const parentId = selectedFolder ? selectedFolder.id : null;

    // Limiter la profondeur à 3 niveaux : DossierParent / DossierFils / DossierPetitFils
    if (parentId) {
      const pathNodes = buildFolderPath(folders || [], parentId) || [];
      const depth = pathNodes.length; // 1 = parent racine, 2 = fils, 3 = petit-fils

      if (depth >= 3) {
        const message = 'Vous ne pouvez pas créer de dossier au-delà de 3 niveaux (Parent / Fils / Petit-fils).';
        setError(message);
        if (onError) onError(message);
        return;
      }
    }

    try {
      setCreating(true);
      setError('');
      const response = await dossierService.createDossier({ name: trimmedName, parent_id: parentId });
      if (onDossierCreated) {
        onDossierCreated(response.data, parentId);
      }
      setName('');
      onClose();
    } catch (err) {
      const message = err.response?.data?.error || 'Une erreur est survenue.';
      setError(message);
      if (onError) onError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="modal-move-new">
      <div className="modal-header">
        <h2>Créer un nouveau dossier</h2>
      </div>

      <div className="modal-body">
        <p className="modal-description">
          Choisissez l'emplacement du dossier et saisissez son nom.
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

        <div className="destination-summary" style={{ marginTop: '1rem' }}>
          <span className="destination-label">Dossier parent :</span>
          <span className="destination-value">
            {getSelectedFolderPathLabel()}
          </span>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label htmlFor="newFolderName" className="form-label">Nom du dossier</label>
          <input
            type="text"
            id="newFolderName"
            value={name}
            onChange={(e) => {
              const value = sanitizeName(e.target.value);
              setName(value);
              if (value.length > 0) {
                setError('');
              }
            }}
            className="form-input"
          />
        </div>
      </div>

      <div className="modal-actions">
        <button
          onClick={onClose}
          className="btn btn-secondary"
          disabled={creating}
        >
          Annuler
        </button>
        <button
          onClick={handleCreate}
          className="btn btn-primary"
          disabled={creating || !name.trim()}
        >
          {creating ? 'Création...' : 'Créer'}
        </button>
      </div>
    </Modal>
  );
};

export default ModalFolder;
