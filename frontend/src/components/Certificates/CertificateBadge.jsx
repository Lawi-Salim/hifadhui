import React, { useState } from 'react';
import { FaCertificate, FaDownload, FaEye, FaSpinner } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import certificateService from '../../services/certificateService';
import './Certificate.css';

/**
 * Badge de certification affiché sur chaque fichier
 */
const CertificateBadge = ({ file, onPreview }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadCertificate = async (e) => {
    e.stopPropagation(); // Empêcher la propagation du clic
    
    try {
      setDownloading(true);
      setError(null);
      
      await certificateService.downloadAndSaveCertificate(file.id, file.filename);
      
      // Notification de succès (optionnel)
      console.log('✅ Certificat téléchargé avec succès');
      
    } catch (err) {
      console.error('❌ Erreur téléchargement certificat:', err);
      setError('Erreur lors du téléchargement du certificat');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(file);
    }
  };

  const formatUploadDate = (date) => {
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  return (
    <div className="certificate-badge">
      <div className="certificate-badge-header">
        <FaCertificate className="certificate-icon" />
        <span className="certificate-text">
          Certifié depuis le {formatUploadDate(file.date_upload)}
        </span>
      </div>

      <div className="certificate-actions">
        {onPreview && (
          <button
            className="certificate-btn certificate-btn-preview"
            onClick={handlePreview}
            title="Aperçu du certificat"
          >
            <FaEye /> Aperçu
          </button>
        )}

        <button
          className="certificate-btn certificate-btn-download"
          onClick={handleDownloadCertificate}
          disabled={downloading}
          title="Télécharger le certificat PDF"
        >
          {downloading ? (
            <>
              <FaSpinner className="spinning" /> Téléchargement...
            </>
          ) : (
            <>
              <FaDownload /> Certificat PDF
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="certificate-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default CertificateBadge;
