import React from 'react';
import { FiUpload, FiDownload, FiTrash2, FiClock, FiX, FiCheck } from 'react-icons/fi';
import AnimatedProgressBar from './AnimatedProgressBar';
import './ProgressBar.css';

/**
 * Composant centralisé pour les barres de progression
 * @param {Object} props - Props du composant
 * @param {boolean} props.isVisible - Si la barre doit être visible
 * @param {number} props.progress - Pourcentage de progression (0-100)
 * @param {string} props.type - Type d'opération: 'upload', 'download', 'delete', 'extract', 'process'
 * @param {string} props.title - Titre personnalisé (optionnel)
 * @param {string} props.message - Message personnalisé (optionnel)
 * @param {string} props.currentItem - Élément en cours de traitement (optionnel)
 * @param {Object} props.stats - Statistiques {current, total} (optionnel)
 * @param {string} props.error - Message d'erreur (optionnel)
 * @param {boolean} props.completed - Si l'opération est terminée
 * @param {Function} props.onClose - Callback pour fermer la barre
 * @param {boolean} props.showAsModal - Afficher comme modal ou comme barre inline
 */
const ProgressBar = ({
  isVisible,
  progress = 0,
  type = 'process',
  title,
  message,
  currentItem,
  stats,
  error,
  completed = false,
  onClose,
  showAsModal = false
}) => {
  if (!isVisible) return null;

  // Configuration par type d'opération
  const typeConfig = {
    upload: {
      icon: FiUpload,
      defaultTitle: 'Upload en cours...',
      defaultMessage: 'Téléversement de vos fichiers',
      color: 'var(--primary-color)',
      colorName: 'primary',
      completedMessage: '✅ Upload terminé avec succès !'
    },
    download: {
      icon: FiDownload,
      defaultTitle: 'Téléchargement en cours...',
      defaultMessage: 'Préparation du fichier ZIP',
      color: 'var(--success-color)',
      colorName: 'success',
      completedMessage: '✅ Téléchargement terminé ! Le fichier ZIP va se télécharger automatiquement.'
    },
    delete: {
      icon: FiTrash2,
      defaultTitle: 'Suppression en cours...',
      defaultMessage: 'Suppression des éléments sélectionnés',
      color: 'var(--error-color)',
      colorName: 'danger',
      completedMessage: '✅ Suppression terminée avec succès !'
    },
    extract: {
      icon: FiClock,
      defaultTitle: 'Extraction en cours...',
      defaultMessage: 'Extraction des fichiers en cours',
      color: 'var(--warning-color)',
      colorName: 'warning',
      completedMessage: '✅ Extraction terminée avec succès !'
    },
    process: {
      icon: FiClock,
      defaultTitle: 'Traitement en cours...',
      defaultMessage: 'Traitement de votre demande',
      color: 'var(--primary-color)',
      colorName: 'primary',
      completedMessage: '✅ Traitement terminé avec succès !'
    }
  };

  const config = typeConfig[type] || typeConfig.process;
  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  // Contenu de la barre de progression
  const progressContent = (
    <div className="progress-bar-content" data-type={type}>
      {/* En-tête avec icône et titre */}
      <div className="progress-header">
        <div className="progress-icon">
          {error ? <FiX /> : completed ? <FiCheck /> : <IconComponent />}
        </div>
        <h3 className="progress-title">{displayTitle}</h3>
        {onClose && (
          <button onClick={onClose} className="progress-close-btn">
            &times;
          </button>
        )}
      </div>

      {/* Message d'erreur */}
      {error ? (
        <div className="progress-error">
          <p>Erreur: {error}</p>
          {onClose && (
            <button onClick={onClose} className="btn btn-primary">
              Fermer
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Informations de progression */}
          <div className="progress-info">
            <div className="progress-message">
              {currentItem ? `${displayMessage}: ${currentItem}` : displayMessage}
            </div>
            <div className="progress-stats">
              {`${Math.round(progress)}%`}
            </div>
          </div>

          {/* Barre de progression visuelle avec animation améliorée */}
          <AnimatedProgressBar 
            progress={Math.min(progress, 100)}
            color={config.colorName || 'primary'}
            animated={!completed}
            animationDuration={1.5}
          />

          {/* Message d'aide supplémentaire pour les téléchargements ZIP */}
          {type === 'download' && !completed && !error && (
            <div className="progress-hint">
              Le téléchargement du fichier ZIP peut prendre un peu de temps en fonction du nombre et de la taille des éléments sélectionnés.
            </div>
          )}

          {/* Message de completion */}
          {completed && (
            <div className="progress-completed">
              {config.completedMessage}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Rendu conditionnel : modal ou inline
  if (showAsModal) {
    return (
      <div className="progress-modal-overlay">
        <div className="progress-modal">
          {progressContent}
        </div>
      </div>
    );
  }

  return (
    <div className="progress-bar-inline">
      {progressContent}
    </div>
  );
};

export default ProgressBar;
