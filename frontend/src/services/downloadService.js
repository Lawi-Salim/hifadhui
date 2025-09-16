import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import api from './api';

/**
 * Détermine le type de fichier basé sur son mimetype
 * @param {string} mimetype - Le type MIME du fichier
 * @returns {string} - 'image', 'pdf', ou 'other'
 */
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  return 'other';
};

/**
 * Génère le nom du fichier ZIP basé sur les types de fichiers sélectionnés
 * @param {Array} selectedItems - Liste des éléments sélectionnés
 * @returns {string} - Nom du fichier ZIP
 */
const generateZipFileName = (selectedItems) => {
  const fileTypes = selectedItems.map(item => getFileType(item.mimetype));
  const uniqueTypes = [...new Set(fileTypes)];
  
  if (uniqueTypes.length === 1) {
    switch (uniqueTypes[0]) {
      case 'image':
        return 'Hifadhwi-images.zip';
      case 'pdf':
        return 'Hifadhwi-pdfs.zip';
      default:
        return 'Hifadhwi-files.zip';
    }
  } else {
    // Fichiers mixtes
    return 'Hifadhwi-files.zip';
  }
};

/**
 * Télécharge un fichier depuis une URL
 * @param {string} url - URL du fichier
 * @param {string} filename - Nom du fichier
 * @returns {Promise<Blob>} - Le blob du fichier
 */
const downloadFileAsBlob = async (url, filename) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error(`Erreur téléchargement ${filename}:`, error);
    throw error;
  }
};

/**
 * Télécharge un fichier via l'API backend
 * @param {string} fileId - ID du fichier
 * @param {string} filename - Nom du fichier
 * @returns {Promise<Blob>} - Le blob du fichier
 */
const downloadFileViaAPI = async (fileId, filename) => {
  try {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur téléchargement API ${filename}:`, error);
    throw error;
  }
};

/**
 * Construit l'URL complète Cloudinary pour un fichier
 * @param {Object} item - L'objet fichier
 * @returns {string} - URL complète du fichier
 */
const buildCloudinaryUrl = (item) => {
  if (!item.file_url) return null;
  
  // Si c'est déjà une URL complète
  if (item.file_url.startsWith('http')) {
    return item.file_url;
  }
  
  // Si c'est un chemin relatif Cloudinary (format standardisé)
  const fileUrl = item.file_url;
  let directUrl;
  if (fileUrl.startsWith('Hifadhwi/') || /^v\d+\/Hifadhwi\//.test(fileUrl)) {
    // Chemin Cloudinary relatif
    const cloudName = 'drpbnhwh6'; // Cloud de développement
    directUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${fileUrl}`;
  } else {
    // Cloud de développement
    const cloudName = 'drpbnhwh6';
    const baseUrl = `https://res.cloudinary.com/${cloudName}`;
    const resourceType = item.mimetype.startsWith('image/') ? 'image' : 'raw';
    directUrl = `${baseUrl}/${resourceType}/upload/${item.file_url}`;
  }
  return directUrl;
  return null;
};

/**
 * Crée et télécharge un fichier ZIP contenant les éléments sélectionnés
 * @param {Array} selectedItems - Liste des éléments à inclure dans le ZIP
 * @param {Function} onProgress - Callback pour le suivi du progrès (optionnel)
 * @returns {Promise<void>}
 */
export const downloadSelectedItemsAsZip = async (selectedItems, onProgress = null) => {
  if (!selectedItems || selectedItems.length === 0) {
    throw new Error('Aucun élément sélectionné pour le téléchargement');
  }

  const zip = new JSZip();
  const zipFileName = generateZipFileName(selectedItems);
  
  let completed = 0;
  const total = selectedItems.length;

  // Fonction pour mettre à jour le progrès
  const updateProgress = () => {
    completed++;
    if (onProgress) {
      onProgress(completed, total);
    }
  };

  try {
    // Télécharger tous les fichiers en parallèle
    const downloadPromises = selectedItems.map(async (item) => {
      try {
        let blob;
        
        // Essayer d'abord l'URL Cloudinary directe
        const cloudinaryUrl = buildCloudinaryUrl(item);
        if (cloudinaryUrl) {
          try {
            blob = await downloadFileAsBlob(cloudinaryUrl, item.filename);
          } catch (error) {
            console.warn(`Échec téléchargement direct pour ${item.filename}, essai via API`);
            blob = await downloadFileViaAPI(item.id, item.filename);
          }
        } else {
          // Utiliser l'API backend comme fallback
          blob = await downloadFileViaAPI(item.id, item.filename);
        }

        // Ajouter le fichier au ZIP
        zip.file(item.filename, blob);
        updateProgress();
        
      } catch (error) {
        console.error(`Erreur lors du téléchargement de ${item.filename}:`, error);
        updateProgress();
        // Continuer avec les autres fichiers même si un échoue
      }
    });

    // Attendre que tous les téléchargements soient terminés
    await Promise.all(downloadPromises);

    // Générer et télécharger le ZIP
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Télécharger le fichier ZIP
    saveAs(zipBlob, zipFileName);
    
    return {
      success: true,
      fileName: zipFileName,
      fileCount: selectedItems.length
    };

  } catch (error) {
    console.error('Erreur lors de la création du ZIP:', error);
    throw new Error(`Erreur lors de la création du fichier ZIP: ${error.message}`);
  }
};

const downloadService = {
  downloadSelectedItemsAsZip,
  generateZipFileName,
  getFileType
};

export default downloadService;
