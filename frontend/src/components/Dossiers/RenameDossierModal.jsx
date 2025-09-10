import React, { useState, useEffect } from 'react';
import dossierService from '../../services/dossierService';

const RenameDossierModal = ({ isOpen, onClose, dossier, onDossierRenamed }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonction pour valider et nettoyer le nom du dossier
  const sanitizeName = (name) => {
    // Permettre la saisie avec accents, la transformation se fera côté serveur
    return name.trim();
  };

  // Fonction pour valider le nom
  const validateName = (name) => {
    // Permettre tous les caractères, la validation se fera côté serveur
    return name.trim().length > 0;
  };

  useEffect(() => {
    if (dossier) {
      setNewName(dossier.name_original || dossier.name);
    }
  }, [dossier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    
    if (!validateName(trimmedName)) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await dossierService.renameDossier(dossier.id, trimmedName);
      onDossierRenamed(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay rename-modal" onClick={onClose}>
      <div className="modal-content rename-modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button">
          &times;
        </button>
        <form onSubmit={handleSubmit}>
          <h2>Renommer le dossier</h2>
          <div className="form-group">
            <label htmlFor="dossierName">Nouveau nom</label>
            <input
              id="dossierName"
              type="text"
              className="form-control"
              value={newName}
              onChange={(e) => {
                const sanitized = sanitizeName(e.target.value);
                setNewName(sanitized);
                // Effacer l'erreur si le nom devient valide
                if (validateName(sanitized)) {
                  setError('');
                }
              }}
              placeholder="Entrez le nouveau nom"
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameDossierModal;
