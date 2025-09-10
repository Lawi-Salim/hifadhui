import React, { useState, useEffect } from 'react';
import { FaFolder } from 'react-icons/fa';
import { FiChevronsRight, FiChevronsDown, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { createSlug, fixEncoding } from '../../utils/textUtils';
import ActionMenu from '../Common/ActionMenu';
import './FolderTreeView.css';

const FolderTreeView = ({ 
  folders = [], 
  selectedFolderId, 
  onFolderSelect,
  expandedFolders = [],
  onToggleExpand,
  onFolderRename,
  onFolderUpload,
  onFolderDelete
}) => {
  const [activeMenu, setActiveMenu] = useState(null);

  // Fonction pour calculer la position du menu avec hauteur dynamique
  const getMenuPosition = (buttonElement, optionsCount = 3) => {
    if (!buttonElement) return 'bottom';
    
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
    const spaceBelow = viewportHeight - rect.bottom;
    
    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };

  const toggleMenu = (e, folderId) => {
    if (e === null) {
      setActiveMenu(null);
      return;
    }
    
    if (e && typeof e === 'object' && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      const position = getMenuPosition(e.currentTarget, 3); // 3 options pour dossiers: Renommer, Uploader, Supprimer
      setActiveMenu(activeMenu?.id === folderId ? null : { id: folderId, position });
    } else {
      setActiveMenu(activeMenu?.id === e ? null : { id: e, position: 'bottom' });
    }
  };
  
  // Détermine le type de chevron basé sur le contenu du dossier
  const getChevronType = (folder) => {
    // Vérifier les fichiers dans dossierFiles ou utiliser fileCount
    const hasFiles = (folder.dossierFiles && folder.dossierFiles.length > 0) || 
                     (folder.fileCount && folder.fileCount > 0);
    
    // Vérifier les sous-dossiers dans subDossiers ou utiliser subDossierCount
    const hasSubFolders = (folder.subDossiers && folder.subDossiers.length > 0) || 
                          (folder.subDossierCount && folder.subDossierCount > 0);
    
    if (hasFiles) {
      // Double chevron si contient des fichiers (avec ou sans sous-dossiers)
      return 'double';
    } else if (hasSubFolders) {
      // Simple chevron si contient uniquement des sous-dossiers
      return 'single';
    }
    
    return null; // Pas de chevron si vide
  };

  const renderChevron = (folder, isExpanded) => {
    const chevronType = getChevronType(folder);
    
    if (!chevronType) return <span className="no-chevron"></span>;
    
    if (chevronType === 'double') {
      const DoubleChevronIcon = isExpanded ? FiChevronsDown : FiChevronsRight;
      return (
        <span className="chevron-container double">
          <DoubleChevronIcon className="chevron-icon" />
        </span>
      );
    } else {
      const SingleChevronIcon = isExpanded ? FiChevronDown : FiChevronRight;
      return (
        <span className="chevron-container single">
          <SingleChevronIcon className="chevron-icon" />
        </span>
      );
    }
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.subDossierCount && folder.subDossierCount > 0;
    
    return (
      <div key={folder.id} className="folder-tree-item">
        <div 
          className={`folder-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            onFolderSelect(folder);
            onToggleExpand(folder.id);
          }}
        >
          <div className="folder-content">
            <div className="expand-button">
              {renderChevron(folder, isExpanded)}
            </div>
            
            <FaFolder className="folder-icon" />
            <span className="folder-name">{folder.name_original}</span>
            
            <div className="folder-actions-container">
              <button 
                className="folder-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(e, folder.id);
                }}
              >
                ⋮
              </button>
              {activeMenu?.id === folder.id && (
                <ActionMenu
                  isOpen={true}
                  position={activeMenu.position}
                  onClose={() => setActiveMenu(null)}
                  onRename={() => {
                    if (onFolderRename) {
                      onFolderRename(null, folder);
                    }
                    setActiveMenu(null);
                  }}
                  onUpload={() => {
                    if (onFolderUpload) {
                      onFolderUpload(null, folder);
                    }
                    setActiveMenu(null);
                  }}
                  onDelete={() => {
                    if (onFolderDelete) {
                      onFolderDelete(null, folder);
                    }
                    setActiveMenu(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Sous-dossiers */}
        {isExpanded && folder.subDossiers && folder.subDossiers.length > 0 && (
          <div className="subfolder-container">
            {folder.subDossiers.map(subFolder => 
              renderFolder(subFolder, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree-view">
      <div className="tree-header">
        <h2>Arborescence</h2>
      </div>
      <div className="tree-content" onClick={(e) => {
        
        // Désélectionner si on clique directement sur tree-content
        if (e.target === e.currentTarget) {
          // Appeler une fonction de désélection via props
          if (onFolderSelect) {
            onFolderSelect(null);
          }
        }
      }}>
        {folders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
};

export default FolderTreeView;
