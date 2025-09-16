import React from 'react';
import { FaPencilAlt, FaTrash, FaUpload, FaDownload, FaShare, FaEye } from 'react-icons/fa';
import './ActionMenu.css';

const ActionMenu = ({ 
  onShow,
  onDownload, 
  onShare, 
  onRename, 
  onUpload, 
  onDelete, 
  position = 'bottom', 
  isOpen
}) => {
  if (!isOpen) return null;

  // Calculer le nombre d'options disponibles pour ajuster la hauteur
  const optionsCount = [onDownload, onShare, onRename, onUpload, onDelete].filter(Boolean).length;
  const menuHeight = optionsCount * 48 + 16; // 48px par option + padding

  return (
    <div 
      className={`actions-menu position-${position}`}
      style={{ '--menu-height': `${menuHeight}px` }}
    >
      {onShow && (
        <button className="menu-item" onClick={(e) => { e.stopPropagation(); onShow(); }}>
          <FaEye /> Voir
        </button>
      )}
      {onDownload && (
        <button className="menu-item" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
          <FaDownload /> Télécharger
        </button>
      )}
      {onShare && (
        <button className="menu-item" onClick={(e) => { e.stopPropagation(); onShare(); }}>
          <FaShare /> Partager
        </button>
      )}
      {onRename && (
        <button className="menu-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}>
          <FaPencilAlt /> Renommer
        </button>
      )}
      {onUpload && (
        <button className="menu-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpload(); }}>
          <FaUpload /> Uploader
        </button>
      )}
      {onDelete && (
        <button className="menu-item danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}>
          <FaTrash /> Supprimer
        </button>
      )}
    </div>
  );
};

export default ActionMenu;
