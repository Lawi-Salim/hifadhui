import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaEye, FaCalendar, FaFileAlt, FaImage, FaFilePdf } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import PdfPreview from './PdfPreview';
import ImageWithWatermark from './ImageWithWatermark';
import { buildCloudinaryUrl } from '../../config/cloudinary';
// import './FileDetailModal.css'; // Fichier CSS manquant
import '../Images/Images.css';
import fileService from '../../services/fileService';
import { formatFileSize } from '../../utils/fileSize';

const FileDetailModal = ({ file, onClose, type = 'file', isOpen }) => {
  const { user } = useAuth();
  const [displayData, setDisplayData] = useState(file || null);

  useEffect(() => {
    setDisplayData(file || null);
  }, [file]);

  useEffect(() => {
    const shouldFetchFullDetails = () => {
      if (!isOpen || !file || !file.id) return false;
      const hasProductId = !!(file.empreinte && file.empreinte.product_id);
      const hasSize = !!file.size;
      const hasHash = !!file.hash;
      const hasSignature = !!file.signature;
      return !(hasProductId && hasSize && hasHash && hasSignature);
    };

    if (!shouldFetchFullDetails()) return;

    let cancelled = false;

    const fetchDetails = async () => {
      try {
        const response = await fileService.getFileById(file.id);
        const full = response?.data?.file || response?.data || null;
        if (!cancelled && full) {
          setDisplayData(full);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du fichier :', error);
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [file, isOpen]);

  if (!isOpen) return null;

  if (!displayData) return null;

  const isImage = displayData.mimetype && displayData.mimetype.startsWith('image/');
  const isPdf = displayData.mimetype === 'application/pdf';

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

  const title = isImage ? 'Détails de l\'image' : 'Détails du PDF';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <div className="modal-content-grid">
          <div className="modal-image-container">
            {isImage ? (
              <>
                <ImageWithWatermark
                  imageUrl={getImageUrl(displayData.file_url)}
                  productId={displayData.empreinte?.product_id}
                  alt={displayData.filename}
                  className="modal-image-preview"
                  onContextMenu={(e) => e.preventDefault()}
                  file={displayData}
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
                <dt>Nom:</dt><dd title={displayData.filename}>{displayData.filename}</dd>
                <dt>Type:</dt><dd>{displayData.mimetype}</dd>
                <dt>Product ID:</dt><dd>{displayData.empreinte?.product_id}</dd>
                <dt>Date d'upload:</dt><dd>{formatDate(displayData.date_upload)}</dd>
                <dt>Taille:</dt><dd>{displayData.size ? formatFileSize(displayData.size) : 'Non disponible'}</dd>
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
