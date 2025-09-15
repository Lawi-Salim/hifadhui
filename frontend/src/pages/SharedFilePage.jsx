import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiUser, FiEye, FiShield, FiAlertCircle } from 'react-icons/fi';
import { FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa';
import PdfPreview from '../components/Common/PdfPreview';
import axios from 'axios';
import './SharedFilePage.css';

const SharedFilePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        // Vérifier si cette session globale a déjà été comptée (tous onglets confondus)
        const globalSessionKey = `share_viewed_${token}`;
        const alreadyViewed = localStorage.getItem(globalSessionKey);
        
        console.log('🔍 [DEBUG Frontend] Token:', token, 'Already viewed:', alreadyViewed);
        
        // Créer une instance axios sans intercepteurs pour les partages publics
        const isProd = process.env.NODE_ENV === 'production';
        const API_BASE_URL = process.env.REACT_APP_API_URL || (isProd ? '/api/v1' : 'http://localhost:5000/api/v1');
        
        const response = await axios.get(`${API_BASE_URL}/share/${token}`, {
          headers: {
            'X-Already-Viewed': alreadyViewed ? 'true' : 'false'
          }
        });
        
        // Marquer comme vu pour cette session globale
        if (!alreadyViewed) {
          console.log('🔍 [DEBUG Frontend] Marquage comme vu pour token:', token);
          localStorage.setItem(globalSessionKey, 'true');
          localStorage.setItem(`${globalSessionKey}_timestamp`, Date.now().toString());
        }
        
        console.log('Données reçues:', response.data); // Debug
        console.log('Structure des données:', {
          hasFile: !!response.data?.file,
          hasShare: !!response.data?.share,
          fileKeys: response.data?.file ? Object.keys(response.data.file) : [],
          shareKeys: response.data?.share ? Object.keys(response.data.share) : []
        });
        console.log('URL du fichier:', response.data?.file?.file_url); // Debug URL
        setFileData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors du chargement du fichier');
      } finally {
        setLoading(false);
      }
    };

    if (token && !hasFetched.current) {
      hasFetched.current = true;
      fetchSharedFile();
    }

    // Gestion de la session globale - nettoyer quand tous les onglets sont fermés
    const handleBeforeUnload = () => {
      // Vérifier s'il y a d'autres onglets ouverts avec ce lien
      const globalSessionKey = `share_viewed_${token}`;
      const tabId = `tab_${Date.now()}_${Math.random()}`;
      
      // Enregistrer cet onglet
      sessionStorage.setItem('currentTabId', tabId);
      
      // Nettoyer la session globale seulement si c'est le dernier onglet
      setTimeout(() => {
        // Si aucun autre onglet n'a réinitialisé ce flag, on nettoie
        const stillActive = sessionStorage.getItem('tabsActive');
        if (!stillActive) {
          localStorage.removeItem(globalSessionKey);
          localStorage.removeItem(`${globalSessionKey}_timestamp`);
        }
      }, 1000);
    };

    // Marquer cet onglet comme actif
    sessionStorage.setItem('tabsActive', 'true');
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Nettoyer le flag d'activité de cet onglet
      sessionStorage.removeItem('tabsActive');
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

    // Construire l'URL complète pour Cloudinary
    const getFullImageUrl = (fileUrl) => {
      console.log('🔍 getFullImageUrl appelée avec:', fileUrl);
      
      if (!fileUrl) return null;
      
      // Si c'est déjà une URL complète, l'utiliser directement
      if (fileUrl.startsWith('http')) {
        return fileUrl;
      }
      
      // Si c'est un chemin Cloudinary (avec ou sans version)
      if (fileUrl.startsWith('Hifadhwi/') || /^v\d+\/Hifadhwi\//.test(fileUrl)) {
        // Garder l'encodage pour l'URL Cloudinary (ne pas décoder)
        return `https://res.cloudinary.com/ddxypgvuh/image/upload/${fileUrl}`;
      }
      
      // Pour les chemins locaux, utiliser l'API backend
      return `${process.env.REACT_APP_API_BASE_URL}/files/${file.id}/download`;
    };

    if (file.mimetype?.startsWith('image/')) {
      const imageUrl = getFullImageUrl(file.file_url);
      console.log('URL image construite:', imageUrl); // Debug
      
      return (
        <div className="shared-file-preview">
          <div className="image-preview-container">
            <img 
              src={imageUrl}
              alt={file.filename}
              className="shared-image"
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                console.error('❌ Erreur chargement image:', imageUrl);
                console.log('Tentative avec URL API backend...');
                e.target.src = `${process.env.REACT_APP_API_BASE_URL}/files/${file.id}/download`;
              }}
            />
            <div className="watermark-overlay">
              <span className="watermark-text">© {file.owner} - Hifadhwi</span>
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
              <span className="watermark-text">© {file.owner} - Hifadhwi</span>
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

  if (!fileData || !fileData.file || !fileData.share) {
    return (
      <div className="shared-file-page">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Chargement des données...</p>
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
              <h1>Fichier partagé</h1>
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
                <span title={file.filename}>
                  {file.filename && file.filename.length > 40 
                    ? file.filename.substring(0, 37) + '...' 
                    : file.filename}
                </span>
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
