import React, { useState, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const PdfPreview = ({ fileUrl, fileId, className }) => {
  const [numPages, setNumPages] = useState(null);

  // Tous les hooks doivent être appelés avant les returns conditionnels
  const fullFileUrl = useMemo(() => {
    // Vérifier que fileUrl est valide
    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
      return null;
    }
    
    if (fileUrl.startsWith('http')) {
      // URL complète déjà fournie (anciens fichiers)
      return fileUrl.endsWith('.pdf.pdf') ? fileUrl.replace('.pdf.pdf', '.pdf') : fileUrl;
    } else if (fileUrl.startsWith('hifadhwi/') || /^v\d+\/hifadhwi\//.test(fileUrl) ||
               fileUrl.startsWith('hifadhui/') || /^v\d+\/hifadhui\//.test(fileUrl)) {
      // Chemin relatif Cloudinary (avec ou sans version) - construire l'URL complète
      // Support des anciens chemins hifadhui/ et nouveaux hifadhwi/
      const cloudinaryBaseUrl = 'https://res.cloudinary.com/ddxypgvuh/raw/upload';
      return `${cloudinaryBaseUrl}/${fileUrl}`;
    } else {
      // Chemin local - utiliser l'API backend
      return `${process.env.REACT_APP_API_BASE_URL}${fileUrl}`;
    }
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
          scale={2.5}
          width={115} // Largeur de l'aperçu
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
        />
      </Document>
    </div>
  );
};

export default PdfPreview;
