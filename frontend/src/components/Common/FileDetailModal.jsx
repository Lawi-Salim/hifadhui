import React from 'react';
import { FaTimes, FaDownload, FaEye, FaCalendar, FaFileAlt, FaImage, FaFilePdf } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import PdfPreview from './PdfPreview';
import { buildCloudinaryUrl } from '../../config/cloudinary';
// import './FileDetailModal.css'; // Fichier CSS manquant
import '../Images/Images.css';

const FileDetailModal = ({ file, onClose, type = 'file', isOpen }) => {
  const { user } = useAuth();
  
  if (!isOpen) return null;

  if (!file) return null;

  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  // Fonction pour construire l'URL complète des images
  const getImageUrl = (fileUrl) => {
    return buildCloudinaryUrl(fileUrl, 'image');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateFilename = (filename, maxLength = 15) => {
    if (!filename) return '';
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength) + '...';
  };

  // Déterminer les données à afficher selon le type
  const getDisplayData = () => {
    return file;
  };

  const displayData = getDisplayData();

  const title = isImage ? 'Détails de l\'image' : 'Détails du fichier';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <div className="modal-content-grid">
          <div className="modal-image-container">
            {isImage ? (
              <>
                <img 
                  src={getImageUrl(displayData.file_url)} 
                  alt={displayData.filename} 
                  className="modal-image-preview"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </>
            ) : isPdf ? (
              <>
                <PdfPreview fileUrl={displayData.file_url} fileId={file.id} fullPage={true} />
              </>
            ) : (
              <div style={{ width: '300px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                <p>L'aperçu n'est pas disponible pour ce type de fichier.</p>
              </div>
            )}
          </div>
          <div className="modal-details-container">
            <div className="detail-section">
              <h4>{title}</h4>
              <dl className="details-list">
                <dt>Nom:</dt><dd title={displayData.filename}>{truncateFilename(displayData.filename)}</dd>
                <dt>Type:</dt><dd>{displayData.mimetype}</dd>
                <dt>Version:</dt><dd>{displayData.version || 1}</dd>
                <dt>Date d'upload:</dt><dd>{formatDate(displayData.date_upload)}</dd>
                <dt>Taille:</dt><dd>{displayData.size ? `${(displayData.size / 1024).toFixed(2)} KB` : 'Non disponible'}</dd>
                <dt>Emplacement:</dt><dd>{displayData.dossier?.fullPath || displayData.dossier?.name_original || displayData.dossier?.name || 'Racine'}</dd>
              </dl>
            </div>
            <div className="detail-section">
              <h4>Intégrité</h4>
              <dl className="details-list">
                <dt>Hash (SHA-256):</dt><dd className="hash-text">{displayData.hash}</dd>
                <dt>Signature:</dt><dd className="hash-text">{displayData.signature}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;
