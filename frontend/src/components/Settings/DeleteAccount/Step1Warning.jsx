import React from 'react';
import { FiAlertTriangle, FiTrash2, FiDatabase, FiShare2 } from 'react-icons/fi';

const Step1Warning = ({ onNext, onCancel }) => {
  return (
    <div className="wizard-step step-warning">
      <div className="step-header">
        <FiAlertTriangle className="step-icon warning" />
        <h2>Attention : Suppression définitive du compte</h2>
        <p className="step-subtitle">
          Cette action est <strong>irréversible</strong>. Veuillez lire attentivement les informations ci-dessous.
        </p>
      </div>

      <div className="warning-content">
        <div className="warning-section">
          <div className="warning-item">
            <FiTrash2 className="warning-item-icon danger" />
            <div className="warning-item-content">
              <h3>Suppression complète des données</h3>
              <p>
                Tous vos fichiers, documents et métadonnées seront 
                <strong> définitivement supprimés</strong> de nos serveurs.
              </p>
            </div>
          </div>

          <div className="warning-item">
            <FiDatabase className="warning-item-icon danger" />
            <div className="warning-item-content">
              <h3>Perte d'accès immédiate</h3>
              <p>
                Votre compte sera immédiatement désactivé et vous ne pourrez plus 
                accéder à vos données ou services.
              </p>
            </div>
          </div>

          <div className="warning-item">
            <FiShare2 className="warning-item-icon danger" />
            <div className="warning-item-content">
              <h3>Liens de partage invalidés</h3>
              <p>
                Tous les liens de partage que vous avez créés cesseront de fonctionner 
                immédiatement.
              </p>
            </div>
          </div>
        </div>

        <div className="recommendation-box">
          <h3>📦 Nous recommandons fortement</h3>
          <p>
            Avant de supprimer votre compte, <strong>exportez vos données</strong> à l'étape suivante. 
            Vous recevrez un fichier ZIP contenant tous vos fichiers organisés par catégorie.
          </p>
        </div>

        <div className="legal-notice">
          <h4>Informations légales</h4>
          <ul>
            <li>La suppression sera effective sous 24-48 heures</li>
            <li>Certaines données peuvent être conservées pour des raisons légales (logs, factures)</li>
            <li>Cette action respecte votre droit à l'effacement (RGPD)</li>
          </ul>
        </div>
      </div>

      <div className="step-actions">
        <button 
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Annuler
        </button>
        <button 
          onClick={onNext}
          className="btn btn-danger"
        >
          Je comprends, continuer
        </button>
      </div>
    </div>
  );
};

export default Step1Warning;
