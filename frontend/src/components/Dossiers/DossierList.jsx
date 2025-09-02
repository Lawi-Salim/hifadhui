import React from 'react';
import { Link } from 'react-router-dom';
import { FaFolder, FaEllipsisV } from 'react-icons/fa';
import ActionMenu from '../Common/ActionMenu';
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

const DossierList = ({ dossiers, viewMode, activeMenu, toggleMenu, handleOpenRenameModal, handleOpenUploadModal, handleOpenDeleteModal }) => {
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
            <Link to={`/dossiers/${dossier.hierarchicalPath || dossier.id}`} key={dossier.id} className={`dossier-card dossier-card-link-${dossier.id}`}>
              <FaFolder className="dossier-icon" />
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
              <div className="dossier-info">
                <p className="dossier-name">{dossier.name}</p>
                <p className="dossier-file-count">
                  {dossier.fileCount} {dossier.fileCount > 1 ? 'fichiers' : 'fichier'} | {
                  dossier.subDossierCount} {dossier.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                </p>
              </div>
            </Link>
          );
        } else {
          return (
            <div key={dossier.id} className={`dossier-list-item dossier-card-link-${dossier.id}`}>
              <Link to={`/dossiers/${dossier.hierarchicalPath || dossier.id}`} className="dossier-list-item-link">
                <FaFolder className="dossier-icon" />
                <div className="dossier-info">
                  <p className="dossier-name">{dossier.name}</p>
                  <p className="dossier-file-count">
                    {dossier.fileCount} {dossier.fileCount > 1 ? 'fichiers' : 'fichier'} | {
                    dossier.subDossierCount} {dossier.subDossierCount > 1 ? 'dossiers' : 'dossier'}
                  </p>
                </div>
              </Link>
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
            </div>
          );
        }
      })}
    </div>
  );
};

export default DossierList;
