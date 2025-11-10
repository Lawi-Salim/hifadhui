import React, { useState, useEffect } from 'react';
import { FiShare2, FiCopy, FiCheck, FiClock } from 'react-icons/fi';
import Modal from '../Modal';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, file }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Générer le lien de partage avec le hash d'empreinte
  useEffect(() => {
    if (file && file.empreinte && file.empreinte.hash_pregenere) {
      const url = `${window.location.origin}/share/${file.empreinte.hash_pregenere}`;
      setShareUrl(url);
    }
  }, [file]);

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
      year: 'numeric'
    });
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="share-modal">
      <div className="share-modal-content">
        <div className="share-success-section">
          <div className="share-success-info">
            <FiShare2 size={48} className="success-icon" />
            <h3>Lien de partage</h3>
            <p>Copiez ce lien pour partager votre fichier.</p>
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

          {file?.empreinte?.expires_at && (
            <div className="expiration-info">
              <FiClock className="clock-icon" />
              <span>Expire le {formatExpirationDate(file.empreinte.expires_at)}</span>
            </div>
          )}

          <div className="share-warning">
            <p>
              ⚠️ Ce lien permet de consulter votre fichier avec filigrane.
              Aucun téléchargement n'est possible.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
