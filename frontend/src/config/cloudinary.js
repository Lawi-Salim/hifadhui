/**
 * Configuration Cloudinary dynamique selon l'environnement
 */

// Détection de l'environnement de production
const isProduction = () => {
  // Vérifier si on est sur Vercel en production
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('hifadhui.site') ||
      process.env.NODE_ENV === 'production') {
    return true;
  }
  return false;
};

// Configuration des clouds Cloudinary
export const getCloudinaryConfig = () => {
  const production = isProduction();
  
  return {
    cloudName: production ? 'ddxypgvuh' : 'drpbnhwh6',
    environment: production ? 'production' : 'development'
  };
};

// Fonction utilitaire pour construire les URLs Cloudinary
export const buildCloudinaryUrl = (fileUrl, resourceType) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  
  const { cloudName } = getCloudinaryConfig();
  
  // Détection automatique du type de ressource si non spécifié
  let finalResourceType = resourceType;
  if (!finalResourceType) {
    // Détecter selon l'extension du fichier
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl)) {
      finalResourceType = 'image';
    } else if (/\.pdf$/i.test(fileUrl)) {
      finalResourceType = 'raw';
    }
    // Pas de cas par défaut - soit image soit PDF uniquement
  }
  
  // Format standardisé avec Hifadhui/ uniquement
  if (fileUrl.startsWith('Hifadhui/') || /^v\d+\/Hifadhui\//.test(fileUrl)) {
    return `https://res.cloudinary.com/${cloudName}/${finalResourceType}/upload/${fileUrl}`;
  } else {
    // Nettoyer les doubles extensions
    let cleanUrl = fileUrl;
    const extensions = ['.png.png', '.jpg.jpg', '.jpeg.jpeg', '.pdf.pdf'];
    extensions.forEach(ext => {
      if (cleanUrl.endsWith(ext)) {
        cleanUrl = cleanUrl.replace(ext, ext.substring(0, ext.length / 2));
      }
    });
    
    return `https://res.cloudinary.com/${cloudName}/${finalResourceType}/upload/${cleanUrl}`;
  }
};

// Fonctions utilitaires spécialisées
export const buildImageUrl = (fileUrl) => buildCloudinaryUrl(fileUrl, 'image');
export const buildPdfUrl = (fileUrl) => buildCloudinaryUrl(fileUrl, 'raw');

console.log('Cloudinary Config:', getCloudinaryConfig());
