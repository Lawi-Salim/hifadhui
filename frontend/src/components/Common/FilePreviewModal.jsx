import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PdfPreview from './PdfPreview';
import '../Modal.css';
import '../Images/Images.css';

const FilePreviewModal = ({ file, onClose }) => {
  const { user } = useAuth();
  
  if (!file) {
    return null;
  }

  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  // Fonction pour construire l'URL complète des images
  const getImageUrl = (fileUrl) => {
    if (fileUrl.startsWith('http')) {
      return fileUrl; // URL complète déjà fournie
    } else if (fileUrl.startsWith('hifadhwi/') || /^v\d+\/hifadhwi\//.test(fileUrl) ||
               fileUrl.startsWith('hifadhui/') || /^v\d+\/hifadhui\//.test(fileUrl)) {
      // Chemin relatif Cloudinary (avec ou sans version) - construire l'URL complète pour les images
      // Support des anciens chemins hifadhui/ et nouveaux hifadhwi/
      return `https://res.cloudinary.com/ddxypgvuh/image/upload/${fileUrl}`;
    } else {
      // Chemin local - utiliser l'API backend
      return `${process.env.REACT_APP_API_BASE_URL}${fileUrl}`;
    }
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <div className="modal-content-grid">
          <div className="modal-image-container">
            {isImage ? (
              <>
                <img 
                  src={getImageUrl(file.file_url)} 
                  alt={file.filename} 
                  className="modal-image-preview"
                  onContextMenu={(e) => e.preventDefault()}
                />
                <div className="watermark">
                  {user.username}
                </div>
              </>
            ) : isPdf ? (
              <div style={{ width: '300px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <PdfPreview fileUrl={file.file_url} fileId={file.id} />
                <div className="watermark">
                  {user.username}
                </div>
              </div>
            ) : (
              <div style={{ width: '300px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                <p>L'aperçu n'est pas disponible pour ce type de fichier.</p>
              </div>
            )}
          </div>
          <div className="modal-details-container">
            <div className="detail-section">
              <h4>Détails du fichier</h4>
              <dl className="details-list">
                <dt>Nom:</dt><dd>{file.filename}</dd>
                <dt>Type:</dt><dd>{file.mimetype}</dd>
                <dt>Version:</dt><dd>{file.certificateFile ? file.certificateFile.version : (file.version || 1)}</dd>
                <dt>Date d'upload:</dt><dd>{formatDate(file.date_upload)}</dd>
                <dt>Certificat:</dt><dd>{file.fileCertificates?.length > 0 ? 'Disponible' : 'Disponible'}</dd>
              </dl>
            </div>
            <div className="detail-section">
              <h4>Intégrité</h4>
              <dl className="details-list">
                <dt>Hash (SHA-256):</dt><dd className="hash-text">{file.hash}</dd>
                <dt>Signature:</dt><dd className="hash-text">{file.signature}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
