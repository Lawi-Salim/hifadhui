/**
 * Utilitaires pour le formatage et la normalisation du texte
 */

/**
 * Corrige l'encodage des caractères spéciaux français mal encodés
 * @param {string} text - Le texte à corriger
 * @returns {string} - Le texte avec l'encodage corrigé
 */
export const fixEncoding = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Mapping des caractères mal encodés vers les caractères corrects
  const encodingMap = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã§': 'ç',
    'Ã´': 'ô',
    'Ã¢': 'â',
    'Ã®': 'î',
    'Ã¯': 'ï',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã«': 'ë',
    'Ã¶': 'ö',
    'Ã¼': 'ü',
    'Ã±': 'ñ',
    'Ã': 'À',
    'Ã‰': 'É',
    'Ã‡': 'Ç',
    'Ã"': 'Ô',
    'Ã‚': 'Â',
    'ÃŽ': 'Î',
    'Ã™': 'Ù',
    'Ã›': 'Û',
    'Ã‹': 'Ë',
    'Ã–': 'Ö',
    'Ãœ': 'Ü'
  };
  
  let correctedText = text;
  
  // Remplacer tous les caractères mal encodés
  Object.keys(encodingMap).forEach(malformed => {
    const regex = new RegExp(malformed, 'g');
    correctedText = correctedText.replace(regex, encodingMap[malformed]);
  });
  
  return correctedText;
};

/**
 * Normalise un nom de fichier en corrigeant l'encodage et en nettoyant
 * @param {string} filename - Le nom de fichier à normaliser
 * @returns {string} - Le nom de fichier normalisé
 */
export const normalizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return filename;
  
  // Corriger l'encodage
  let normalized = fixEncoding(filename);
  
  // Nettoyer les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
};

/**
 * Convertit un texte en slug URL-safe (sans accents, espaces, caractères spéciaux)
 * @param {string} text - Le texte à convertir
 * @returns {string} - Le slug URL-safe
 */
export const createSlug = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Mapping manuel des caractères accentués pour plus de fiabilité
  const accentMap = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ÿ': 'y',
    'ñ': 'n', 'ç': 'c',
    // Caractères spéciaux français supplémentaires
    'œ': 'oe', 'æ': 'ae',
    'Œ': 'OE', 'Æ': 'AE',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'Ý': 'Y', 'Ÿ': 'Y',
    'Ñ': 'N', 'Ç': 'C'
  };
  
  return text
    .toLowerCase()
    // Remplacer manuellement les caractères accentués
    .split('').map(char => accentMap[char] || char).join('')
    // Remplacer les espaces et caractères spéciaux par des tirets
    .replace(/[^a-z0-9]+/g, '-')
    // Supprimer les tirets en début et fin
    .replace(/^-+|-+$/g, '')
    // Supprimer les tirets multiples
    .replace(/-+/g, '-');
};

/**
 * Formate un nom de fichier pour l'affichage
 * @param {string} filename - Le nom de fichier à formater
 * @param {number} maxLength - Longueur maximale (optionnel)
 * @param {boolean} hideExtension - Masquer l'extension (optionnel)
 * @returns {string} - Le nom de fichier formaté
 */
export const formatFilename = (filename, maxLength = null, hideExtension = false) => {
  if (!filename || typeof filename !== 'string') return filename;
  
  // Appliquer la correction d'encodage d'abord
  let formatted = fixEncoding(filename);
  
  // Masquer l'extension si demandé
  if (hideExtension) {
    const lastDotIndex = formatted.lastIndexOf('.');
    if (lastDotIndex > 0) {
      formatted = formatted.substring(0, lastDotIndex);
    }
  }
  
  // Tronquer si nécessaire
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + '...';
  }
  
  return formatted;
};
