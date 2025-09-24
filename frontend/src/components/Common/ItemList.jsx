import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUpload, FaEye, FaDownload, FaShare, FaEdit, FaTrash, FaEllipsisV, FaFolder, FaImage, FaFilePdf, FaFileAlt } from 'react-icons/fa';
import { FiFilePlus } from 'react-icons/fi';
import FormattedText from './FormattedText';
import ActionMenu from './ActionMenu';
import PdfPreview from './PdfPreview';
import { buildCloudinaryUrl } from '../../config/cloudinary';
import { createSlug, fixEncoding } from '../../utils/textUtils';
import '../Admin/AdminStyles.css'; // Import des styles admin pour la vue liste

const ItemList = ({ 
  items = [], 
  viewMode, 
  activeMenu, 
  toggleMenu, 
  // Handlers pour les actions
  handleOpenFile,
  handleOpenFileRenameModal,
  handleOpenFileDeleteModal,
  handleOpenPreviewModal,
  handleShare,
  // Handlers pour les dossiers
  handleOpenRenameModal,
  handleOpenUploadModal,
  handleOpenDeleteModal,
  // Props pour la sélection multiple
  isSelectionMode = false,
  selectedItems = [],
  handleSelectItem,
  // Handler pour l'aperçu personnalisé des images
  customPreviewHandler,
  customActionsMenu,
  menuButtonRefs,
  // Props pour le scroll infini
  lastItemRef,
  hasMore,
  loading
}) => {
  const localMenuButtonRefs = useRef({});
  const refs = menuButtonRefs || localMenuButtonRefs;

  const getMenuPosition = (itemId) => {
    const button = refs.current[itemId];
    if (!button) return {};

    const rect = button.getBoundingClientRect();
    const menuHeight = 200; // Hauteur approximative du menu
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Si pas assez d'espace en bas, afficher en haut
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      return {
        position: 'fixed',
        top: rect.top - menuHeight - 5,
        left: rect.right - 180, // 180px = largeur du menu
        zIndex: 9999
      };
    } else {
      // Affichage normal en bas
      return {
        position: 'fixed',
        top: rect.bottom + 5,
        left: rect.right - 180,
        zIndex: 9999
      };
    }
  };




  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.image-actions-menu') && 
          !event.target.closest('.actions-dropdown') && 
          !event.target.closest('.actions-menu') && 
          !event.target.closest('.btn-menu') &&
          !event.target.closest('.modal-overlay') &&
          !event.target.closest('.modal-content')) {
        toggleMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toggleMenu]);

  // Si pas d'éléments, afficher un message
  if (!items || items.length === 0) {
    const path = window.location.pathname;
    const isFilesPage = path.includes('/files') || path.includes('/fichiers');
    const isDossierPage = path.includes('/dossiers');
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FiFilePlus size={48} className="text-secondary mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isFilesPage ? 'Aucun fichier' : isDossierPage ? 'Ce dossier est vide' : 'Aucun élément'}
        </h3>
        <p className="text-secondary mb-4">
          {isFilesPage 
            ? "Vous n'avez pas encore ajouté de fichiers."
            : isDossierPage
            ? "Ce dossier ne contient aucun fichier ou sous-dossier."
            : "Aucun élément à afficher pour le moment."
          }
        </p>
        {isFilesPage && (
          <Link to="/upload" className="btn btn-primary">
            <FaUpload className="mr-2" /> Téléverser votre premier fichier
          </Link>
        )}
        {isDossierPage && handleOpenUploadModal && (
          <button 
            onClick={handleOpenUploadModal} 
            className="btn btn-primary"
          >
            <FaUpload className="mr-2" /> Uploader un fichier
          </button>
        )}
      </div>
    );
  }


  const getImageUrl = (fileUrl) => {
    return buildCloudinaryUrl(fileUrl, 'image');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FaFileAlt className="dossier-icon file-icon" />;
    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];

    if (extension === 'pdf') {
      return <FaFilePdf className="dossier-icon file-icon pdf-icon" />;
    }

    if (imageExtensions.includes(extension)) {
      return <FaImage className="dossier-icon file-icon image-icon" />;
    }

    return <FaFileAlt className="dossier-icon file-icon" />;
  };

  const renderItem = (item) => {
    const isSelected = isSelectionMode && selectedItems && (
      selectedItems.includes(item.id) || 
      selectedItems.some(selectedItem => selectedItem.id === item.id)
    );
    const isDossier = !item.filename;

    if (viewMode === 'grid') {
      if (isDossier) {
        return (
          <Link to={`/dossiers/${item.hierarchicalPath || createSlug(fixEncoding(item.name))}`} key={item.id} className="dossier-card">
            <FaFolder className="dossier-icon" />
            <div className="dossier-actions-container">
              <button className="btn-menu" onClick={(e) => toggleMenu(e, item.id)}>
                <FaEllipsisV />
              </button>
              {activeMenu?.id === item.id && (
                <ActionMenu
                  isOpen={true}
                  position={activeMenu?.position || 'bottom'}
                  onRename={handleOpenRenameModal ? () => { handleOpenRenameModal(null, item); toggleMenu(null); } : null}
                  onUpload={handleOpenUploadModal ? () => { handleOpenUploadModal(null, item); toggleMenu(null); } : null}
                  onDelete={handleOpenDeleteModal ? () => { handleOpenDeleteModal(null, item); toggleMenu(null); } : null}
                />
              )}
            </div>
            <div className="dossier-info">
              <p className="dossier-name">{item.name}</p>
              <p className="dossier-file-count">
                {item.fileCount} {item.fileCount > 1 ? 'fichiers' : 'fichier'} | {item.subDossierCount} {item.subDossierCount > 1 ? 'dossiers' : 'dossier'}
              </p>
            </div>
          </Link>
        );
      } else {
        const isPdf = item.filename?.split('.').pop().toLowerCase() === 'pdf';

        return (
          <div 
            key={item.id} 
            className={`image-card-modern file-card ${activeMenu?.id === item.id ? 'menu-open' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => isSelectionMode && handleSelectItem(item)}
          >
            {isSelectionMode && (
              <div className="selection-checkbox">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => handleSelectItem(item)}
                  onClick={(e) => e.stopPropagation()} // Empêche le clic de se propager à la div parente
                />
              </div>
            )}
            <div className="image-preview-modern" onClick={(e) => {
              if (isSelectionMode) {
                e.stopPropagation();
                handleSelectItem(item);
              } else {
                customPreviewHandler ? customPreviewHandler(item) : (handleOpenPreviewModal && handleOpenPreviewModal(item));
              }
            }}>
              {isPdf ? (
                <PdfPreview fileUrl={item.file_url} fileId={item.id} className="pdf-thumbnail" />
              ) : item.mimetype && item.mimetype.startsWith('image/') ? (
                <img 
                  src={getImageUrl(item.file_url)} 
                  alt={item.filename}
                  loading="lazy"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div className="file-icon-container">{getFileIcon(item.filename)}</div>
              )}
            </div>
            <div className="image-info">
              <div className="image-details">
                <FormattedText 
                  text={item.filename} 
                  type="filename" 
                  className="image-name"
                  maxLength={15}
                  hideExtension={true}
                />
                <p className="image-date">{formatDate(item.date_upload)}</p>
              </div>
              {!isSelectionMode && (
                <div className="image-actions-menu">
                  <button 
                    className="btn-menu" 
                    ref={el => refs.current[item.id] = el}
                    onClick={(e) => { e.stopPropagation(); toggleMenu(e, item.id); }}
                  >
                    <FaEllipsisV />
                  </button>
                </div>
              )}
              {!isSelectionMode && activeMenu?.id === item.id && customActionsMenu && customActionsMenu(item)}
              {!isSelectionMode && activeMenu?.id === item.id && !customActionsMenu && (
                <ActionMenu
                  isOpen={true}
                  position={activeMenu?.position || 'bottom'}
                  onDownload={handleOpenFile ? () => { handleOpenFile(item); toggleMenu(null); } : null}
                  onShare={handleShare ? () => { handleShare(item); toggleMenu(null); } : null}
                  onRename={handleOpenFileRenameModal ? () => { handleOpenFileRenameModal(item); toggleMenu(null); } : null}
                  onDelete={handleOpenFileDeleteModal ? () => { handleOpenFileDeleteModal(item); toggleMenu(null); } : null}
                  onClose={() => toggleMenu(null)}
                />
              )}
            </div>
          </div>
        );
      }
    } else { // list view
      if (isDossier) {
        return (
          <div key={item.id} className="dossier-list-item">
              <Link to={`/dossiers/${item.hierarchicalPath || createSlug(fixEncoding(item.name))}`} className="dossier-list-item-link">
              <FaFolder className="dossier-icon" />
              <div className="dossier-info">
                <p className="dossier-name">{item.name}</p>
                <p className="dossier-file-count">
                  {item.fileCount} {item.fileCount > 1 ? 'fichiers' : 'fichier'} | {item.subDossierCount} {item.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                </p>
              </div>
            </Link>
            {!isSelectionMode && (
              <div className="dossier-actions-container">
                <button className="btn-menu" onClick={(e) => toggleMenu(e, item.id)}>
                  <FaEllipsisV />
                </button>
                {activeMenu?.id === item.id && (
                  <ActionMenu
                    isOpen={true}
                    position={activeMenu?.position || 'bottom'}
                    onRename={handleOpenRenameModal ? () => { handleOpenRenameModal(null, item); toggleMenu(null); } : null}
                    onUpload={handleOpenUploadModal ? () => { handleOpenUploadModal(null, item); toggleMenu(null); } : null}
                    onDelete={handleOpenDeleteModal ? () => { handleOpenDeleteModal(null, item); toggleMenu(null); } : null}
                  />
                )}
              </div>
            )}
          </div>
        );
      } else { // File in list view - Style admin avec aperçus
        const isImage = item.mimetype && item.mimetype.startsWith('image/');
        const isPdf = item.mimetype === 'application/pdf';
        
        return (
          <div 
            key={item.id} 
            className={`admin-list-item file-item-list-view ${isSelected ? 'selected' : ''}`}
            onClick={() => isSelectionMode ? handleSelectItem(item) : (customPreviewHandler ? customPreviewHandler(item) : (handleOpenPreviewModal && handleOpenPreviewModal(item)))}
          >
            {isSelectionMode && (
              <div className="selection-checkbox-list">
                  <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleSelectItem(item)}
                      onClick={(e) => e.stopPropagation()}
                  />
              </div>
            )}
            
            <div className="list-item-preview">
              {isImage ? (
                <img 
                  src={getImageUrl(item.file_url)}
                  alt={item.filename}
                  className="list-thumbnail"
                />
              ) : isPdf ? (
                <div className="pdf-preview-container">
                  <PdfPreview fileUrl={item.file_url} fileId={item.id} className="list-thumbnail" />
                  <div className="file-type-badge pdf-badge">PDF</div>
                </div>
              ) : (
                <div className="file-icon-preview">
                  {getFileIcon(item.filename)}
                </div>
              )}
            </div>
            
            <div className="list-item-info">
              <div className="list-item-header">
                <h4 className="list-item-title" title={item.filename}>
                  <FormattedText 
                    text={item.filename} 
                    type="filename" 
                    maxLength={40}
                  />
                </h4>
              </div>
              
              <div className="list-item-meta">
                <div className="file-details">
                  <span className="file-size">{item.size ? `${(item.size / 1024).toFixed(2)} KB` : 'N/A'}</span>
                  <span className="file-date">{formatDate(item.date_upload)}</span>
                </div>
              </div>
            </div>
            {!isSelectionMode && (
              <div className="dossier-actions-container">
                  <button 
                      className="btn-menu" 
                      ref={el => refs.current[item.id] = el}
                      onClick={(e) => { e.stopPropagation(); toggleMenu(e, item.id); }}
                  >
                      <FaEllipsisV />
                  </button>
                  {activeMenu?.id === item.id && customActionsMenu && customActionsMenu(item)}
                  {activeMenu?.id === item.id && !customActionsMenu && (
                    <ActionMenu
                      isOpen={true}
                      position={activeMenu?.position || 'bottom'}
                      onDownload={handleOpenFile ? () => { handleOpenFile(item); toggleMenu(null); } : null}
                      onShare={handleShare ? () => { handleShare(item); toggleMenu(null); } : null}
                      onRename={handleOpenFileRenameModal ? () => { handleOpenFileRenameModal(item); toggleMenu(null); } : null}
                      onDelete={handleOpenFileDeleteModal ? () => { handleOpenFileDeleteModal(item); toggleMenu(null); } : null}
                      onClose={() => toggleMenu(null)}
                    />
                  )}
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className={viewMode === 'grid' ? 'dossiers-grid' : 'dossiers-list'}>
      {items.map((item, index) => {
        // Attacher la ref au dernier élément pour le scroll infini
        const isLastItem = index === items.length - 1;
        const itemElement = renderItem(item);
        
        if (isLastItem && lastItemRef) {
          return (
            <div key={item.id} ref={lastItemRef}>
              {itemElement}
            </div>
          );
        }
        
        return <div key={item.id}>{itemElement}</div>;
      })}
    </div>
  );
};

export default ItemList;
