import React from 'react';
import {
  FaFolderOpen,
  FaSearch,
  FaDownload,
  FaShare,
  FaInfoCircle,
  FaPencilAlt,
  FaExchangeAlt,
  FaTrash,
} from 'react-icons/fa';
import './ActionMenu.css';

const ActionFolder = ({
  onOpen,
  onSearch,
  onDownload,
  onShare,
  onAccessDetails,
  onRename,
  onMove,
  onDelete,
  position = 'bottom',
  isOpen,
}) => {
  if (!isOpen) return null;

  const optionsCount = [
    onOpen,
    onSearch,
    onDownload,
    onShare,
    onAccessDetails,
    onRename,
    onMove,
    onDelete,
  ].filter(Boolean).length;

  const menuHeight = optionsCount * 48 + 16; // 48px par option + padding

  return (
    <div
      className={`actions-menu folder-actions-menu position-${position}`}
      style={{ '--menu-height': `${menuHeight}px` }}
    >
      {onOpen && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpen();
          }}
        >
          <FaFolderOpen /> Ouvrir
        </button>
      )}

      {onSearch && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSearch();
          }}
        >
          <FaSearch /> Rechercher dans ce dossier
        </button>
      )}

      {onDownload && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDownload();
          }}
        >
          <FaDownload /> Télécharger
        </button>
      )}

      {onShare && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShare();
          }}
        >
          <FaShare /> Partager
        </button>
      )}

      {onAccessDetails && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAccessDetails();
          }}
        >
          <FaInfoCircle /> Access Details
        </button>
      )}

      {onRename && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRename();
          }}
        >
          <FaPencilAlt /> Renommer
        </button>
      )}

      {onMove && (
        <button
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove();
          }}
        >
          <FaExchangeAlt /> Déplacer vers
        </button>
      )}

      {onDelete && (
        <button
          className="menu-item danger"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        >
          <FaTrash /> Supprimer
        </button>
      )}
    </div>
  );
};

export default ActionFolder;
