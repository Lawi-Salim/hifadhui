import { v2 as cloudinary } from 'cloudinary';

/**
 * Supprime un fichier de Cloudinary en fonction de son URL
 * @param {string} fileUrl - L'URL du fichier ou le chemin Cloudinary
 * @param {string} [mimetype] - Le type MIME du fichier (pour déterminer le resource_type)
 * @returns {Promise<Object>} Le résultat de la suppression Cloudinary
 */
async function deleteCloudinaryFile(fileUrl, mimetype = '') {
  if (!fileUrl) {
    throw new Error('URL du fichier manquante pour la suppression Cloudinary');
  }

  try {
    let publicId = fileUrl;
    
    // 1. Si c'est une URL Cloudinary complète
    if (fileUrl.includes('res.cloudinary.com')) {
      // Exemple: https://res.cloudinary.com/ddxypgvuh/raw/upload/v1756555848/hifadhwi/upload/user/file.pdf
      // ou: https://res.cloudinary.com/ddxypgvuh/image/upload/...
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex !== -1) {
        // Prendre toutes les parties après 'upload' et reconstruire le public_id
        publicId = urlParts.slice(uploadIndex + 1).join('/');
        
        // Supprimer le préfixe de version (v123456/) s'il existe
        publicId = publicId.replace(/^v\d+\//, '');
      }
    } 
    // 2. Si c'est un chemin avec version (v123456/hifadhwi/...)
    else if (fileUrl.startsWith('v') && fileUrl.includes('/hifadhwi/')) {
      publicId = fileUrl.replace(/^v\d+\//, '');
    }
    // 3. Si c'est déjà un chemin hifadhwi/...
    else if (fileUrl.startsWith('hifadhwi/')) {
      publicId = fileUrl;
    }

    // Décoder les caractères encodés (comme %20 pour les espaces)
    publicId = decodeURIComponent(publicId);
    
    // Supprimer l'extension du public_id
    publicId = publicId.replace(/\.[^/.]+$/, '');

    // Déterminer le type de ressource
    const resource_type = mimetype.startsWith('image/') ? 'image' : 'raw';

    console.log(`Suppression Cloudinary - public_id: ${publicId}, resource_type: ${resource_type}, original_url: ${fileUrl}`);
    
    // Essayer d'abord avec le public_id tel quel
    let result = await cloudinary.uploader.destroy(publicId, { 
      resource_type,
      invalidate: true
    });
    
    // Si non trouvé, essayer en encodant le public_id
    if (result.result === 'not found') {
      const encodedPublicId = publicId.split('/').map(encodeURIComponent).join('/');
      console.log(`Essai avec public_id encodé: ${encodedPublicId}`);
      
      result = await cloudinary.uploader.destroy(encodedPublicId, {
        resource_type,
        invalidate: true
      });
    }
    
    // Si toujours non trouvé, c'est peut-être un problème de public_id
    if (result.result === 'not found') {
      console.log(`Fichier non trouvé sur Cloudinary: ${publicId}`);
      console.log(`URL originale: ${fileUrl}`);
      // Ne pas retourner 'ok' car le fichier existe peut-être encore
      throw new Error(`Fichier non trouvé sur Cloudinary avec public_id: ${publicId}`);
    }
    
    console.log('Résultat suppression Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression Cloudinary:', error);
    throw error;
  }
}

/**
 * Utilitaire pour gérer la structure d'organisation Cloudinary
 * Centralise la logique de création des chemins de dossiers
 */

/**
 * Génère le chemin de dossier pour les fichiers utilisateur
 * @param {Object} user - L'objet utilisateur
 * @param {string} fileType - Le type de fichier ('images', 'pdfs', 'others')
 * @returns {string} Le chemin du dossier
 */
function getUserFileFolder(user, fileType = null) {
  const userFolder = `hifadhwi/upload/${user.username || user.id}`;
  
  if (!fileType) {
    return userFolder;
  }
  
  return `${userFolder}/${fileType}`;
}

/**
 * Détermine le type de fichier basé sur le MIME type ou l'extension
 * @param {string} mimetype - Le type MIME du fichier
 * @param {string} filename - Le nom du fichier (optionnel, pour l'extension)
 * @returns {string} Le type de fichier ('images', 'pdfs', 'others')
 */
function getFileType(mimetype, filename = '') {
  // Vérifier d'abord le MIME type
  if (mimetype.startsWith('image/')) {
    return 'images';
  }
  
  if (mimetype === 'application/pdf') {
    return 'pdfs';
  }
  
  
  // Si le MIME type n'est pas concluant, vérifier l'extension
  if (filename) {
    const extension = filename.toLowerCase();
    if (extension.match(/\.(jpg|jpeg|png)$/)) {
      return 'images';
    }
    if (extension.match(/\.pdf$/)) {
      return 'pdfs';
    }
  }
  
  return 'other';
}

/**
 * Génère le chemin complet pour un fichier utilisateur
 * @param {Object} user - L'objet utilisateur
 * @param {Object} file - L'objet fichier avec mimetype et originalname
 * @returns {string} Le chemin complet du dossier
 */
function getUserFilePath(user, file) {
  const fileType = getFileType(file.mimetype, file.originalname);
  return getUserFileFolder(user, fileType);
}

/**
 * Génère le chemin pour les certificats d'un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {string} Le chemin du dossier certificats
 */
function getCertificateFolder(user) {
  return `hifadhwi/certificates/${user.username || user.id}`;
}

/**
 * Génère un nom de fichier unique avec timestamp
 * @param {string} originalName - Le nom original du fichier
 * @param {string} prefix - Préfixe optionnel
 * @returns {string} Le nom de fichier unique
 */
function generateUniqueFileName(originalName, prefix = '') {
  const timestamp = Date.now();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, ''); // Enlève l'extension proprement
  const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
  
  const baseName = prefix ? `${prefix}_${nameWithoutExt}` : nameWithoutExt;
  return extension ? `${baseName}_${timestamp}` : `${baseName}_${timestamp}`;
}

/**
 * Configuration Cloudinary pour les fichiers utilisateur
 * @param {Object} user - L'objet utilisateur
 * @param {Object} file - L'objet fichier
 * @returns {Object} Configuration Cloudinary
 */
function getUserFileConfig(user, file) {
  const fileType = getFileType(file.mimetype, file.originalname);
  
  return {
    folder: getUserFilePath(user, file),
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: fileType === 'pdfs' ? 'raw' : 'auto',
    public_id: generateUniqueFileName(file.originalname),
    access_mode: 'public'
  };
}

/**
 * Configuration Cloudinary pour les certificats
 * @param {Object} user - L'objet utilisateur
 * @param {string} fileId - L'ID du fichier
 * @returns {Object} Configuration Cloudinary
 */
function getCertificateConfig(user, fileId) {
  return {
    resource_type: 'raw',
    folder: getCertificateFolder(user),
    public_id: `certificate_${fileId}_${Date.now()}`,
    format: 'pdf'
  };
}

/**
 * Génère un chemin Cloudinary pour un fichier
 * @param {string} filename - Nom du fichier
 * @param {string} username - Nom d'utilisateur
 * @param {string} fileType - Type de fichier (image, pdf, etc.)
 * @returns {string} Chemin Cloudinary
 */
function generateCloudinaryPath(filename, username, fileType) {
  const uniqueFileName = generateUniqueFileName(filename);
  return `${uniqueFileName}`;
}

export {
  getFileType,
  getUserFilePath,
  getCertificateFolder,
  generateUniqueFileName,
  getUserFileConfig,
  getCertificateConfig,
  deleteCloudinaryFile,
  generateCloudinaryPath
};
