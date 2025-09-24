import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';
import { buildCloudinaryUrl } from '../../config/cloudinary';
// import './PdfPreview.css'; // Fichier CSS manquant

const PdfPreview = ({ fileUrl, fileId, className }) => {
  const [, setNumPages] = useState(null);

  // Tous les hooks doivent être appelés avant les returns conditionnels
  const fullFileUrl = useMemo(() => {
    const getPdfUrl = (fileUrl) => {
      if (!fileUrl) return '';
      
      console.log('PdfPreview - fileUrl original:', fileUrl);
      
      const pdfUrl = buildCloudinaryUrl(fileUrl, 'raw');
      console.log('PdfPreview - URL finale:', pdfUrl);
      
      return pdfUrl;
    };

    return getPdfUrl(fileUrl);
  }, [fileUrl]);

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@5.3.93/cmaps/`,
    cMapPacked: true,
  }), []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Si l'URL n'est pas valide, ne rien afficher pour éviter les erreurs react-pdf
  if (!fullFileUrl) {
    return null;
  }

  return (
    <div className={`pdf-preview-container ${className || ''}`} style={{ width: '100%', height: '100%' }}>
      <Document
        file={fullFileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="pdf-loading">Chargement...</div>}
        error={<div className="pdf-error">Aperçu indisponible</div>}
        options={pdfOptions}
      >
        {/* On affiche seulement la première page */}
        <Page 
          pageNumber={1} 
          scale={1.2}
          width={200} // Largeur adaptée au container
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
        />
      </Document>
    </div>
  );
};

export default PdfPreview;
