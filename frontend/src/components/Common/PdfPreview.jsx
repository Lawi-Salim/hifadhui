import React, { useState, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const PdfPreview = ({ fileUrl, fileId, className }) => {
  const [, setNumPages] = useState(null);

  // Tous les hooks doivent être appelés avant les returns conditionnels
  const fullFileUrl = useMemo(() => {
    // Vérifier que fileUrl est valide
    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
      return null;
    }
    
    console.log('PdfPreview - fileUrl original:', fileUrl);
    
    if (fileUrl.startsWith('http')) {
      // URL complète déjà fournie (anciens fichiers)
      const finalUrl = fileUrl.endsWith('.pdf.pdf') ? fileUrl.replace('.pdf.pdf', '.pdf') : fileUrl;
      console.log('PdfPreview - URL complète:', finalUrl);
      return finalUrl;
    } else if (fileUrl.startsWith('Hifadhwi/') || /^v\d+\/Hifadhwi\//.test(fileUrl)) {
      // Chemin Cloudinary relatif - utiliser raw pour les PDFs
      const cloudName = 'drpbnhwh6'; // Cloud de développement
      const fullFileUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${fileUrl}`;
      console.log('PdfPreview - URL Cloudinary relative (raw):', fullFileUrl);
      console.log('PdfPreview - Cloud name utilisé:', cloudName);
      
      return fullFileUrl;
    } else if (/^v\d+\/[^/]+\.(jpg|jpeg|png|pdf)$/i.test(fileUrl)) {
      // Accès direct Cloudinary avec la bonne structure
      const cloudName = 'drpbnhwh6'; // Cloud de développement
      const cloudinaryBaseUrl = `https://res.cloudinary.com/${cloudName}/raw/upload`;
      
      // Nettoyer les doubles extensions avant de construire l'URL
      let cleanUrl = fileUrl;
      if (cleanUrl.endsWith('.pdf.pdf')) {
        cleanUrl = cleanUrl.replace('.pdf.pdf', '.pdf');
      }
      
      // Ajouter .pdf seulement si le chemin n'a pas d'extension du tout
      const urlWithExtension = cleanUrl.includes('.') ? cleanUrl : `${cleanUrl}.pdf`;
      const finalUrl = `${cloudinaryBaseUrl}/${urlWithExtension}`;
      console.log('PdfPreview - URL Cloudinary directe (raw):', finalUrl);
      console.log('PdfPreview - Cloud name utilisé:', cloudName);
      console.log('PdfPreview - NODE_ENV:', process.env.NODE_ENV);
      return finalUrl;
    } else {
      // Chemin local - utiliser l'API backend
      const finalUrl = `${process.env.REACT_APP_API_BASE_URL}${fileUrl}`;
      console.log('PdfPreview - URL locale:', finalUrl);
      return finalUrl;
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
