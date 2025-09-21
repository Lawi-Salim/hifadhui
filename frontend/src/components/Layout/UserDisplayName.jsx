import React from 'react';

/**
 * Composant centralisé pour afficher le nom d'utilisateur formaté
 * Format: "User-87dd8434" (première tranche de l'ID utilisateur)
 */
const UserDisplayName = ({ user, fallback = 'Utilisateur' }) => {
  if (!user) {
    return fallback;
  }

  // TOUJOURS utiliser le format "User-{première tranche ID}" pour tous les utilisateurs
  if (user.id) {
    const idPrefix = user.id.split('-')[0];
    return `User-${idPrefix}`;
  }

  // Fallback sur l'email si pas d'ID
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return `User-${emailPrefix.substring(0, 8)}`;
  }

  return fallback;
};

export default UserDisplayName;
