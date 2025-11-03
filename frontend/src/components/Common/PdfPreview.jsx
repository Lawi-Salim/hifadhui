import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';
import { buildCloudinaryUrl } from '../../config/cloudinary';
import './PdfPreview.css';

const PdfPreview = ({ fileUrl, fileId, className, fullPage = false }) => {
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
    <div className={`pdf-preview-wrapper ${className || ''}`}>
      <Document
        file={fullFileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="pdf-loading">Chargement...</div>}
        error={<div className="pdf-error">Aperçu indisponible</div>}
        options={pdfOptions}
      >
        {/* On affiche seulement la première page avec meilleure résolution */}
        <Page 
          pageNumber={1} 
          width={fullPage ? 350 : 240} // Largeur : 350px pour fullPage (400px - 48px padding), 240px pour miniature
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
        />
      </Document>
    </div>
  );
};

export default PdfPreview;
