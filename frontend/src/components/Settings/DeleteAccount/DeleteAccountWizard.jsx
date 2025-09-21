import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import Step1Warning from './Step1Warning';
import Step2DataExport from './Step2DataExport';
import Step3Confirmation from './Step3Confirmation';
import Step4Password from './Step4Password';
import AnimatedProgressBar from '../../Common/AnimatedProgressBar';
import './DeleteAccountWizard.css';

const DeleteAccountWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hooks doivent être appelés avant tout return conditionnel
  const { user, logout } = useAuth();
  
  // Extraire le numéro d'étape depuis l'URL
  const getStepFromPath = () => {
    const match = location.pathname.match(/\/step-(\d+)$/);
    const step = match ? parseInt(match[1]) : 1;
    console.log('🔍 [WIZARD] URL:', location.pathname, 'Step:', step);
    return step;
  };
  
  // État global du wizard
  const [wizardData, setWizardData] = useState({
    exportCompleted: false,
    confirmationText: '',
    password: ''
  });

  // Validation des étapes
  const currentStep = getStepFromPath();
  const maxStep = user?.provider === 'google' ? 3 : 4;

  // Redirection si étape invalide
  useEffect(() => {
    if (currentStep < 1 || currentStep > maxStep) {
      navigate('/settings/delete-account/step-1', { replace: true });
    }
  }, [currentStep, maxStep, navigate]);

  // Navigation entre étapes
  const goToStep = (stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= maxStep) {
      navigate(`/settings/delete-account/step-${stepNumber}`);
    }
  };

  const goToNextStep = () => {
    if (currentStep < maxStep) {
      goToStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Annulation - retour aux paramètres
  const handleCancel = () => {
    navigate('/settings');
  };

  // Finalisation de la suppression
  const handleAccountDeleted = () => {
    logout();
    navigate('/');
  };

  // Mise à jour des données du wizard
  const updateWizardData = (newData) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  // Validation des étapes
  const canProceedToStep = (stepNumber) => {
    switch (stepNumber) {
      case 2:
        return true; // Toujours accessible depuis l'étape 1
      case 3:
        return true; // Accessible même sans export
      case 4:
        return wizardData.confirmationText === 'SUPPRIMER';
      default:
        return true;
    }
  };

  // Rendu du composant d'étape actuel
  const renderCurrentStep = () => {
    const commonProps = {
      wizardData,
      updateWizardData,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      onCancel: handleCancel,
      canProceed: canProceedToStep(currentStep + 1),
      user,
      onAccountDeleted: handleAccountDeleted
    };

    switch (currentStep) {
      case 1:
        return <Step1Warning {...commonProps} />;
      case 2:
        return <Step2DataExport {...commonProps} />;
      case 3:
        return <Step3Confirmation {...commonProps} />;
      case 4:
        return (
          <Step4Password 
            {...commonProps} 
            onAccountDeleted={handleAccountDeleted}
          />
        );
      default:
        return <Navigate to="/settings/delete-account/step-1" replace />;
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <div className='my-space-title'>
          <button 
            className="mobile-hamburger-menu"
            onClick={() => {
              const event = new CustomEvent('toggleSidebar');
              window.dispatchEvent(event);
            }}
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>
          <div className="title-content">
            <h1 className="text-2xl font-bold">Suppression du compte</h1>
            <p className="text-secondary">
              Étape {currentStep} sur {maxStep} - {user.provider === 'google' ? 'Compte Google' : 'Compte local'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="btn btn-secondary"
          >
            <FiArrowLeft /> Retour aux paramètres
          </button>
        </div>
      </div>

      {/* Progression */}
      <div className="wizard-progress-section mb-6">
        <div className="step-progress-bar">
          <AnimatedProgressBar 
            progress={(currentStep / maxStep) * 100}
            color="success"
            animated={true}
            animationDuration={4}
          />
          <div className="progress-numbers" data-steps={maxStep}>
            {Array.from({ length: maxStep }, (_, index) => {
              const stepNumber = index + 1;
              return (
                <span 
                  key={stepNumber}
                  className={`step-number ${currentStep >= stepNumber ? 'active' : ''}`}
                >
                  {stepNumber}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu de l'étape actuelle */}
      <div className="wizard-step-content">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default DeleteAccountWizard;
