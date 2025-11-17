import React from 'react';
import { FaDownload } from 'react-icons/fa';
import downloadService from '../../services/downloadService';

/**
 * Composant d'aperçu avec filigrane Product ID (overlay CSS, pas de modification de l'image)
 * Le dessin "dur" dans l'image est géré côté téléchargement via downloadService.
 */
const ImageWithWatermark = ({ imageUrl, productId, alt, className, onContextMenu, file }) => {
  if (!imageUrl) return null;

  // Afficher uniquement le numéro séquentiel + partie aléatoire (ex: 000005-271684)
  const displayProductId = productId && productId.includes('-')
    ? productId.split('-').slice(-2).join('-')
    : productId;

  const handleDownload = async (withWatermark) => {
    if (!file) return;

    try {
      await downloadService.downloadSingleFile(file, { withWatermark });
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier avec downloadService:', error);
    }
  };

  return (
    <div>
      <div className="modal-image-preview-wrapper">
        <img
          src={imageUrl}
          alt={alt}
          className={className}
          onContextMenu={onContextMenu}
        />

        {displayProductId && (
          <div className="watermark-overlay">
            <span className="watermark-text">
              {displayProductId}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => handleDownload(true)}
          className="btn-download-with-watermark"
        >
          <FaDownload style={{ marginRight: '0.25rem' }} /> Avec filigrane
        </button>
        <button
          type="button"
          onClick={() => handleDownload(false)}
          className="btn-download-without-watermark"
        >
          <FaDownload style={{ marginRight: '0.25rem' }} /> Sans filigrane
        </button>
      </div>
    </div>
  );
};

export default ImageWithWatermark;
