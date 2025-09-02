import React, { useEffect } from 'react';
import { FaTh, FaList } from 'react-icons/fa';
import './ViewModeSwitcher.css';

const ViewModeSwitcher = ({ viewMode, setViewMode, storageKey = 'defaultViewMode' }) => {
  // Charger le mode d'affichage depuis localStorage au montage
  useEffect(() => {
    const savedViewMode = localStorage.getItem(storageKey);
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
      setViewMode(savedViewMode);
    }
  }, [setViewMode, storageKey]);

  // Sauvegarder le mode d'affichage dans localStorage
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
  };

  return (
    <div className="view-mode-switcher">
      <button 
        onClick={() => handleViewModeChange('grid')} 
        className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
        title="Affichage en grille"
      >
        <FaTh />
      </button>
      <button 
        onClick={() => handleViewModeChange('list')} 
        className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
        title="Affichage en liste"
      >
        <FaList />
      </button>
    </div>
  );
};

export default ViewModeSwitcher;
