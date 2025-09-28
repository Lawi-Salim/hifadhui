/**
 * Service de validation des domaines email autorisés
 * Restreint l'inscription aux domaines légitimes pour éviter les emails jetables
 */

import { ActivityLog } from '../models/index.js';

// Domaines email autorisés - Liste restrictive pour éviter les emails jetables
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
function isAllowedDomain(email) {
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
function extractDomain(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const emailParts = email.toLowerCase().split('@');
  return emailParts.length === 2 ? emailParts[1] : null;
}

/**
 * Log une tentative d'inscription avec domaine non autorisé
 * @param {string} email - L'email avec domaine interdit
 * @param {string} ipAddress - L'adresse IP de la tentative
 * @param {string} userAgent - Le user agent du navigateur
 * @param {string} action - L'action tentée (register, forgot-password)
 */
async function logUnauthorizedDomainAttempt(email, ipAddress = null, userAgent = null, action = 'register') {
  try {
    const domain = extractDomain(email);
    
    // Log dans la console pour le monitoring
    console.log(`🚨 [SECURITY] Tentative avec domaine non autorisé: ${domain} (email: ${email}) - Action: ${action} - IP: ${ipAddress}`);
    
    // Créer une notification de sécurité pour les admins au lieu d'utiliser ActivityLog
    const NotificationService = (await import('./notificationService.js')).default;
    
    // Créer une notification spécifique pour domaine non autorisé
    await NotificationService.notifyUnauthorizedDomainAttempt(
      email,
      domain,
      ipAddress || 'IP inconnue',
      userAgent || 'User-Agent inconnu',
      action
    );
    
    // Log détaillé pour les admins
    console.log(`📊 [SECURITY] Détails de la tentative:`, {
      email,
      domain,
      action,
      ip: ipAddress,
      userAgent: userAgent?.substring(0, 100) + '...', // Tronquer pour la lisibilité
      timestamp: new Date().toISOString(),
      allowedDomainsCount: ALLOWED_DOMAINS.length
    });
    
  } catch (error) {
    console.error('❌ [SECURITY] Erreur lors du logging de tentative domaine non autorisé:', error.message);
    // Ne pas faire échouer la validation à cause d'une erreur de logging
  }
}

/**
 * Valide un domaine email et lève une exception si non autorisé
 * @param {string} email - L'adresse email à valider
 * @param {string} ipAddress - L'adresse IP (optionnel)
 * @param {string} userAgent - Le user agent (optionnel)
 * @param {string} action - L'action tentée (optionnel)
 * @throws {Error} - Erreur avec message générique si domaine non autorisé
 */
async function validateEmailDomain(email, ipAddress = null, userAgent = null, action = 'register') {
  if (!isAllowedDomain(email)) {
    // Log de la tentative non autorisée
    await logUnauthorizedDomainAttempt(email, ipAddress, userAgent, action);
    
    // Message générique et légèrement informatif sans révéler la restriction
    throw new Error('Veuillez utiliser une adresse email valide et reconnue.');
  }
}

/**
 * Obtient la liste des domaines autorisés (pour usage interne uniquement)
 * @returns {Array<string>} - Liste des domaines autorisés
 */
function getAllowedDomains() {
  return [...ALLOWED_DOMAINS]; // Copie pour éviter les modifications
}

/**
 * Vérifie si un email a un format valide (basique)
 * @param {string} email - L'adresse email
 * @returns {boolean} - true si le format est valide
 */
function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validation complète d'un email (format + domaine)
 * @param {string} email - L'adresse email à valider
 * @param {string} ipAddress - L'adresse IP (optionnel)
 * @param {string} userAgent - Le user agent (optionnel)
 * @param {string} action - L'action tentée (optionnel)
 * @throws {Error} - Erreur si email invalide ou domaine non autorisé
 */
async function validateEmail(email, ipAddress = null, userAgent = null, action = 'register') {
  // Vérification du format
  if (!isValidEmailFormat(email)) {
    throw new Error('Format d\'email invalide.');
  }

  // Vérification du domaine autorisé
  await validateEmailDomain(email, ipAddress, userAgent, action);
}

export {
  isAllowedDomain,
  extractDomain,
  validateEmailDomain,
  validateEmail,
  getAllowedDomains,
  isValidEmailFormat,
  logUnauthorizedDomainAttempt,
  ALLOWED_DOMAINS
};

export default {
  isAllowedDomain,
  extractDomain,
  validateEmailDomain,
  validateEmail,
  getAllowedDomains,
  isValidEmailFormat,
  logUnauthorizedDomainAttempt,
  ALLOWED_DOMAINS: [...ALLOWED_DOMAINS] // Export en lecture seule
};
