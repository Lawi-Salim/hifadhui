import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { FaCopy, FaCheck, FaDownload } from 'react-icons/fa';
import './QRCodeDisplay.css';

/**
 * Composant unifié pour l'affichage et la gestion des QR codes
 * Utilisé dans : CertificateModal, GenerateEmpreintes, etc.
 * 
 * @param {string} data - Données à encoder dans le QR code (URL, texte, etc.)
 * @param {number} size - Taille du QR code en pixels (défaut: 200)
 * @param {boolean} showCopyButton - Afficher le bouton copier (défaut: true)
 * @param {boolean} showDownloadButton - Afficher le bouton télécharger (défaut: false)
 * @param {string} downloadFilename - Nom du fichier pour le téléchargement (défaut: 'qrcode.png')
 * @param {string} className - Classes CSS additionnelles
 */
const QRCodeDisplay = ({ 
  data, 
  size = 200, 
  showCopyButton = true,
  showDownloadButton = false,
  downloadFilename = 'qrcode.png',
  className = '' 
}) => {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!data) {
      setError('Aucune donnée à encoder');
      return;
    }

    generateQRCode();
  }, [data, size]);

  const generateQRCode = async () => {
    try {
      setError(null);
      
      // Générer le QR code sur le canvas
      await QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // Haute correction d'erreur
      });

      // Générer aussi en Data URL pour la copie et le téléchargement
      const dataUrl = await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Erreur génération QR code:', err);
      setError('Erreur lors de la génération du QR code');
    }
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;

    try {
      // Convertir Data URL en Blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      
      // Copier dans le presse-papiers
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie QR code:', err);
      alert('❌ Erreur lors de la copie du QR code');
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className={`qrcode-display-error ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`qrcode-display-container ${className}`}>
      <div className="qrcode-display-canvas-wrapper">
        <canvas ref={canvasRef} className="qrcode-display-canvas" />
      </div>
      
      {(showCopyButton || showDownloadButton) && (
        <div className="qrcode-display-actions">
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="qrcode-display-btn qrcode-display-btn-copy"
              disabled={!qrDataUrl}
            >
              {copied ? (
                <>
                  <FaCheck /> Copié
                </>
              ) : (
                <>
                  <FaCopy /> Copier QR Code
                </>
              )}
            </button>
          )}
          
          {showDownloadButton && (
            <button
              onClick={handleDownload}
              className="qrcode-display-btn qrcode-display-btn-download"
              disabled={!qrDataUrl}
            >
              <FaDownload /> Télécharger
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
