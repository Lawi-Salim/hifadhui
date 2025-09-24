import { useEffect } from 'react';

const DynamicMeta = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  author,
  filename 
}) => {
  useEffect(() => {
    // Mise à jour du titre de la page
    if (title) {
      document.title = title;
    }

    // Fonction pour mettre à jour ou créer une meta tag
    const updateMetaTag = (property, content, isName = false) => {
      if (!content) return;
      
      const attribute = isName ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Mise à jour des métadonnées Open Graph
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    
    // Mise à jour des métadonnées Twitter
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:url', url);
    
    // Mise à jour de la description standard
    updateMetaTag('description', description, true);
    
    // Mise à jour de l'auteur si fourni
    if (author) {
      updateMetaTag('author', author, true);
    }

    // Nettoyage lors du démontage du composant
    return () => {
      // Optionnel : restaurer les métadonnées par défaut
      // Ici on peut choisir de laisser les métadonnées ou les restaurer
    };
  }, [title, description, image, url, type, author, filename]);

  return null; // Ce composant ne rend rien visuellement
};

export default DynamicMeta;
