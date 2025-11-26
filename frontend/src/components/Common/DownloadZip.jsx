import React from 'react';
import { downloadSelectedItemsAsZip } from '../../services/downloadService';
import ProgressBar from './ProgressBar';
import { useProgressBar } from '../../hooks/useProgressBar';

/**
 * Hook personnalisé pour gérer le téléchargement ZIP
 * @returns {Object} - Fonctions et état pour le téléchargement ZIP
 */
const useDownloadZip = () => {
  const progressBar = useProgressBar({ 
    type: 'download',
    maxProgress: 90,
    interval: 300 
  });

  /**
   * Lance le téléchargement ZIP des éléments sélectionnés
   * @param {Array} selectedItems - Liste des éléments à télécharger
   * @param {Function} onSuccess - Callback appelé en cas de succès (optionnel)
   * @param {Function} onError - Callback appelé en cas d'erreur (optionnel)
   */
  const handleDownloadZip = async (selectedItems, onSuccess = null, onError = null, options = {}) => {
    if (!selectedItems || selectedItems.length === 0) {
      const error = 'Aucun élément sélectionné pour le téléchargement';
      progressBar.setProgressError(error);
      if (onError) onError(error);
      return;
    }

    // Calculer la taille totale approximative pour adapter la vitesse
    const totalSize = selectedItems.reduce((acc, item) => acc + (item.size || 1024 * 1024), 0);
    progressBar.startProgress('Préparation du téléchargement...', totalSize);

    try {
      const result = await downloadSelectedItemsAsZip(
        selectedItems,
        (current, total) => {
          progressBar.updateStats(current, total);
          
          // Mettre à jour l'élément en cours si possible
          if (current < selectedItems.length) {
            const currentItem = selectedItems[current];
            progressBar.updateCurrentItem(currentItem?.filename || `Fichier ${current + 1}`);
          }
        }
      , options);

      if (onSuccess) {
        onSuccess(result);
      }

      // Arrêter la progression après un délai
      setTimeout(() => {
        progressBar.stopProgress();
      }, 5000);

    } catch (error) {
      progressBar.setProgressError(error.message);
      if (onError) onError(error.message);
    }
  };

  return {
    isDownloading: progressBar.isActive,
    downloadProgress: progressBar.stats,
    downloadError: progressBar.error,
    smoothProgress: progressBar.progress,
    handleDownloadZip,
    clearError: progressBar.clearError,
    progressBar // Exposer le progressBar complet pour plus de flexibilité
  };
};

/**
 * Composant d'indicateur de progrès pour le téléchargement ZIP
 * Utilise maintenant le composant ProgressBar centralisé
 */
const DownloadProgressIndicator = ({ progressBar, onClose }) => {
  const handleCancel = () => {
    // Arrêter et réinitialiser la progression côté UI
    if (progressBar.stopProgress) {
      progressBar.stopProgress();
    }
    if (progressBar.resetProgress) {
      progressBar.resetProgress();
    }

    // Propager éventuellement la fermeture si un handler externe est fourni
    if (onClose) {
      onClose();
    }
  };

  return (
    <ProgressBar
      isVisible={progressBar.isActive}
      progress={progressBar.progress}
      type={progressBar.type}
      currentItem={progressBar.currentItem}
      stats={progressBar.stats}
      error={progressBar.error}
      completed={progressBar.completed}
      onClose={handleCancel}
      showAsModal={true}
    />
  );
};

export { useDownloadZip, DownloadProgressIndicator };