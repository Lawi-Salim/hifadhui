import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { FaDownload } from 'react-icons/fa';
import './EmpreinteCard.css';

/**
 * Composant de carte d'identité pour empreinte
 * Génère une carte téléchargeable avec QR code et product ID
 * Style inspiré des ISBN de livres
 */
const EmpreinteCard = ({ empreinte, onDownload }) => {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (empreinte?.qr_code_data) {
      generateQRCode();
    }
  }, [empreinte]);

  const generateQRCode = async () => {
    try {
      await QRCode.toCanvas(canvasRef.current, empreinte.qr_code_data, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // Capturer l'élément HTML avec son CSS en utilisant html2canvas
      const cardElement = cardRef.current;
      
      if (!cardElement) {
        throw new Error('Élément de carte introuvable');
      }

      // Générer le canvas à partir de l'élément HTML
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2, // Qualité HD (2x la résolution)
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Télécharger l'image
      const link = document.createElement('a');
      link.download = `hifadhui-${empreinte.product_id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Erreur téléchargement carte:', error);
      alert('❌ Erreur lors du téléchargement de la carte');
    }
  };

  if (!empreinte) {
    return null;
  }

  return (
    <div className="empreinte-card-container">
      <div className="empreinte-card-preview" ref={cardRef}>
        <div className="card-content-horizontal">
          <div className="card-qr-section">
            <canvas ref={canvasRef} className="card-qr-canvas" />
          </div>
          
          <div className="card-product-section">
            <span className="product-id-label">PRODUCT-ID</span>
            <span className="product-id-value">{empreinte.product_id}</span>
          </div>
        </div>
      </div>

      <button 
        className="download-card-btn"
        onClick={handleDownload}
        title="Télécharger la carte en PNG"
      >
        <FaDownload /> Télécharger la carte (PNG)
      </button>

      <div className="card-usage-info">
        <div className="info-content">
          <strong>Comment utiliser cette carte ?</strong>
          <p>
            Téléchargez cette carte et imprimez-la pour la coller à l'arrière de votre livre 
            ou produit. Elle servira d'identifiant unique permettant de 
            vérifier l'authenticité de votre œuvre.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmpreinteCard;
