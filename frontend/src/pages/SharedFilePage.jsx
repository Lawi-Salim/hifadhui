import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiUser, FiEye, FiShield, FiAlertCircle } from 'react-icons/fi';
import { FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa';
import PdfPreview from '../components/Common/PdfPreview';
import api from '../services/api';
import './SharedFilePage.css';

const SharedFilePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        const response = await api.get(`/share/${token}`);
        console.log('Données reçues:', response.data); // Debug
        setFileData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors du chargement du fichier');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedFile();
    }

    // Logique d'expiration à la fermeture de la page
    const handleBeforeUnload = () => {
      // Le lien expire quand l'utilisateur ferme la page
      localStorage.setItem(`share_expired_${token}`, 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (filename, mimetype) => {
    if (!filename) return <FaFileAlt className="file-icon" />;
    
    if (mimetype?.startsWith('image/')) {
      return <FaFileImage className="file-icon image-icon" />;
    }
    
    if (filename.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf className="file-icon pdf-icon" />;
    }
    
    return <FaFileAlt className="file-icon" />;
  };

  const renderFilePreview = (file) => {
    console.log('Rendu aperçu pour:', file.filename, 'URL:', file.file_url); // Debug
    
    if (!file.file_url) {
      return (
        <div className="shared-file-preview no-preview">
          <div className="file-icon-large">
            {getFileIcon(file.filename, file.mimetype)}
          </div>
          <p>Aperçu non disponible</p>
        </div>
      );
    }

    if (file.mimetype?.startsWith('image/')) {
      return (
        <div className="shared-file-preview">
          <div className="image-preview-container">
            <img 
              src={file.file_url}
              alt={file.filename}
              className="shared-image"
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="watermark-overlay">
              <span className="watermark-text">{file.owner}</span>
            </div>
          </div>
        </div>
      );
    } else if (file.filename?.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="shared-file-preview">
          <div className="pdf-preview-container">
            <PdfPreview 
              fileUrl={file.file_url} 
              fileId={file.id}
              className="shared-pdf-preview"
            />
            <div className="watermark-overlay">
              <span className="watermark-text">{file.owner}</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="shared-file-preview no-preview">
          <div className="file-icon-large">
            {getFileIcon(file.filename, file.mimetype)}
          </div>
          <p>Aperçu non disponible pour ce type de fichier</p>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="shared-file-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du fichier partagé...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-file-page">
        <div className="error-container">
          <FiAlertCircle size={48} className="error-icon" />
          <h2>Lien invalide ou expiré</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const { file, share } = fileData;

  return (
    <div className="shared-file-page">
      <div className="shared-file-container">
        <div className="shared-file-header">
          <div className="header-info">
            <FiShield className="shield-icon" />
            <div>
              <h1>Fichier partagé de manière sécurisée</h1>
              <p>Ce fichier vous est partagé pour prouver sa propriété</p>
            </div>
          </div>
          
          <div className="share-metadata">
            <div className="metadata-item">
              <FiUser className="metadata-icon" />
              <span>Partagé par <strong>{share.shared_by}</strong></span>
            </div>
            <div className="metadata-item">
              <FiClock className="metadata-icon" />
              <span>Expire le {formatDate(share.expires_at)}</span>
            </div>
            <div className="metadata-item">
              <FiEye className="metadata-icon" />
              <span>{share.access_count} consultation{share.access_count > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="shared-content">
          <div className="file-preview-section">
            <h3>Aperçu du fichier</h3>
            {renderFilePreview(file)}
          </div>

          <div className="file-details-section">
            <h3>Détails du fichier</h3>
            <div className="file-details-grid">
              <div className="detail-item">
                <label>Nom du fichier :</label>
                <span>{file.filename}</span>
              </div>
              
              <div className="detail-item">
                <label>Type :</label>
                <span>{file.mimetype}</span>
              </div>
              
              <div className="detail-item">
                <label>Propriétaire :</label>
                <span><strong>{file.owner}</strong></span>
              </div>
              
              <div className="detail-item">
                <label>Date d'upload :</label>
                <span>{formatDate(file.date_upload)}</span>
              </div>
              
              <div className="detail-item">
                <label>Version :</label>
                <span>v{file.version}</span>
              </div>
              
              <div className="detail-item">
                <label>Hash SHA-256 :</label>
                <span className="hash-value" title={file.hash}>
                  {file.hash?.substring(0, 16)}...
                </span>
              </div>
              
              <div className="detail-item">
                <label>Signature :</label>
                <span className="signature-value" title={file.signature}>
                  {file.signature?.substring(0, 16)}...
                </span>
              </div>
            </div>

            {file.certificates && file.certificates.length > 0 && (
              <div className="certificates-section">
                <h4>Certificats de propriété</h4>
                <div className="certificates-list">
                  {file.certificates.map((cert, index) => (
                    <div key={cert.id} className="certificate-item">
                      <FaFilePdf className="cert-icon" />
                      <div className="cert-info">
                        <span>Certificat #{index + 1}</span>
                        <small>Généré le {formatDate(cert.date_generated)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="security-notice">
          <FiShield className="notice-icon" />
          <div className="notice-content">
            <h4>Notice de sécurité</h4>
            <ul>
              <li>Ce fichier est partagé uniquement pour consultation</li>
              <li>Le téléchargement n'est pas autorisé</li>
              <li>Le filigrane indique le propriétaire légitime</li>
              <li>Ce lien expire automatiquement dans 24h ou à la fermeture de cette page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedFilePage;
