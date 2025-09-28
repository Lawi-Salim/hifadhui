/**
 * Utilitaire de validation des domaines email côté frontend
 * Synchronisé avec la validation backend pour une UX cohérente
 */

// Domaines email autorisés - Doit être synchronisé avec le backend
const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.fr',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'orange.fr',
  'free.fr'
];

/**
 * Vérifie si un domaine email est autorisé
 * @param {string} email - L'adresse email à vérifier
 * @returns {boolean} - true si le domaine est autorisé
 */
export function isAllowedDomain(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailParts = email.toLowerCase().split('@');
  if (emailParts.length !== 2) {
    return false;
  }

  const domain = emailParts[1];
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Extrait le domaine d'une adresse email
 * @param {string} email - L'adresse email
 * @returns {string|null} - Le domaine ou null si invalide
 */
export function extractDomain(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const emailParts = email.toLowerCase().split('@');
  return emailParts.length === 2 ? emailParts[1] : null;
}

/**
 * Valide un email et retourne un message d'erreur si nécessaire
 * @param {string} email - L'adresse email à valider
 * @returns {string|null} - Message d'erreur ou null si valide
 */
export function validateEmailDomain(email) {
  if (!email) {
    return null; // Pas d'erreur si email vide (géré par validation de format)
  }

  if (!isAllowedDomain(email)) {
    return 'Veuillez utiliser une adresse email valide et reconnue.';
  }

  return null;
}

/**
 * Vérifie si un email a un format valide (basique)
 * @param {string} email - L'adresse email
 * @returns {boolean} - true si le format est valide
 */
export function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validation complète d'un email (format + domaine)
 * @param {string} email - L'adresse email à valider
 * @returns {string|null} - Message d'erreur ou null si valide
 */
export function validateEmail(email) {
  if (!email) {
    return 'Email requis';
  }

  if (!isValidEmailFormat(email)) {
    return 'Format d\'email invalide';
  }

  return validateEmailDomain(email);
}

/**
 * Obtient la liste des domaines autorisés (pour affichage si nécessaire)
 * @returns {Array<string>} - Liste des domaines autorisés
 */
export function getAllowedDomains() {
  return [...ALLOWED_DOMAINS]; // Copie pour éviter les modifications
}

/**
 * Obtient un message d'aide pour les domaines autorisés
 * @returns {string} - Message d'aide
 */
export function getDomainHelpMessage() {
  return 'Utilisez une adresse email de fournisseur reconnu (Gmail, Yahoo, Outlook, etc.)';
}
