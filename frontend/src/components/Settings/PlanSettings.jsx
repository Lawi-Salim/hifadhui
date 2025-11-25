import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './SettingsPage.css';

const formatBytesToMo = (bytes) => {
  if (!bytes || bytes <= 0) return '0 Mo';
  const mo = bytes / (1024 * 1024);
  return `${mo.toFixed(0)} Mo`;
};

const PlanSettings = () => {
  const { user } = useAuth();

  const planType = user?.subscription_type === 'premium' ? 'Premium' : 'Free';

  // Valeurs par défaut des plans (doivent rester cohérentes avec uploadQuota.js)
  const defaultQuotas = {
    FREE: {
      maxFilesPerDay: 15,
      maxFileSize: 10 * 1024 * 1024 // 10 Mo (limite technique)
    },
    PREMIUM: {
      maxFilesPerDay: 25,
      maxFileSize: 10 * 1024 * 1024 // 10 Mo (limite technique Cloudinary)
    }
  };

  const basePlan = planType === 'Premium' ? defaultQuotas.PREMIUM : defaultQuotas.FREE;

  const effectiveMaxFilesPerDay = user?.upload_max_files_per_day || basePlan.maxFilesPerDay;
  const effectiveMaxFileSizeBytes = 10 * 1024 * 1024;

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>Plan & quotas</h2>
        <p>Consultez votre plan actuel et vos limites d'upload</p>
      </div>

      <div className="security-options">
        <div className="security-item">
          <div className="security-item-info">
            <h3>Plan actuel</h3>
            <p>Type de plan associé à votre compte</p>
          </div>
          <div>
            <span className="badge badge-primary">{planType}</span>
          </div>
        </div>

        <div className="security-item">
          <div className="security-item-info">
            <h3>Quotas d'upload</h3>
            <p>Limites quotidiennes pour l'upload de fichiers</p>
          </div>
          <div className="plan-quotas">
            <div className="plan-quota-row">
              <span>Nombre d'uploads par jour</span>
              <strong>{effectiveMaxFilesPerDay}</strong>
            </div>
            <div className="plan-quota-row">
              <span>Taille maximale par fichier</span>
              <strong>{formatBytesToMo(effectiveMaxFileSizeBytes)}</strong>
            </div>
          </div>
        </div>

        <div className="security-item">
          <div className="security-item-info">
            <h3>Évolution du plan</h3>
            <p>
              Les fonctionnalités de changement de plan et de paiement seront ajoutées plus tard.
              Pour l'instant, les quotas sont gérés directement par l'administrateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSettings;
