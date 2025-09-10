import React from 'react';
import { FaFileAlt, FaEllipsisV, FaDownload, FaEdit, FaTrash, FaUpload } from 'react-icons/fa';
import { FiFilePlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import FormattedText from '../Common/FormattedText';
import './FileList.css';

const FileList = ({ 
  files, 
  viewMode, 
  activeMenu, 
  toggleMenu, 
  handleOpenFile, 
  handleOpenRenameModal, 
  handleOpenDeleteModal 
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FiFilePlus size={48} className="text-secondary mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun fichier</h3>
        <p className="text-secondary mb-4">Vous n'avez pas encore ajouté de fichiers.</p>
        <Link to="/upload" className="btn btn-primary">
          <FaUpload className="mr-2" /> Téléverser votre premier fichier
        </Link>
      </div>
    );
  }

  return (
    <div className={`file-list ${viewMode}`}>
      {files.map(file => (
        <div key={file.id} className="file-item-container">
          <div className="file-item-link">
            <div className="file-item-content" onClick={() => handleOpenFile(file)}>
              <FaFileAlt className="file-icon" />
              <div className="file-info">
                <FormattedText 
                  text={file.filename} 
                  type="filename" 
                  className="file-name"
                  maxLength={45}
                />
                {viewMode === 'list' && (
                  <span className="file-date">{formatDate(file.date_upload)}</span>
                )}
              </div>
            </div>
            <div className="file-actions">
              <button onClick={(e) => { e.stopPropagation(); toggleMenu(file.id); }} className="menu-btn">
                <FaEllipsisV />
              </button>
              {activeMenu === file.id && (
                <div className="menu-dropdown">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenFile(file); toggleMenu(null); }}>
                    <FaDownload /> Télécharger
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleOpenRenameModal(file); toggleMenu(null); }}>
                    <FaEdit /> Renommer
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(file.id); toggleMenu(null); }} className="text-danger">
                    <FaTrash /> Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
