import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { buildCloudinaryUrl } from '../config/cloudinary';
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
        return 'Hifadhui-images.zip';
      case 'pdf':
        return 'Hifadhui-pdfs.zip';
      default:
        return 'Hifadhui-files.zip';
    }
  } else {
    // Fichiers mixtes
    return 'Hifadhui-files.zip';
  }
};

/**
 * Génère le nom du fichier ZIP pour l'export complet des données utilisateur
 * @returns {string} - Nom du fichier ZIP d'export
 */
const generateDataExportFileName = () => {
  return 'Hifadhui-data.zip';
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
 * Construit l'URL complète Cloudinary pour un élément
 * @param {Object} item - L'élément contenant file_url et mimetype
 * @returns {string} - URL complète du fichier
 */
const getCloudinaryUrlForItem = (item) => {
  if (!item.file_url) return null;
  
  // Si c'est déjà une URL complète
  if (item.file_url.startsWith('http')) {
    return item.file_url;
  }
  
  // Utiliser la fonction centralisée pour construire l'URL
  const resourceType = item.mimetype.startsWith('image/') ? 'image' : 'raw';
  return buildCloudinaryUrl(item.file_url, resourceType);
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
        const cloudinaryUrl = getCloudinaryUrlForItem(item);
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

/**
 * Exporte toutes les données utilisateur dans un ZIP structuré
 * @param {Array} userFiles - Tous les fichiers de l'utilisateur
 * @param {Function} onProgress - Callback de progression
 * @returns {Promise} - Promise de téléchargement
 */
const exportUserData = async (userFiles = [], onProgress = null) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  console.log('🗂️ [DATA EXPORT] Début export données utilisateur');
  console.log(`📁 Fichiers: ${userFiles.length}`);
  
  // Créer les dossiers principaux
  const imagesFolder = zip.folder('Images');
  const pdfsFolder = zip.folder('PDFs');
  
  let processedItems = 0;
  const totalItems = userFiles.length;
  
  try {
    // Traitement des fichiers
    for (const file of userFiles) {
      try {
        if (onProgress) {
          onProgress({
            progress: Math.round((processedItems / totalItems) * 90), // 90% max pour les fichiers
            currentItem: `Téléchargement: ${file.filename}`,
            type: 'export'
          });
        }
        
        const fileType = getFileType(file.mimetype);
        const cloudinaryUrl = getCloudinaryUrlForItem(file);
        if (!cloudinaryUrl) {
          console.error(`❌ URL manquante pour le fichier: ${file.filename}`);
          continue;
        }
        const blob = await downloadFileAsBlob(cloudinaryUrl, file.filename);
        
        // Organiser par type dans les dossiers appropriés
        switch (fileType) {
          case 'image':
            imagesFolder.file(file.filename, blob);
            console.log(`📸 Image ajoutée: ${file.filename}`);
            break;
          case 'pdf':
            pdfsFolder.file(file.filename, blob);
            console.log(`📄 PDF ajouté: ${file.filename}`);
            break;
          default:
            // Les autres fichiers vont dans le dossier PDFs par défaut
            pdfsFolder.file(file.filename, blob);
            console.log(`📎 Fichier ajouté: ${file.filename}`);
            break;
        }
        
        processedItems++;
      } catch (error) {
        console.error(`❌ Erreur téléchargement fichier ${file.filename}:`, error);
        // Continuer avec les autres fichiers même si un échoue
      }
    }
    
    
    // Finalisation du ZIP
    if (onProgress) {
      onProgress({
        progress: 95,
        currentItem: 'Création du fichier ZIP...',
        type: 'export'
      });
    }
    
    console.log('📦 Génération du fichier ZIP...');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Téléchargement
    const fileName = generateDataExportFileName();
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (onProgress) {
      onProgress({
        progress: 100,
        currentItem: 'Export terminé !',
        type: 'export',
        completed: true
      });
    }
    
    console.log(`✅ [DATA EXPORT] Export terminé: ${fileName}`);
    console.log(`📊 Statistiques: ${processedItems}/${totalItems} éléments traités`);
    
    return {
      success: true,
      fileName,
      stats: {
        totalFiles: userFiles.length,
        processedItems,
        totalItems
      }
    };
    
  } catch (error) {
    console.error('❌ [DATA EXPORT] Erreur lors de la création du ZIP:', error);
    throw new Error(`Erreur lors de l'export des données: ${error.message}`);
  }
};

const downloadService = {
  downloadSelectedItemsAsZip,
  generateZipFileName,
  generateDataExportFileName,
  exportUserData,
  getFileType
};

export default downloadService;
