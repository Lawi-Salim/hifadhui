import React from 'react';
import { FaFacebook } from 'react-icons/fa';
import './ProviderIcon.css';

/**
 * Composant pour afficher l'icône du provider d'authentification
 * @param {Object} user - Objet utilisateur
 * @param {string} size - Taille de l'icône ('small', 'medium', 'large')
 * @param {boolean} showLabel - Afficher ou non le label du provider
 * @param {string} className - Classes CSS additionnelles
 */
const ProviderIcon = ({ user, size = 'medium', showLabel = false, className = '' }) => {
  // Si pas d'utilisateur, ne rien afficher
  if (!user) {
    return null;
  }
  // Déterminer le provider de l'utilisateur
  const getProvider = (user) => {
    // Vérifier que user existe
    if (!user) {
      return 'local';
    }
    
    if (user.google_id || user.googleId || user.provider === 'google') {
      return 'google';
    }
    if (user.facebook_id || user.facebookId || user.provider === 'facebook') {
      return 'facebook';
    }
    if (user.github_id || user.githubId || user.provider === 'github') {
      return 'github';
    }
    return 'local';
  };

  const provider = getProvider(user);

  // Configuration des providers
  const providerConfig = {
    google: {
      icon: '/google-g.svg',
      label: 'Google',
      className: 'provider-google'
    },
    facebook: {
      icon: <FaFacebook />,
      label: 'Facebook',
      className: 'provider-facebook'
    },
    github: {
      icon: '/github-mark-white.svg',
      label: 'GitHub',
      className: 'provider-github'
    },
    local: {
      icon: '/hifadhui.svg',
      label: 'Hifadhui',
      className: 'provider-local'
    }
  };

  const config = providerConfig[provider];
  const sizeClass = `provider-icon-${size}`;

  return (
    <div className={`provider-badge ${config.className} ${sizeClass} ${className}`}>
      {typeof config.icon === 'string' ? (
        <img 
          src={config.icon} 
          alt={config.label} 
          className={`provider-icon ${provider}-svg`} 
        />
      ) : (
        <span className={`provider-icon ${provider}-icon`}>
          {config.icon}
        </span>
      )}
      {showLabel && <span className="provider-label">{config.label}</span>}
    </div>
  );
};

export default ProviderIcon;
