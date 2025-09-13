import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PdfPreview from './PdfPreview';
import '../Modal.css';
import '../Images/Images.css';

const FileDetailModal = ({ file, onClose, type = 'file', isOpen }) => {
  const { user } = useAuth();
  
  if (!isOpen) return null;

  if (!file) return null;

  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';
  const isCertificate = type === 'certificate';

  // Fonction pour construire l'URL complète des images
  const getImageUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    
    // Format standardisé avec Hifadhwi/ uniquement
    if (fileUrl.startsWith('Hifadhwi/') || /^v\d+\/Hifadhwi\//.test(fileUrl)) {
      // Déterminer le cloud name selon l'environnement
      const cloudName = process.env.NODE_ENV === 'production' ? 'ddxypgvuh' : 'drpbnhwh6';
      return `https://res.cloudinary.com/${cloudName}/image/upload/${fileUrl}`;
    } else {
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

  const truncateFilename = (filename, maxLength = 15) => {
    if (!filename) return '';
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength) + '...';
  };

  // Déterminer les données à afficher selon le type
  const getDisplayData = () => {
    if (isCertificate && file.certificateFile) {
      return {
        filename: file.certificateFile.filename,
        version: file.certificateFile.version,
        date_upload: file.certificateFile.date_upload,
        hash: file.certificateFile.hash,
        signature: file.certificateFile.signature,
        file_url: file.pdf_url, // Pour les certificats, utiliser pdf_url
        mimetype: 'application/pdf'
      };
    }
    return file;
  };

  const displayData = getDisplayData();

  const title = isCertificate ? 'Détails du certificat' : isImage ? 'Détails de l\'image' : 'Détails du fichier';

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
                <div className="watermark">
                  {user.username}
                </div>
              </>
            ) : isPdf ? (
              <div style={{ width: '300px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <PdfPreview fileUrl={displayData.file_url} fileId={file.id} />
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
              <h4>{title}</h4>
              <dl className="details-list">
                <dt>Nom:</dt><dd title={displayData.filename}>{truncateFilename(displayData.filename)}</dd>
                <dt>Type:</dt><dd>{displayData.mimetype}</dd>
                <dt>Version:</dt><dd>{displayData.version || 1}</dd>
                <dt>Date d'upload:</dt><dd>{formatDate(displayData.date_upload)}</dd>
                <dt>Taille:</dt><dd>{displayData.size ? `${(displayData.size / 1024).toFixed(2)} KB` : 'Non disponible'}</dd>
                <dt>Emplacement:</dt><dd>{displayData.dossier?.fullPath || displayData.dossier?.name_original || displayData.dossier?.name || 'Racine'}</dd>
                <dt>Certificat:</dt><dd>{isCertificate ? 'Disponible' : (file.fileCertificates?.length > 0 ? 'Disponible' : 'En attente')}</dd>
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
