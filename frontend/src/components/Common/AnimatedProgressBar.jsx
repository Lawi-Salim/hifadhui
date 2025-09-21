import React from 'react';
import './AnimatedProgressBar.css';

/**
 * Composant de barre de progression avec animation fluide aller-retour
 * @param {number} progress - Pourcentage de progression (0-100)
 * @param {string} className - Classes CSS additionnelles
 * @param {string} color - Couleur de la barre (par défaut: primary)
 * @param {boolean} animated - Activer/désactiver l'animation (par défaut: true)
 * @param {number} animationDuration - Durée de l'animation en secondes (par défaut: 2)
 */
const AnimatedProgressBar = ({ 
  progress = 0, 
  className = '', 
  color = 'primary',
  animated = true,
  animationDuration = 2
}) => {
  const progressValue = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`animated-progress-container ${className}`}>
      <div className="animated-progress-track">
        <div 
          className={`animated-progress-fill ${color} ${animated ? 'animated' : ''}`}
          style={{ 
            width: `${progressValue}%`,
            '--animation-duration': `${animationDuration}s`
          }}
        >
          {animated && (
            <div className="progress-shimmer"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
