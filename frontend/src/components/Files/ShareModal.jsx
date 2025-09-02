import React, { useState } from 'react';
import { FiShare2, FiCopy, FiCheck, FiClock, FiEye } from 'react-icons/fi';
import Modal from '../Modal';
import api from '../../services/api';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, file }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);

  const handleCreateShare = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post(`/files/${file.id}/share`);
      setShareUrl(response.data.shareUrl);
      setExpiresAt(response.data.expiresAt);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du lien');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas l'API clipboard
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatExpirationDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClose = () => {
    setShareUrl('');
    setExpiresAt(null);
    setError('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="share-modal">
      <div className="share-modal-content">
        {!shareUrl ? (
          <div className="share-create-section">
            <div className="share-info">
              <FiShare2 size={48} className="share-icon" />
              <h3>Créer un lien de partage</h3>
            </div>

            <div className="file-info">
              <h4>Fichier à partager :</h4>
              <div className="file-details">
                <span className="file-name">{file?.filename}</span>
                <span className="file-type">{file?.mimetype}</span>
              </div>
            </div>

            <div className="share-features">
              <div className="feature-item">
                <FiEye className="feature-icon" />
                <span>Aperçu uniquement (pas de téléchargement)</span>
              </div>
              <div className="feature-item">
                <FiClock className="feature-icon" />
                <span>Expire automatiquement dans 24h</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button onClick={handleClose} className="btn btn-secondary">
                Annuler
              </button>
              <button 
                onClick={handleCreateShare} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le lien'}
              </button>
            </div>
          </div>
        ) : (
          <div className="share-success-section">
            <div className="share-success-info">
              <FiCheck size={48} className="success-icon" />
              <h3>Lien de partage créé !</h3>
              <p>Votre lien de partage est prêt. Copiez-le pour le partager.</p>
            </div>

            <div className="share-link-container">
              <label htmlFor="shareUrl">Lien de partage :</label>
              <div className="share-link-input">
                <input
                  id="shareUrl"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="form-control"
                />
                <button 
                  onClick={handleCopyLink}
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  title={copied ? 'Copié !' : 'Copier le lien'}
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>

            {expiresAt && (
              <div className="expiration-info">
                <FiClock className="clock-icon" />
                <span>Expire le {formatExpirationDate(expiresAt)}</span>
              </div>
            )}

            <div className="share-warning">
              <p>
                ⚠️ Ce lien permet de consulter votre fichier avec filigrane.
                Aucun téléchargement n'est possible.
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={handleClose} className="btn btn-primary">
                Terminé
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
