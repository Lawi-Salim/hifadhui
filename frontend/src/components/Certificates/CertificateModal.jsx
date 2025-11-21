import React, { useState, useEffect } from 'react';
import { FaCertificate, FaTimes, FaDownload, FaSpinner, FaCopy, FaCheck } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import certificateService from '../../services/certificateService';
import './Certificate.css';
import { formatFileSize } from '../../utils/fileSize';

/**
 * Modal d'aperçu du certificat d'authenticité
 */
const CertificateModal = ({ file, isOpen, onClose }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      loadMetadata();
    }
  }, [isOpen, file]);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getCertificatePreview(file.id);
      setMetadata(data);
    } catch (err) {
      console.error('Erreur chargement métadonnées:', err);
      setError('Impossible de charger les informations du certificat');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await certificateService.downloadAndSaveCertificate(file.id, file.filename);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setError('Erreur lors du téléchargement du certificat');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyHash = () => {
    if (metadata?.file?.hash) {
      navigator.clipboard.writeText(metadata.file.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyVerifyLink = () => {
    if (metadata?.verification?.url) {
      navigator.clipboard.writeText(metadata.verification.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy à HH:mm:ss', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="certificate-modal-overlay" onClick={onClose}>
      <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="certificate-modal-header">
          <div className="certificate-modal-title">
            <FaCertificate />
            Certificat d'Authenticité
          </div>
          <button className="certificate-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="certificate-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FaSpinner className="spinning" style={{ fontSize: '32px', color: '#0284c7' }} />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Chargement des informations...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              {error}
            </div>
          ) : metadata ? (
            <>
              {/* Informations du fichier */}
              <div className="certificate-info-section">
                <h3 className="certificate-section-title">Informations du fichier</h3>
                <table className="certificate-table">
                  <tbody>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">Nom du fichier</td>
                      <td className="certificate-table-value">{metadata.file.name}</td>
                    </tr>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">Type</td>
                      <td className="certificate-table-value">{metadata.file.mimetype || 'Non spécifié'}</td>
                    </tr>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">Taille</td>
                      <td className="certificate-table-value">{formatFileSize(metadata.file.size)}</td>
                    </tr>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">Date de dépôt</td>
                      <td className="certificate-table-value">{formatDate(metadata.file.uploadDate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empreinte cryptographique */}
              <div className="certificate-info-section">
                <h3 className="certificate-section-title">Empreinte cryptographique</h3>
                <table className="certificate-table">
                  <tbody>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">
                        Hash SHA-256
                        <button
                          onClick={handleCopyHash}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color, #2563eb)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '8px'
                          }}
                        >
                          {copied ? <><FaCheck /> Copié</> : <><FaCopy /> Copier</>}
                        </button>
                      </td>
                      <td className="certificate-table-value mono">{metadata.file.hash}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Propriétaire */}
              <div className="certificate-info-section">
                <h3 className="certificate-section-title">Propriétaire</h3>
                <table className="certificate-table">
                  <tbody>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">Nom</td>
                      <td className="certificate-table-value">{metadata.owner.name}</td>
                    </tr>
                    <tr className="certificate-table-row">
                      <td className="certificate-table-label">Email</td>
                      <td className="certificate-table-value">{metadata.owner.email}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Vérification */}
              <div className="certificate-info-section">
                <h3 className="certificate-section-title">Vérification de l'authenticité</h3>
                <div className="certificate-qr-container">
                  <img 
                    src={metadata.verification.qrCode} 
                    alt="QR Code de vérification" 
                    className="certificate-qr-code"
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Scannez le QR code ou visitez :
                  </p>
                  <a 
                    href={metadata.verification.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="certificate-verify-link"
                  >
                    {metadata.verification.url}
                  </a>
                  <button
                    onClick={handleCopyVerifyLink}
                    style={{
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copied ? <><FaCheck /> Lien copié</> : <><FaCopy /> Copier le lien</>}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="certificate-modal-footer">
          <button 
            className="certificate-modal-btn certificate-modal-btn-secondary"
            onClick={onClose}
          >
            Fermer
          </button>
          <button 
            className="certificate-modal-btn certificate-modal-btn-primary"
            onClick={handleDownload}
            disabled={downloading || loading}
          >
            {downloading ? (
              <>
                <FaSpinner className="spinning" /> Téléchargement...
              </>
            ) : (
              <>
                <FaDownload /> Télécharger le PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
