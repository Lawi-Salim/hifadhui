import React from 'react';
import { FiAlertTriangle, FiDownload, FiCheck, FiLock } from 'react-icons/fi';

const DeleteAccountProgress = ({ currentStep, totalSteps, userProvider }) => {
  const getStepInfo = (stepNumber) => {
    const steps = {
      1: {
        title: 'Avertissement',
        icon: FiAlertTriangle,
        description: 'Informations importantes'
      },
      2: {
        title: 'Sauvegarde',
        icon: FiDownload,
        description: 'Export des données'
      },
      3: {
        title: 'Confirmation',
        icon: FiCheck,
        description: 'Confirmation requise'
      },
      4: {
        title: 'Authentification',
        icon: FiLock,
        description: 'Mot de passe requis'
      }
    };

    return steps[stepNumber];
  };

  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  const renderStep = (stepNumber) => {
    // Ne pas afficher l'étape 4 pour les comptes Google
    if (stepNumber === 4 && userProvider === 'google') {
      return null;
    }

    const stepInfo = getStepInfo(stepNumber);
    const status = getStepStatus(stepNumber);
    const IconComponent = stepInfo.icon;

    return (
      <div key={stepNumber} className={`progress-step ${status}`}>
        <div className="step-indicator">
          <div className="step-number">
            {status === 'completed' ? (
              <FiCheck className="step-icon completed" />
            ) : (
              <IconComponent className="step-icon" />
            )}
          </div>
          <div className="step-info">
            <div className="step-title">{stepInfo.title}</div>
            <div className="step-description">{stepInfo.description}</div>
          </div>
        </div>
        
        {/* Ligne de connexion vers l'étape suivante */}
        {stepNumber < totalSteps && (
          <div className={`step-connector ${status === 'completed' ? 'completed' : ''}`} />
        )}
      </div>
    );
  };

  return (
    <div className="delete-account-progress">
      <div className="progress-header">
        <span className="progress-text">
          Étape {currentStep} sur {totalSteps}
        </span>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="progress-steps">
        {Array.from({ length: totalSteps }, (_, i) => renderStep(i + 1))}
      </div>
    </div>
  );
};

export default DeleteAccountProgress;
