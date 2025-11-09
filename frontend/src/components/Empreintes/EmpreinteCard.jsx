import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
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
      // Créer un canvas temporaire pour la carte complète
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');

      // Dimensions compactes (QR code + Product ID côte à côte)
      const width = 410;
      const height = 170;
      tempCanvas.width = width;
      tempCanvas.height = height;

      // Fond dégradé bleu-gris (inspiré de l'image 3)
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#5a6c7d');
      gradient.addColorStop(0.5, '#4a5c6d');
      gradient.addColorStop(1, '#3a4c5d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Motif décoratif subtil (cercles en bas à droite)
      // Correspondant au CSS ajusté par l'utilisateur
      
      // Petit cercle ::before
      // CSS: bottom: -10px, right: -50px, width: 130px (rayon: 65px)
      const smallCircleX = width + 50;  // right: -50px
      const smallCircleY = height + 10; // bottom: -10px
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(smallCircleX, smallCircleY, 65, 0, Math.PI * 2);
      ctx.stroke();

      // Grand cercle ::after
      // CSS: bottom: -50px, right: -35px, width: 200px (rayon: 100px)
      const largeCircleX = width + 35;  // right: -35px
      const largeCircleY = height + 50; // bottom: -50px
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 35;
      ctx.beginPath();
      ctx.arc(largeCircleX, largeCircleY, 100, 0, Math.PI * 2);
      ctx.stroke();

      // QR Code à gauche (padding 15px comme dans le CSS)
      const qrCanvas = canvasRef.current;
      const qrSize = 140;
      const qrX = 15;
      const qrY = (height - qrSize) / 2;

      // Dessiner le QR code directement sur le fond (sans fond blanc)
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // Product ID à droite (gap de 20px comme dans le CSS)
      const textX = qrX + qrSize + 20;
      const textY = height / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('PRODUCT ID', textX, textY - 20);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(empreinte.product_id, textX, textY + 10);

      // Télécharger l'image
      const link = document.createElement('a');
      link.download = `hifadhui-${empreinte.product_id}.png`;
      link.href = tempCanvas.toDataURL('image/png');
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
