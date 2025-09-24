import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  message = 'Chargement...', 
  size = 'medium', 
  fullScreen = false,
  className = '' 
}) => {
  const containerClass = `loading-container ${fullScreen ? 'fullscreen' : ''} ${className}`;
  const spinnerClass = `loading-spinner ${size}`;

  return (
    <div className={containerClass}>
      <div className={spinnerClass}></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;