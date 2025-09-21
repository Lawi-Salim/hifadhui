import React, { useState } from 'react';
import { FiDownload, FiCheck, FiSkipForward } from 'react-icons/fi';
import { useProgressBar } from '../../../hooks/useProgressBar';
import ProgressBar from '../../Common/ProgressBar';
import api from '../../../services/api';
import downloadService from '../../../services/downloadService';

const Step2DataExport = ({ wizardData, updateWizardData, onNext, onPrevious, onCancel }) => {
  const [error, setError] = useState(null);
  
  const exportProgressBar = useProgressBar({ 
    type: 'export',
    maxProgress: 95,
    interval: 200 
  });

  const handleExportData = async () => {
    try {
      setError(null);
      exportProgressBar.startProgress();
      
      // Récupérer les données utilisateur depuis l'API
      const response = await api.get('/auth/export-data');
      const { files } = response.data.data;
      
      console.log('📦 Données récupérées pour export:', { files: files.length });
      
      // Lancer l'export avec la barre de progression
      await downloadService.exportUserData(
        files, 
        (progress) => {
          exportProgressBar.setProgress(progress.progress);
          exportProgressBar.updateCurrentItem(progress.currentItem);
        }
      );
      
      exportProgressBar.completeProgress();
      updateWizardData({ exportCompleted: true });
      
      // Attendre un peu pour montrer le succès
      setTimeout(() => {
        exportProgressBar.resetProgress();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      setError(`Erreur lors de l'export des données: ${error.message}`);
      exportProgressBar.resetProgress();
    }
  };

  const handleSkipExport = () => {
    updateWizardData({ exportCompleted: false });
    onNext();
  };

  return (
    <div className="wizard-step step-export">
      <div className="step-header">
        <FiDownload className="step-icon primary" />
        <h2>Sauvegarder vos données</h2>
        <p className="step-subtitle">
          Téléchargez une copie de toutes vos données avant la suppression définitive.
        </p>
      </div>

      <div className="export-content">
        {!wizardData.exportCompleted ? (
          <>
            <div className="export-info">
              <h3>📦 Contenu de l'export</h3>
              <div className="export-items">
                <div className="export-item">
                  <div className="export-item-icon">🖼️</div>
                  <div className="export-item-details">
                    <strong>Images</strong>
                    <span>Toutes vos images uploadées</span>
                  </div>
                </div>
                <div className="export-item">
                  <div className="export-item-icon">📄</div>
                  <div className="export-item-details">
                    <strong>Documents PDF</strong>
                    <span>Tous vos documents PDF</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="export-format">
              <h4>Format de l'export</h4>
              <p>
                Vos données seront organisées dans un fichier ZIP nommé <code style={{ marginRight: '5px' }}>Hifadhui-data.zip</code> 
                avec une structure claire par type de fichier.
              </p>
            </div>

            {error && (
              <div className="error-message">
                <strong>Erreur :</strong> {error}
              </div>
            )}

            {exportProgressBar.isActive && (
              <div className="export-progress">
                <ProgressBar
                  isVisible={true}
                  progress={exportProgressBar.progress}
                  type={exportProgressBar.type}
                  currentItem={exportProgressBar.currentItem}
                  stats={exportProgressBar.stats}
                  error={exportProgressBar.error}
                  completed={exportProgressBar.completed}
                  showAsModal={false}
                />
              </div>
            )}
          </>
        ) : (
          <div className="export-success">
            <FiCheck className="success-icon" />
            <h3>Export terminé avec succès !</h3>
            <p>
              Vos données ont été téléchargées. Vous pouvez maintenant procéder 
              à la suppression de votre compte en toute sécurité.
            </p>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button 
          onClick={onPrevious}
          className="btn btn-secondary"
          disabled={exportProgressBar.isActive}
        >
          Précédent
        </button>
        
        <div className="primary-actions">
          {!wizardData.exportCompleted ? (
            <>
              <button 
                onClick={handleExportData}
                className="btn btn-primary"
                disabled={exportProgressBar.isActive}
              >
                <FiDownload style={{ marginRight: '0.5rem' }} />
                {exportProgressBar.isActive ? 'Export en cours...' : 'Télécharger mes données'}
              </button>
              <button 
                onClick={handleSkipExport}
                className="btn btn-danger"
                disabled={exportProgressBar.isActive}
              >
                <FiSkipForward style={{ marginRight: '0.5rem' }} />
                Continuer sans exporter
              </button>
            </>
          ) : (
            <button 
              onClick={onNext}
              className="btn btn-danger"
            >
              Continuer vers la confirmation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2DataExport;
