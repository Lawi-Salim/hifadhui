import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaEye, FaFilePdf, FaImage, FaFileAlt } from 'react-icons/fa';
import { FiAlertCircle, FiShield, FiUser, FiClock, FiEye } from 'react-icons/fi';
import PdfPreview from '../components/Common/PdfPreview';
import DynamicMeta from '../components/Common/DynamicMeta';
import { buildCloudinaryUrl } from '../config/cloudinary';
import api from '../services/api';
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
        
        const response = await api.get(`/share/${token}`, {
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
      return <FaImage className="file-icon image-icon" />;
    }
    
    if (filename.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf className="file-icon pdf-icon" />;
    }
    
    return <FaFileAlt className="file-icon" />;
  };

  // Fonction pour générer les métadonnées du fichier partagé
  const getFileMetadata = (file, share) => {
    if (!file || !share) return {};

    const isImage = file.mimetype?.startsWith('image/');
    const isPdf = file.filename?.toLowerCase().endsWith('.pdf');
    
    // Déterminer le type de fichier pour la description
    let fileType = 'fichier';
    let fileIcon = '📄';
    
    if (isImage) {
      fileType = 'image';
      fileIcon = '🖼️';
    } else if (isPdf) {
      fileType = 'document PDF';
      fileIcon = '📄';
    }

    // Construire le titre et la description
    const title = `${fileIcon} ${file.filename} - Partagé par ${share.shared_by}`;
    const description = `${fileType} partagé via Hifadhui par ${share.shared_by}. Fichier sécurisé avec preuve de propriété.`;
    
    // URL de l'image à afficher (favicon par défaut, ou image du fichier si c'est une image)
    let imageUrl = `${window.location.origin}/favicon.png`;
    
    // Si c'est une image, on peut utiliser l'image elle-même (optionnel)
    if (isImage && file.file_url) {
      try {
        imageUrl = getCloudinaryUrl(file.file_url, true);
      } catch (e) {
        // Fallback au favicon si erreur
        imageUrl = `${window.location.origin}/favicon.png`;
      }
    }

    return {
      title,
      description,
      image: imageUrl,
      url: window.location.href,
      author: share.shared_by,
      filename: file.filename
    };
  };

  const getCloudinaryUrl = (fileUrl, isImage = true) => {
    if (!fileUrl) return null;
    
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    // Décoder l'URL pour éviter le double encodage
    let cleanUrl = fileUrl;
    try {
      cleanUrl = decodeURIComponent(fileUrl);
    } catch (e) {
      // Si le décodage échoue, utiliser l'URL originale
      cleanUrl = fileUrl;
    }
    
    // Construire l'URL Cloudinary selon le type de fichier
    // Utiliser le cloud name depuis les variables d'environnement ou fallback
    const resourceType = isImage ? 'image' : 'raw';
    return buildCloudinaryUrl(cleanUrl, resourceType);
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
      const imageUrl = getCloudinaryUrl(file.file_url, true);
      console.log('URL image construite:', imageUrl); // Debug
      
      return (
        <div className="shared-file-preview">
          <div className="image-preview-container">
            <img 
              src={imageUrl}
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
      const pdfUrl = getCloudinaryUrl(file.file_url, false);
      console.log('URL PDF construite:', pdfUrl); // Debug
      
      return (
        <div className="shared-file-preview">
          <div className="pdf-preview-container">
            <PdfPreview 
              fileUrl={pdfUrl} 
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
  const metadata = getFileMetadata(file, share);

  return (
    <div className="shared-file-page">
      {/* Métadonnées dynamiques pour le partage social */}
      <DynamicMeta 
        title={metadata.title}
        description={metadata.description}
        image={metadata.image}
        url={metadata.url}
        author={metadata.author}
        filename={metadata.filename}
      />
      
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
