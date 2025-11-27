import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal';
import { useAuth } from '../../contexts/AuthContext';
import { generateLicenseForSelection } from '../../services/licenseService';
import './LicenseDownloadModal.css';

const LicenseDownloadModal = ({
  isOpen,
  onClose,
  selectedItems = [],
  onConfirm
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [includeLicense, setIncludeLicense] = useState(true);
  const [includeTxt, setIncludeTxt] = useState(true);
  const [licenseText, setLicenseText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const creatorName = user?.username
        ? `${user.username}`
        : 'Hifadhui';

      const { txtContent } = generateLicenseForSelection(selectedItems || [], {}, { creatorName });
      const initialText = txtContent || '';
      setLicenseText(initialText);
    } catch (e) {
      console.error('[LicenseDownloadModal] Erreur génération licence initiale', e);
      setLicenseText('');
      setError("Erreur lors de la génération automatique de la licence. Vous pouvez saisir un texte manuellement.");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, selectedItems]);

  const getSelectedCount = () => {
    return Array.isArray(selectedItems) ? selectedItems.length : 0;
  };

  const handleToggleTxt = () => {
    setIncludeTxt(!includeTxt);
  };

  const handleSubmit = () => {
    setError('');

    if (!includeLicense) {
      onConfirm?.({ includeLicense: false, includeTxt: false, includeMd: false, licenseText: '' });
      onClose();
      return;
    }

    if (includeLicense && !includeTxt) {
      setError('Vous devez sélectionner l\'extension .txt pour inclure la licence.');
      return;
    }

    const text = licenseText || '';

    onConfirm?.({
      includeLicense: true,
      includeTxt,
      licenseText: text
    });

    onClose();
  };

  const selectedCount = getSelectedCount();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="license-download-modal">
      <div className="modal-header">
        <h2>Préparer le téléchargement</h2>
      </div>

      <div className="modal-body modal-body-layout">
        <div className="license-top-row">
          <div className="license-info">
            <p className="text-secondary selected-count">
              {selectedCount === 1
                ? '1 fichier sélectionné'
                : `${selectedCount} fichiers sélectionnés`}
            </p>

            <label className="checkbox-inline license-included">
              <input
                type="checkbox"
                checked={includeLicense}
                onChange={(e) => setIncludeLicense(e.target.checked)}
              />
              <span>Licence incluse</span>
            </label>
          </div>

          <div className="license-extensions">
            <p className="extensions-title">Extension</p>
            <div className="license-extensions-options">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={includeTxt}
                  onChange={handleToggleTxt}
                  disabled={!includeLicense}
                />
                <span> .txt</span>
              </label>
            </div>
          </div>
        </div>

        <div className="license-text-block">
          <div className="form-group license-text-group">
            <div className="license-text-label-row">
              <label className="form-label license-text-label">
                Texte de la licence
              </label>
            </div>
            <textarea
              value={licenseText}
              rows={16}
              className="license-textarea"
              readOnly
              disabled={isLoading || !includeLicense}
            />
          </div>

          {includeLicense && error && (
            <p className="text-danger license-error">{error}</p>
          )}
        </div>
      </div>

      <div className="modal-actions modal-actions-bar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          Annuler
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          Télécharger
        </button>
      </div>
    </Modal>
  );
};

LicenseDownloadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedItems: PropTypes.array,
  onConfirm: PropTypes.func
};

export default LicenseDownloadModal;
