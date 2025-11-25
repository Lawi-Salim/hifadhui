import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaFolder, FaEllipsisV } from 'react-icons/fa';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import ItemList from '../Common/ItemList';
import FormattedText from '../Common/FormattedText';
import Breadcrumb from '../Common/Breadcrumb';
import FileDetailModal from '../Common/FileDetailModal';
import { useViewMode } from '../../contexts/ViewModeContext';
import ActionFolder from '../Common/ActionFolder';
import './FolderContent.css';

const FILES_PAGE_SIZE = 20;

const FolderContent = ({ 
  dossiers = [], 
  loadDossierDetails,
  onFileDownload,
  onFileRename,
  onFileDelete,
  onFileShare,
  onFileUpload,
  selectedFolder: externalSelectedFolder,
  onFolderSelected,
  onFolderRename,
  onFolderDelete,
  onFolderSearch,
  onFolderMove,
  onFolderAccessDetails,
  isSelectionMode = false,
  selectedItems = [],
  onSelectItem,
}) => {
  const [internalSelectedFolder, setInternalSelectedFolder] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const { viewMode } = useViewMode();
  const [hasSubFolderMap, setHasSubFolderMap] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [folderChildrenMap, setFolderChildrenMap] = useState({});
  const [treeHasFocus, setTreeHasFocus] = useState(false);
  const [visibleFilesCount, setVisibleFilesCount] = useState(FILES_PAGE_SIZE);
  const [hasMoreFiles, setHasMoreFiles] = useState(false);
  const observerRef = useRef(null);

  // Sélection effective utilisée par le composant (contrôlée ou interne)
  const selectedFolder = externalSelectedFolder !== undefined ? externalSelectedFolder : internalSelectedFolder;

  useEffect(() => {
    // Mode non contrôlé uniquement : réinitialiser sur la racine quand la liste change
    if (externalSelectedFolder !== undefined) return;
    if (!internalSelectedFolder && dossiers.length > 0) {
      setInternalSelectedFolder(null);
    }
  }, [dossiers, internalSelectedFolder, externalSelectedFolder]);

  const updateSelectedFolder = (folder) => {
    if (onFolderSelected) {
      onFolderSelected(folder);
    }
    if (externalSelectedFolder === undefined) {
      setInternalSelectedFolder(folder);
    }
  };

  const handleSelectFolder = async (folder) => {
    if (!folder) {
      updateSelectedFolder(null);
      return;
    }

    if (loadDossierDetails && folder.id) {
      try {
        const fullFolder = await loadDossierDetails(folder.id);
        updateSelectedFolder(fullFolder);

        const children = Array.isArray(fullFolder?.subDossiers)
          ? fullFolder.subDossiers
          : Array.isArray(fullFolder?.dossier?.subDossiers)
            ? fullFolder.dossier.subDossiers
            : [];

        if (children.length > 0) {
          setFolderChildrenMap((prev) => ({
            ...prev,
            [fullFolder.id || folder.id]: children,
          }));
        }
      } catch (e) {
        updateSelectedFolder(folder);
      }
    } else {
      updateSelectedFolder(folder);
    }
  };

  const currentFolder = selectedFolder || {
    id: 'root',
    name: 'Mes dossiers',
    subDossiers: dossiers,
    dossierFiles: []
  };

  const subFolders = currentFolder.subDossiers || [];
  const files = currentFolder.dossierFiles || [];
  const displayedFiles = files.slice(0, visibleFilesCount);

  // Construire le breadcrumb complet à partir des ancêtres renvoyés par l'API
  // On ignore le dossier système "Hifadhui" pour ne garder que les dossiers utilisateur
  const ancestors = (currentFolder.ancestors || []).filter(
    (ancestor) => ancestor.name !== 'Hifadhui'
  );

  // Chemin hiérarchique utilisé pour l'arborescence à gauche (branche du dossier courant)
  // On y ajoute également les sous-dossiers immédiats du dossier courant pour les afficher
  // comme enfants dans le ContentTree (comme dans l'explorateur Windows).
  const treePath = currentFolder.id === 'root'
    ? []
    : [
        ...ancestors.map((a) => ({ id: a.id, name: a.name })),
        { id: currentFolder.id, name: currentFolder.name_original || currentFolder.name },
        ...(currentFolder.subDossiers || []).map((child) => ({
          id: child.id,
          name: child.name_original || child.name,
        })),
      ];

  const findFolderMeta = (id) => {
    if (!id) return null;
    if (currentFolder && currentFolder.id === id) return currentFolder;

    const ancestor = ancestors.find((a) => a.id === id);
    if (ancestor) return ancestor;

    const root = dossiers.find((d) => d.id === id);
    if (root) return root;

    return null;
  };

  // Précharger pour les dossiers racine ET les dossiers de la branche courante (treePath)
  // l'info "a des sous-dossiers" afin d'afficher les chevrons même quand ils sont fermés.
  useEffect(() => {
    if (!loadDossierDetails) return;

    const allIds = [
      ...dossiers.map((d) => d.id),
      ...treePath.map((node) => node.id),
    ];

    const uniqueIds = Array.from(new Set(allIds));

    const idsToFetch = uniqueIds.filter((id) => id && hasSubFolderMap[id] === undefined);

    if (idsToFetch.length === 0) return;

    const fetchMeta = async () => {
      const updates = {};
      for (const id of idsToFetch) {
        try {
          const full = await loadDossierDetails(id);

          // Supporte les deux formats possibles de réponse :
          // - { subDossiers: [...] }
          // - { dossier: { subDossiers: [...] } }
          const subList = Array.isArray(full?.subDossiers)
            ? full.subDossiers
            : Array.isArray(full?.dossier?.subDossiers)
              ? full.dossier.subDossiers
              : [];

          updates[id] = subList.length > 0;
        } catch (e) {
          updates[id] = false;
        }
      }

      if (Object.keys(updates).length > 0) {
        setHasSubFolderMap((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchMeta();
  }, [dossiers, loadDossierDetails, hasSubFolderMap, treePath]);

  // Gestion du scroll "infini" pour les fichiers de la vue de contenu
  useEffect(() => {
    setVisibleFilesCount(FILES_PAGE_SIZE);
  }, [currentFolder.id]);

  useEffect(() => {
    setHasMoreFiles(visibleFilesCount < files.length);
  }, [visibleFilesCount, files.length]);

  const lastFileRef = useCallback((node) => {
    if (!hasMoreFiles) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFiles) {
          setVisibleFilesCount((prev) =>
            Math.min(prev + FILES_PAGE_SIZE, files.length)
          );
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (node) observerRef.current.observe(node);
  }, [hasMoreFiles, files.length]);

  const getMenuPosition = (buttonElement, optionsCount = 4) => {
    if (!buttonElement) return 'bottom';

    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
    const spaceBelow = viewportHeight - rect.bottom;

    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };

  const getTreeMenuPosition = (buttonElement, optionsCount = 7) => {
    if (!buttonElement) return 'bottom';

    const rect = buttonElement.getBoundingClientRect();
    const treeElement = buttonElement.closest('.folder-content-tree');

    const containerRect = treeElement
      ? treeElement.getBoundingClientRect()
      : document.documentElement.getBoundingClientRect();

    const menuHeight = optionsCount * 48 + 16;
    const spaceBelow = containerRect.bottom - rect.bottom;
    const spaceAbove = rect.top - containerRect.top;

    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      return 'top';
    }

    return 'bottom';
  };

  const toggleMenu = (e, id) => {
    // Fermer tous les menus
    if (e === null) {
      setActiveMenu(null);
      return;
    }

    // e est un événement de clic (bouton des 3 points)
    if (e && typeof e === 'object' && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      const position = getMenuPosition(e.currentTarget, 4);
      setActiveMenu(activeMenu?.id === id ? null : { id, position });
    } else {
      // e est directement l'id (appel programmatique)
      setActiveMenu(activeMenu?.id === e ? null : { id: e, position: 'bottom' });
    }
  };

  const toggleFolderExpand = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleFolderClick = async (folder, hasChildren) => {
    setTreeHasFocus(true);
    await handleSelectFolder(folder);
    if (hasChildren && folder?.id) {
      toggleFolderExpand(folder.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInTree = event.target.closest('.folder-content-tree');
      const isOnTreeItem = event.target.closest('.folder-tree-item');

      if (!isInTree || (isInTree && !isOnTreeItem)) {
        setTreeHasFocus(false);
      }

      if (
        !event.target.closest('.image-actions-menu') &&
        !event.target.closest('.actions-dropdown') &&
        !event.target.closest('.actions-menu') &&
        !event.target.closest('.btn-menu') &&
        !event.target.closest('.modal-overlay') &&
        !event.target.closest('.modal-content')
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePreview = (file) => {
    setFileToPreview(file);
    setIsPreviewModalOpen(true);
  };

  const breadcrumbItems = currentFolder.id === 'root'
    ? [
        { name: 'Mes Dossiers', path: '/dossiers' }
      ]
    : [
        { name: 'Mes Dossiers', path: '/dossiers' },
        ...ancestors.map((ancestor) => ({
          name: ancestor.name,
          path: '',
          folderId: ancestor.id,
        })),
        { 
          name: currentFolder.name_original || currentFolder.name, 
          path: '',
          folderId: currentFolder.id,
        }
      ];

  const handleBreadcrumbClick = async (item, index) => {
    // Index 0 = "Mes Dossiers" : retour à la racine (aucun dossier sélectionné)
    if (index === 0) {
      updateSelectedFolder(null);
      return;
    }

    const folderId = item.folderId || item.id;
    if (!folderId) return;

    if (loadDossierDetails) {
      try {
        const fullFolder = await loadDossierDetails(folderId);
        updateSelectedFolder(fullFolder);
      } catch (e) {
        updateSelectedFolder({ id: folderId, name: item.name });
      }
    } else {
      updateSelectedFolder({ id: folderId, name: item.name });
    }
  };

  const renderFolderNode = (folder, depth = 0) => {
    if (!folder) return null;

    const folderId = folder.id;
    const isCurrent = currentFolder.id !== 'root' && currentFolder.id === folderId;
    const isActive = isCurrent && treeHasFocus;
    const isSoftSelected = isCurrent && !treeHasFocus;
    const children =
      folderChildrenMap[folderId] ||
      (Array.isArray(folder.subDossiers) ? folder.subDossiers : []);

    const hasSubFoldersFromMeta = Array.isArray(folder.subDossiers) && folder.subDossiers.length > 0;
    const hasSubFoldersMapValue = hasSubFolderMap[folderId];
    const hasChildren =
      hasSubFoldersMapValue !== undefined
        ? hasSubFoldersMapValue
        : hasSubFoldersFromMeta ||
          (Array.isArray(children) && children.length > 0) ||
          (typeof folder.subDossierCount === 'number' && folder.subDossierCount > 0);

    const isExpanded = expandedFolders.has(folderId);
    const depthClass = depth > 0 ? `folder-tree-sub-item depth-${depth}` : '';
    const itemClasses = [
      'folder-tree-item',
      depthClass,
      isActive ? 'active' : '',
      isSoftSelected ? 'soft-selected' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <React.Fragment key={folderId}>
        <div
          className={itemClasses}
          onClick={() => handleFolderClick(folder, hasChildren)}
        >
          {hasChildren ? (
            <span className="tree-chevron">
              {isExpanded ? (
                <FiChevronDown className="tree-chevron-icon" />
              ) : (
                <FiChevronRight className="tree-chevron-icon" />
              )}
            </span>
          ) : (
            <span className="tree-chevron tree-chevron-placeholder" />
          )}
          <FaFolder className="tree-icon" />
          <span className="tree-label">{folder.name_original || folder.name}</span>
          <div className="folder-tree-actions">
            <button
              className="btn-menu folder-tree-menu-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const position = getTreeMenuPosition(e.currentTarget, 7);
                setActiveMenu(
                  activeMenu?.id === `folder-${folderId}`
                    ? null
                    : { id: `folder-${folderId}`, position }
                );
              }}
            >
              <FaEllipsisV />
            </button>
            {activeMenu?.id === `folder-${folderId}` && (
              <ActionFolder
                isOpen={true}
                position={activeMenu?.position || 'bottom'}
                onOpen={() => {
                  handleSelectFolder(folder);
                  setActiveMenu(null);
                }}
                onSearch={
                  onFolderSearch
                    ? () => {
                        onFolderSearch(folder);
                        setActiveMenu(null);
                      }
                    : null
                }
                onAccessDetails={
                  onFolderAccessDetails
                    ? () => {
                        onFolderAccessDetails(folder);
                        setActiveMenu(null);
                      }
                    : null
                }
                onRename={
                  onFolderRename
                    ? () => {
                        onFolderRename(folder);
                        setActiveMenu(null);
                      }
                    : null
                }
                onMove={
                  onFolderMove
                    ? () => {
                        onFolderMove(folder);
                        setActiveMenu(null);
                      }
                    : null
                }
                onDelete={
                  onFolderDelete
                    ? () => {
                        onFolderDelete(folder);
                        setActiveMenu(null);
                      }
                    : null
                }
              />
            )}
          </div>
        </div>

        {hasChildren && isExpanded && Array.isArray(children) && children.length > 0 && (
          <div className="folder-tree-children">
            {children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="folder-content-container">
      <div className="folder-content-header">
        <Breadcrumb items={breadcrumbItems} onItemClick={handleBreadcrumbClick} />
        <div className="folder-content-header-right">
          {subFolders.length} dossier(s) – {files.length} fichier(s)
        </div>
      </div>

      <div className="folder-content-main">
        <div className="folder-content-tree">
          <div className="folder-content-tree-list">
            {dossiers.map((dossier) => renderFolderNode(dossier, 0))}
          </div>
        </div>

        <div className="folder-content-view-wrapper">
          <div className="folder-content-view-body">
          {files.length > 0 && (
            <>
              <ItemList
                items={displayedFiles}
                viewMode={viewMode}
                activeMenu={activeMenu}
                toggleMenu={toggleMenu}
                handleOpenFile={onFileDownload}
                handleOpenFileRenameModal={onFileRename}
                handleOpenFileDeleteModal={onFileDelete}
                handleOpenPreviewModal={handlePreview}
                handleShare={onFileShare}
                isSelectionMode={isSelectionMode}
                selectedItems={selectedItems}
                handleSelectItem={onSelectItem || (() => {})}
                handleOpenUploadModal={onFileUpload}
                lastItemRef={lastFileRef}
                hasMore={hasMoreFiles}
                loading={false}
              />
              {!hasMoreFiles && (
                <div className="folder-all-loaded-message">
                  Tous les fichiers ont été chargés
                </div>
              )}
            </>
          )}

          {subFolders.length === 0 && files.length === 0 && (
            <div className="folder-empty-wrapper">
              <div className="empty-folder">
                <FaFolder className="empty-icon" />
                <p>Ce dossier est vide</p>
              </div>
            </div>
          )}
          </div>
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
    </div>
  );
};

export default FolderContent;
