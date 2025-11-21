import React, { useState } from 'react';
import { formatFileSize } from '../../utils/fileSize';

const FolderDetails = ({ isOpen, onClose, folder }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !folder) return null;

  const displayName = folder.name_original || folder.name || 'Dossier';
  const ancestors = (folder.ancestors || []).filter((a) => a.name !== 'Hifadhui');
  const pathParts = ancestors.map((a) => a.name_original || a.name);
  pathParts.push(displayName);
  const fullPath = pathParts.join(' / ');

  const dossierFiles = Array.isArray(folder.dossierFiles) ? folder.dossierFiles : [];

  // Utiliser les stats récursives si elles sont fournies par DossiersPage,
  // sinon retomber sur les fichiers directs du dossier uniquement.
  const allFilesForStats = Array.isArray(folder.recursiveFiles)
    ? folder.recursiveFiles
    : dossierFiles;

  const fileCount = typeof folder.recursiveFileCount === 'number'
    ? folder.recursiveFileCount
    : typeof folder.fileCount === 'number'
      ? folder.fileCount
      : allFilesForStats.length;

  const imagesCount = typeof folder.recursiveImagesCount === 'number'
    ? folder.recursiveImagesCount
    : allFilesForStats.filter(
        (f) => f.mimetype && f.mimetype.startsWith('image/')
      ).length;

  const pdfCount = typeof folder.recursivePdfCount === 'number'
    ? folder.recursivePdfCount
    : allFilesForStats.filter(
        (f) => f.mimetype === 'application/pdf'
      ).length;

  const subFolderCount = typeof folder.subDossierCount === 'number'
    ? folder.subDossierCount
    : Array.isArray(folder.subDossiers)
      ? folder.subDossiers.length
      : 0;

  const getNumericSize = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const folderSizeBytes = (() => {
    const fromRecursive = getNumericSize(folder.recursiveSizeBytes);
    if (fromRecursive > 0) return fromRecursive;

    return allFilesForStats.reduce(
      (total, file) => total + getNumericSize(file?.size),
      0
    );
  })();

  const folderSizeLabel = formatFileSize(folderSizeBytes);

  const formatDate = (value) => {
    if (!value) return 'Inconnue';
    return new Date(value).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const createdAt = formatDate(folder.created_at);
  const updatedAt = formatDate(folder.updated_at);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content folder-details-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2 className="folder-details-title">
          Infos du dossier <span className="folder-details-title-name">{displayName}</span>
        </h2>
        <div className="folder-details-layout">
          <div className="folder-details-sidebar">
            <button
              type="button"
              className={
                activeTab === 'details'
                  ? 'folder-details-tab active'
                  : 'folder-details-tab'
              }
              onClick={() => setActiveTab('details')}
            >
              Détails du dossier
            </button>
            <button
              type="button"
              className={
                activeTab === 'access'
                  ? 'folder-details-tab active'
                  : 'folder-details-tab'
              }
              onClick={() => setActiveTab('access')}
            >
              Accès control
            </button>
          </div>
          <div className="folder-details-main">
            {activeTab === 'details' ? (
              <div className="folder-details-section">
                <dl className="folder-details-list">
                  <div className="folder-details-row">
                    <dt>Nom</dt>
                    <dd>{displayName}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Chemin</dt>
                    <dd>Hifadhui / {fullPath || '/'}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Sous-dossiers</dt>
                    <dd>{subFolderCount}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Taille</dt>
                    <dd>{folderSizeLabel}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Fichiers</dt>
                    <dd>{fileCount}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Images</dt>
                    <dd>{imagesCount}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>PDFs</dt>
                    <dd>{pdfCount}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Créé le</dt>
                    <dd>{createdAt}</dd>
                  </div>
                  <div className="folder-details-row">
                    <dt>Modifié le</dt>
                    <dd>{updatedAt}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="folder-details-section">
                <p className="folder-details-placeholder">
                  La configuration du contrôle d'accès pour ce dossier sera disponible prochainement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderDetails;
