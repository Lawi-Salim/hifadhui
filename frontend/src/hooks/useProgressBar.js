import { useState, useCallback, useRef } from 'react';

/**
 * Calcule l'intervalle et les incréments basés sur la taille du fichier
 * @param {number} fileSize - Taille du fichier en bytes
 * @param {string} operationType - Type d'opération
 * @returns {Object} Configuration adaptée
 */
const calculateProgressConfig = (fileSize, operationType) => {
  // Tailles de référence
  const SMALL_FILE = 100 * 1024; // 100KB
  const MEDIUM_FILE = 1024 * 1024; // 1MB
  const LARGE_FILE = 5 * 1024 * 1024; // 5MB

  let baseInterval = 300;
  let minIncrement = 2;
  let maxIncrement = 8;

  // Ajuster selon la taille du fichier
  if (fileSize <= SMALL_FILE) {
    // Fichiers petits : progression plus rapide
    baseInterval = 150;
    minIncrement = 4;
    maxIncrement = 12;
  } else if (fileSize <= MEDIUM_FILE) {
    // Fichiers moyens : progression normale
    baseInterval = 250;
    minIncrement = 3;
    maxIncrement = 10;
  } else if (fileSize <= LARGE_FILE) {
    // Gros fichiers : progression plus lente
    baseInterval = 400;
    minIncrement = 1.5;
    maxIncrement = 6;
  } else {
    // Très gros fichiers : progression très lente
    baseInterval = 600;
    minIncrement = 1;
    maxIncrement = 4;
  }

  return { interval: baseInterval, minIncrement, maxIncrement };
};

/**
 * Hook personnalisé pour gérer les barres de progression
 * @param {Object} options - Options de configuration
 * @param {string} options.type - Type d'opération ('upload', 'download', 'delete', 'extract', 'process')
 * @param {number} options.maxProgress - Progression maximale avant completion réelle (défaut: 90)
 * @param {number} options.interval - Intervalle de mise à jour en ms (défaut: 300)
 * @param {number} options.minIncrement - Incrément minimum par étape (défaut: 2)
 * @param {number} options.maxIncrement - Incrément maximum par étape (défaut: 8)
 * @param {number} options.fileSize - Taille du fichier pour adapter la vitesse
 */
export const useProgressBar = (options = {}) => {
  const {
    type = 'process',
    maxProgress = 90,
    interval: customInterval,
    minIncrement: customMinIncrement,
    maxIncrement: customMaxIncrement,
    fileSize
  } = options;

  // Calculer la configuration adaptée si une taille de fichier est fournie
  const adaptedConfig = fileSize ? calculateProgressConfig(fileSize, type) : {};
  
  const interval = customInterval || adaptedConfig.interval || 300;
  const minIncrement = customMinIncrement || adaptedConfig.minIncrement || 2;
  const maxIncrement = customMaxIncrement || adaptedConfig.maxIncrement || 8;

  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [stats, setStats] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  
  const intervalRef = useRef(null);

  /**
   * Démarre la progression simulée
   */
  const startProgress = useCallback((initialMessage = '', newFileSize = null) => {
    setIsActive(true);
    setProgress(0);
    setCurrentItem(initialMessage);
    setError(null);
    setCompleted(false);
    
    // Recalculer la config si une nouvelle taille est fournie
    let currentInterval = interval;
    let currentMinIncrement = minIncrement;
    let currentMaxIncrement = maxIncrement;
    
    if (newFileSize) {
      const newConfig = calculateProgressConfig(newFileSize, type);
      currentInterval = newConfig.interval;
      currentMinIncrement = newConfig.minIncrement;
      currentMaxIncrement = newConfig.maxIncrement;
    }
    
    // Démarrer la progression fluide simulée
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= maxProgress) return prev;
        const increment = Math.random() * (currentMaxIncrement - currentMinIncrement) + currentMinIncrement;
        return Math.min(Math.round(prev + increment), maxProgress);
      });
    }, currentInterval);
  }, [maxProgress, interval, minIncrement, maxIncrement, type]);

  /**
   * Met à jour les statistiques de progression
   */
  const updateStats = useCallback((current, total) => {
    setStats({ current, total });
    
    // Si tous les éléments sont traités, compléter la progression
    if (current === total && total > 0) {
      completeProgress();
    }
  }, []);

  /**
   * Met à jour l'élément en cours de traitement
   */
  const updateCurrentItem = useCallback((item) => {
    setCurrentItem(item);
  }, []);

  /**
   * Complète la progression à 100%
   */
  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(100);
    setCompleted(true);
  }, []);

  /**
   * Arrête la progression avec une erreur
   */
  const setProgressError = useCallback((errorMessage) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setError(errorMessage);
    setIsActive(false);
  }, []);

  /**
   * Réinitialise complètement la progression
   */
  const resetProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setProgress(0);
    setCurrentItem('');
    setStats({ current: 0, total: 0 });
    setError(null);
    setCompleted(false);
  }, []);

  /**
   * Arrête la progression (avec délai optionnel)
   */
  const stopProgress = useCallback((delay = 0) => {
    setIsActive(false);
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (delay > 0) {
      setTimeout(cleanup, delay);
    } else {
      cleanup();
    }
  }, []);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Nettoyage à la destruction du composant
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    // État
    isActive,
    progress,
    currentItem,
    stats,
    error,
    completed,
    type,
    
    // Actions
    startProgress,
    updateStats,
    updateCurrentItem,
    completeProgress,
    setProgressError,
    resetProgress,
    stopProgress,
    setProgress,
    
    // Configuration adaptative
    calculateProgressConfig: (size) => calculateProgressConfig(size, type)
  };
};

export default useProgressBar;
