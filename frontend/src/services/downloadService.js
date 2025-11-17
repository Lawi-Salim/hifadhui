import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
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
 * Ajoute un watermark Product ID sur une image à partir d'un Blob
 * Utilise html2canvas pour capturer un mini DOM avec l'image + texte overlay
 * @param {Blob} imageBlob - Le blob de l'image originale
 * @param {string} productId - Le Product ID complet
 * @returns {Promise<Blob>} - Le blob PNG de l'image avec watermark
 */
const addWatermarkToImage = async (imageBlob, productId) => {
  if (!productId) {
    return imageBlob;
  }

  // On n'affiche que les deux dernières parties du Product ID (ex: 000005-271684)
  const displayProductId = productId.includes('-')
    ? productId.split('-').slice(-2).join('-')
    : productId;

  console.log('[downloadService.addWatermarkToImage] start', { productId, displayProductId });

  return new Promise((resolve, reject) => {
    // Créer un conteneur hors écran pour html2canvas
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.zIndex = '-1';

    // Image (chargée depuis un DataURL pour éviter les restrictions CSP sur blob:)
    const img = document.createElement('img');
    img.style.display = 'block';
    img.style.maxWidth = '100%';

    // Wrapper positionné
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.appendChild(img);

    // Overlay texte type watermark (style proche de SharedFilePage)
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.pointerEvents = 'none';

    const textSpan = document.createElement('span');
    textSpan.textContent = displayProductId;
    // Styles de base (la taille exacte sera ajustée dynamiquement après chargement de l'image)
    textSpan.style.fontWeight = 'bold';
    // Blanc un peu plus transparent pour diminuer le contraste tout en restant visible
    textSpan.style.color = 'rgba(255, 255, 255, 0.12)';
    textSpan.style.textShadow = '2px 2px 4px rgba(65, 52, 52, 0.8), -2px -2px 4px rgba(0,0,0,0.8), 2px -2px 4px rgba(0,0,0,0.8), -2px 2px 4px rgba(0,0,0,0.8)';
    textSpan.style.transform = 'rotate(-45deg)';
    textSpan.style.whiteSpace = 'nowrap';
    textSpan.style.letterSpacing = '0.2em';

    overlay.appendChild(textSpan);
    wrapper.appendChild(overlay);
    container.appendChild(wrapper);
    document.body.appendChild(container);

    img.onload = async () => {
      // Adapter la taille du texte en fonction de la taille de l'image
      const baseSize = Math.min(img.naturalWidth || img.width || 0, img.naturalHeight || img.height || 0);
      if (baseSize > 0) {
        const fontSizePx = Math.max(24, Math.round(baseSize * 0.08)); // ~8% du côté le plus petit
        textSpan.style.fontSize = `${fontSizePx}px`;
        // Ajuster légèrement l'espacement des lettres en fonction de la taille
        textSpan.style.letterSpacing = `${Math.round(fontSizePx * 0.08)}px`;
      } else {
        // Fallback raisonnable
        textSpan.style.fontSize = '32px';
      }

      try {
        const canvas = await html2canvas(wrapper, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false
        });

        canvas.toBlob((blob) => {
          document.body.removeChild(container);
          if (!blob) {
            reject(new Error('Échec de la génération du blob watermark'));
            return;
          }
          console.log('[downloadService.addWatermarkToImage] success, blob size =', blob.size);
          resolve(blob);
        }, 'image/png');
      } catch (error) {
        document.body.removeChild(container);
        console.error('[downloadService.addWatermarkToImage] error', error);
        reject(error);
      }
    };

    img.onerror = () => {
      document.body.removeChild(container);
      const err = new Error("Erreur lors du chargement de l'image pour watermark");
      console.error('[downloadService.addWatermarkToImage] img.onerror', err);
      reject(err);
    };

    // Charger le Blob en DataURL pour contourner la restriction CSP sur blob:
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
    };
    reader.onerror = () => {
      document.body.removeChild(container);
      const err = new Error('Erreur lors de la lecture du Blob image');
      console.error('[downloadService.addWatermarkToImage] FileReader.onerror', err);
      reject(err);
    };

    reader.readAsDataURL(imageBlob);
  });
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
 * Télécharge un fichier unique, avec option de filigrane pour les images
 * @param {Object} file - Objet fichier (contient au minimum id, filename, mimetype, file_url, empreinte)
 * @param {Object} options
 * @param {boolean} options.withWatermark - Si true et que c'est une image avec product_id, ajoute le filigrane
 */
const downloadSingleFile = async (file, { withWatermark = false } = {}) => {
  if (!file) {
    throw new Error("Aucun fichier fourni pour le téléchargement");
  }

  try {
    let blob;

    // Essayer d'abord l'URL Cloudinary directe si disponible
    const cloudinaryUrl = getCloudinaryUrlForItem(file);
    if (cloudinaryUrl) {
      try {
        blob = await downloadFileAsBlob(cloudinaryUrl, file.filename);
      } catch (error) {
        console.warn(`Échec téléchargement direct pour ${file.filename}, essai via API`);
        blob = await downloadFileViaAPI(file.id, file.filename);
      }
    } else {
      // Utiliser l'API backend comme fallback
      blob = await downloadFileViaAPI(file.id, file.filename);
    }

    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const productId = file.empreinte?.product_id;

    console.log('[downloadService.downloadSingleFile] before watermark', {
      filename: file.filename,
      withWatermark,
      isImage,
      productId,
      mimetype: file.mimetype
    });

    // Appliquer le watermark uniquement si demandé, que c'est une image et qu'un product_id existe
    if (withWatermark && isImage && productId) {
      try {
        blob = await addWatermarkToImage(blob, productId);
        console.log(`✓ Watermark ajouté sur ${file.filename} (${productId})`);
      } catch (error) {
        console.warn(`Impossible d'ajouter le watermark sur ${file.filename}:`, error);
        // Continuer avec le fichier original sans watermark
      }
    }

    // Déclencher le téléchargement côté client
    saveAs(blob, file.filename);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
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
export const downloadSelectedItemsAsZip = async (selectedItems, onProgress = null, { withWatermark = true } = {}) => {
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

  console.log('[downloadService.downloadSelectedItemsAsZip] start', {
    count: selectedItems.length,
    withWatermark
  });

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

        // Ajouter watermark si c'est une image avec Product ID et que l'option est activée
        const isImage = item.mimetype && item.mimetype.startsWith('image/');
        const productId = item.empreinte?.product_id;
        
        if (withWatermark && isImage && productId) {
          try {
            blob = await addWatermarkToImage(blob, productId);
            console.log(`✓ Watermark ajouté sur ${item.filename} (${productId})`);
          } catch (error) {
            console.warn(`Impossible d'ajouter le watermark sur ${item.filename}:`, error);
            // Continuer avec l'image sans watermark
          }
        } else {
          console.log('[downloadSelectedItemsAsZip] no watermark for item', {
            filename: item.filename,
            withWatermark,
            isImage,
            productId
          });
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
  getFileType,
  downloadSingleFile
};

export default downloadService;
