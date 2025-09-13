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
      // Exemple: https://res.cloudinary.com/{cloud_name}/raw/upload/v1756555848/Hifadhwi/upload/user/file.pdf
      // ou: https://res.cloudinary.com/{cloud_name}/image/upload/...
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex !== -1) {
        // Prendre toutes les parties après 'upload' et reconstruire le public_id
        publicId = urlParts.slice(uploadIndex + 1).join('/');
        
        // Supprimer le préfixe de version (v123456/) s'il existe
        publicId = publicId.replace(/^v\d+\//, '');
      }
    } 
    // 2. Si c'est un chemin avec version (v123456/Hifadhwi/...)
    else if (fileUrl.startsWith('v') && fileUrl.includes('/Hifadhwi/')) {
      publicId = fileUrl.replace(/^v\d+\//, '');
    }
    // 3. Si c'est déjà un chemin Hifadhwi/...
    else if (fileUrl.startsWith('Hifadhwi/')) {
      publicId = fileUrl;
    }

    // Décoder les caractères encodés (comme %20 pour les espaces)
    publicId = decodeURIComponent(publicId);
    
    // Gestion spéciale pour les certificats et fichiers raw
    const isCertificate = publicId.includes('/certificats/') || publicId.includes('certificate_');
    const isRawFile = mimetype === 'application/pdf';
    
    if (isCertificate) {
      console.log(`🔍 [CERTIFICATE DELETE] Détecté comme certificat: ${publicId}`);
      // Les certificats sont stockés AVEC l'extension .pdf sur Cloudinary
      // Ne pas supprimer l'extension
    } else if (isRawFile) {
      console.log(`🔍 [RAW FILE DELETE] Détecté comme fichier raw (PDF): ${publicId}`);
      // Les PDFs sont stockés AVEC l'extension .pdf sur Cloudinary
      // Ne pas supprimer l'extension
    } else {
      // Pour les images, supprimer l'extension
      publicId = publicId.replace(/\.[^/.]+$/, '');
    }

    // Déterminer le type de ressource
    let resource_type = 'raw'; // Par défaut raw pour PDFs et certificats
    if (mimetype.startsWith('image/')) {
      resource_type = 'image';
    }

    console.log(`🗑️ [CLOUDINARY DELETE] Tentative suppression:`);
    console.log(`   - Original URL: ${fileUrl}`);
    console.log(`   - Public ID: ${publicId}`);
    console.log(`   - Resource type: ${resource_type}`);
    console.log(`   - MIME type: ${mimetype}`);
    console.log(`   - Is Certificate: ${isCertificate}`);
    console.log(`   - Is Raw File: ${isRawFile}`);
    
    // Essayer d'abord avec le public_id tel quel
    let result = await cloudinary.uploader.destroy(publicId, { 
      resource_type,
      invalidate: true
    });
    
    console.log(`🔍 [CLOUDINARY DELETE] Premier essai - Résultat: ${result.result}`);
    
    // Si non trouvé, essayer différentes variantes du public_id
    if (result.result === 'not found') {
      // Essai 1: Avec encodage URL
      const encodedPublicId = publicId.split('/').map(encodeURIComponent).join('/');
      console.log(`🔄 [CLOUDINARY DELETE] Essai avec public_id encodé: ${encodedPublicId}`);
      
      result = await cloudinary.uploader.destroy(encodedPublicId, {
        resource_type,
        invalidate: true
      });
      
      console.log(`🔍 [CLOUDINARY DELETE] Deuxième essai - Résultat: ${result.result}`);
      
      // Essai 2: Si toujours pas trouvé, essayer avec l'extension pour les PDFs
      if (result.result === 'not found' && (isRawFile || isCertificate)) {
        const publicIdWithExt = `${publicId}.pdf`;
        console.log(`🔄 [CLOUDINARY DELETE] Essai avec extension .pdf: ${publicIdWithExt}`);
        
        result = await cloudinary.uploader.destroy(publicIdWithExt, {
          resource_type,
          invalidate: true
        });
        
        console.log(`🔍 [CLOUDINARY DELETE] Troisième essai - Résultat: ${result.result}`);
      }
    }
    
    // Si toujours non trouvé, considérer comme déjà supprimé
    if (result.result === 'not found') {
      console.log(`⚠️ [CLOUDINARY DELETE] Fichier non trouvé sur Cloudinary: ${publicId}`);
      console.log(`   - URL originale: ${fileUrl}`);
      console.log(`   - Considéré comme déjà supprimé`);
      return { result: 'ok' };
    }
    
    if (result.result === 'ok') {
      console.log(`✅ [CLOUDINARY DELETE] Suppression réussie: ${publicId}`);
    } else {
      console.log(`❌ [CLOUDINARY DELETE] Échec suppression: ${publicId}`, result);
    }
    
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
 * @param {string} fileType - Le type de fichier ('images', 'pdfs', 'certificats')
 * @returns {string} Le chemin du dossier
 */
function getUserFileFolder(user, fileType = null) {
  const userFolder = `Hifadhwi/upload/${user.username || user.id}`;
  
  if (!fileType) {
    return userFolder;
  }
  
  return `${userFolder}/${fileType}`;
}

/**
 * Détermine le type de fichier basé sur le MIME type ou l'extension
 * @param {string} mimetype - Le type MIME du fichier
 * @param {string} filename - Le nom du fichier (optionnel, pour l'extension)
 * @returns {string} Le type de fichier ('images', 'pdfs', 'autres')
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
  
  return 'autres';
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
  return `Hifadhwi/upload/${user.username || user.id}/certificats`;
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
  
  // Pour les PDFs, garder l'extension car Cloudinary raw en a besoin
  if (extension === 'pdf') {
    return `${baseName}_${timestamp}.${extension}`;
  }
  
  // Pour les images, pas d'extension (Cloudinary l'ajoute automatiquement)
  return `${baseName}_${timestamp}`;
}

/**
 * Génère un nom de certificat basé sur le nom du fichier original
 * @param {string} originalFileName - Le nom original du fichier
 * @param {number} timestamp - Timestamp optionnel (utilise Date.now() si non fourni)
 * @returns {string} Le nom du certificat
 */
function generateCertificateName(originalFileName, timestamp = null) {
  const ts = timestamp || Date.now();
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  return `certificate_${nameWithoutExt}_${ts}.pdf`;
}

/**
 * Configuration Cloudinary pour les fichiers utilisateur
 * @param {Object} user - L'objet utilisateur
 * @param {Object} file - L'objet fichier
 * @returns {Object} Configuration Cloudinary
 */
function getUserFileConfig(user, file) {
  const fileType = getFileType(file.mimetype, file.originalname);
  
  const config = {
    folder: getUserFilePath(user, file),
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: fileType === 'pdfs' ? 'raw' : 'auto',
    public_id: generateUniqueFileName(file.originalname),
    access_mode: 'public'
  };
  
  // Pour les PDFs (raw files), ajouter des paramètres spécifiques
  if (fileType === 'pdfs') {
    config.type = 'upload';
    config.invalidate = true;
  }
  
  return config;
}

/**
 * Configuration Cloudinary pour les certificats
 * @param {Object} user - L'objet utilisateur
 * @param {string} originalFileName - Le nom original du fichier
 * @param {number} timestamp - Timestamp optionnel
 * @returns {Object} Configuration Cloudinary
 */
function getCertificateConfig(user, originalFileName, timestamp = null) {
  const certificateName = generateCertificateName(originalFileName, timestamp);
  // Supprimer l'extension .pdf pour le public_id (Cloudinary l'ajoute automatiquement pour raw)
  const publicId = certificateName.replace(/\.pdf$/, '');
  
  return {
    resource_type: 'raw',
    folder: getCertificateFolder(user),
    public_id: publicId,
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
  getUserFileFolder,
  getCertificateFolder,
  generateUniqueFileName,
  generateCertificateName,
  getUserFileConfig,
  getCertificateConfig,
  deleteCloudinaryFile,
  generateCloudinaryPath
};
