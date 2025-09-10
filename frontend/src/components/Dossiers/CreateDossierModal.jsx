import React, { useState } from 'react';
import Modal from '../Modal';
import dossierService from '../../services/dossierService';
import { createSlug } from '../../utils/textUtils';

const CreateDossierModal = ({ isOpen, onClose, onDossierCreated, parentId = null }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Le nom du dossier ne peut pas être vide.');
      return;
    }
    
    if (!validateName(trimmedName)) {
      setError('Le nom du dossier ne peut pas être vide.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await dossierService.createDossier({ name: trimmedName, parent_id: parentId });
      onDossierCreated(response.data);
      setName('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un nouveau dossier" className="create-modal-content">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="dossierName" className="form-label">Nom du dossier</label>
          <input
            type="text"
            id="dossierName"
            value={name}
            onChange={(e) => {
              const sanitized = sanitizeName(e.target.value);
              setName(sanitized);
              // Effacer l'erreur si le nom devient valide
              if (validateName(sanitized)) {
                setError('');
              }
            }}
            className="form-input"
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDossierModal;
