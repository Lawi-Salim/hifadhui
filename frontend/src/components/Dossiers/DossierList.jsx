import React from 'react';
import { Link } from 'react-router-dom';
import { FaFolder, FaEllipsisV } from 'react-icons/fa';
import ActionMenu from '../Common/ActionMenu';
import FormattedText from '../Common/FormattedText';
import { createSlug, fixEncoding } from '../../utils/textUtils';
import { FiFolderPlus } from 'react-icons/fi';

// Fonction pour calculer la position du menu avec hauteur dynamique
const getMenuPosition = (buttonElement, optionsCount = 3) => {
  if (!buttonElement) return 'bottom';
  
  const rect = buttonElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
  const spaceBelow = viewportHeight - rect.bottom;
  
  return spaceBelow < menuHeight ? 'top' : 'bottom';
};

const DossierList = ({ 
  dossiers, 
  viewMode, 
  activeMenu, 
  toggleMenu, 
  handleOpenRenameModal, 
  handleOpenUploadModal, 
  handleOpenDeleteModal,
  isSelectionMode,
  selectedItems,
  handleSelectItem
}) => {
  // Log de débogage pour voir les dossiers reçus
  console.log('🔍 DEBUG Frontend - Dossiers reçus:', dossiers.map(d => ({
    id: d.id,
    name: d.name,
    name_original: d.name_original,
    display: d.name_original || d.name
  })));
  // Fonction pour gérer l'ouverture du menu avec calcul de position
  const handleToggleMenu = (e, dossierId) => {
    const position = getMenuPosition(e.currentTarget, 3); // 3 options pour dossiers: Renommer, Uploader, Supprimer
    toggleMenu(e, dossierId, position);
  };
  if (dossiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FiFolderPlus size={48} className="text-secondary mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun dossier</h3>
        <p className="text-secondary mb-4">Vous n'avez pas encore créé de dossier.</p>
        <button 
          onClick={() => document.querySelector('.btn-primary')?.click()}
          className="btn btn-primary"
        >
          Créer votre premier dossier
        </button>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'dossiers-grid' : 'dossiers-list'}>
      {dossiers.map(dossier => {
        if (viewMode === 'grid') {
          return (
            <div key={dossier.id} className={`dossier-card dossier-card-link-${dossier.id} ${selectedItems?.includes(dossier.id) ? 'selected' : ''}`}>
              {isSelectionMode ? (
                <div className="dossier-selection" onClick={() => handleSelectItem(dossier.id)}>
                  <input 
                    type="checkbox" 
                    checked={selectedItems?.includes(dossier.id) || false}
                    onChange={() => handleSelectItem(dossier.id)}
                  />
                  <FaFolder className="dossier-icon" />
                  <div className="dossier-info">
                    <FormattedText 
                      text={dossier.name_original || dossier.name} 
                      type="encoding" 
                      className="dossier-name"
                    />
                    <p className="dossier-file-count">
                      {dossier.fileCount} {dossier.fileCount > 1 ? 'fichiers' : 'fichier'} | {
                      dossier.subDossierCount} {dossier.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                    </p>
                  </div>
                </div>
              ) : (
                <Link to={`/dossiers/${createSlug(fixEncoding(dossier.name))}`} className="dossier-link">
                  <FaFolder className="dossier-icon" />
                  <div className="dossier-info">
                    <FormattedText 
                      text={dossier.name_original || dossier.name} 
                      type="encoding" 
                      className="dossier-name"
                    />
                    <p className="dossier-file-count">
                      {dossier.fileCount} {dossier.fileCount > 1 ? 'fichiers' : 'fichier'} | {
                      dossier.subDossierCount} {dossier.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                    </p>
                  </div>
                </Link>
              )}
              {!isSelectionMode && (
                <div className="dossier-actions-container">
                  <button className="btn-menu" onClick={(e) => handleToggleMenu(e, dossier.id)}>
                    <FaEllipsisV />
                  </button>
                  {activeMenu?.id === dossier.id && (
                    <ActionMenu
                      isOpen={true}
                      position={activeMenu?.position || 'bottom'}
                      onRename={(e) => handleOpenRenameModal(e, dossier)}
                      onUpload={(e) => handleOpenUploadModal(e, dossier)}
                      onDelete={(e) => handleOpenDeleteModal(e, dossier)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div key={dossier.id} className={`dossier-list-item dossier-card-link-${dossier.id} ${selectedItems?.includes(dossier.id) ? 'selected' : ''}`}>
              {isSelectionMode ? (
                <div className="dossier-list-selection" onClick={() => handleSelectItem(dossier.id)}>
                  <input 
                    type="checkbox" 
                    checked={selectedItems?.includes(dossier.id) || false}
                    onChange={() => handleSelectItem(dossier.id)}
                  />
                  <FaFolder className="dossier-icon" />
                  <div className="dossier-info">
                    <FormattedText 
                      text={dossier.name_original || dossier.name} 
                      type="encoding" 
                      className="dossier-name"
                    />
                    <p className="dossier-file-count">
                      {dossier.fileCount} {dossier.fileCount > 1 ? 'fichiers' : 'fichier'} | {
                      dossier.subDossierCount} {dossier.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                    </p>
                  </div>
                </div>
              ) : (
                <Link to={`/dossiers/${createSlug(fixEncoding(dossier.name))}`} className="dossier-list-item-link">
                  <FaFolder className="dossier-icon" />
                  <div className="dossier-info">
                    <FormattedText 
                      text={dossier.name_original || dossier.name} 
                      type="encoding" 
                      className="dossier-name"
                    />
                    <p className="dossier-file-count">
                      {dossier.fileCount} {dossier.fileCount > 1 ? 'fichiers' : 'fichier'} | {
                      dossier.subDossierCount} {dossier.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                    </p>
                  </div>
                </Link>
              )}
              {!isSelectionMode && (
                <div className="dossier-actions-container">
                  <button className="btn-menu" onClick={(e) => handleToggleMenu(e, dossier.id)}>
                    <FaEllipsisV />
                  </button>
                  {activeMenu?.id === dossier.id && (
                    <ActionMenu
                      isOpen={true}
                      position={activeMenu?.position || 'bottom'}
                      onRename={(e) => handleOpenRenameModal(e, dossier)}
                      onUpload={(e) => handleOpenUploadModal(e, dossier)}
                      onDelete={(e) => handleOpenDeleteModal(e, dossier)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};

export default DossierList;
