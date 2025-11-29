import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FiCopy } from 'react-icons/fi';
import Modal from '../Modal';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { DEFAULT_MD_TEMPLATE, generateLicenseForSelection } from '../../services/licenseService';
import ToastContainer from './ToastContainer';
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
  const [toasts, setToasts] = useState([]);

  // Synchroniser l'extension .txt avec l'état "Licence incluse"
  useEffect(() => {
    if (includeLicense) {
      setIncludeTxt(true);
    } else {
      setIncludeTxt(false);
    }
  }, [includeLicense]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    const loadLicense = async () => {
      setError('');
      setIsLoading(true);

      try {
        const creatorName = user?.username ? `${user.username}` : 'Hifadhui';

        let effectiveTemplate = DEFAULT_MD_TEMPLATE;
        try {
          const response = await api.get('/auth/license-template');
          const data = response.data && response.data.data ? response.data.data : {};
          const valueFromApi = data.md || data.txt || '';
          if (valueFromApi) {
            effectiveTemplate = valueFromApi;
          }
        } catch (templateError) {
          console.error('[LicenseDownloadModal] Erreur chargement template de licence, utilisation du template par défaut', templateError);
        }

        const { txtContent } = generateLicenseForSelection(
          selectedItems || [],
          { txtTemplate: effectiveTemplate },
          { creatorName }
        );

        if (!isCancelled) {
          const initialText = txtContent || '';
          setLicenseText(initialText);
        }
      } catch (e) {
        console.error('[LicenseDownloadModal] Erreur génération licence initiale', e);
        if (!isCancelled) {
          setLicenseText('');
          setError("Erreur lors de la génération automatique de la licence. Vous pouvez saisir un texte manuellement.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLicense();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedItems, user]);

  const getSelectedCount = () => {
    return Array.isArray(selectedItems) ? selectedItems.length : 0;
  };

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleCopyLicense = async () => {
    if (!licenseText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(licenseText);
      addToast('Texte copié !', 'success', 2500);
    } catch (e) {
      console.error('[LicenseDownloadModal] Erreur lors de la copie du texte de licence', e);
      addToast('Impossible de copier le texte.', 'error', 3000);
    }
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
                  checked={includeLicense}
                  readOnly
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
              <p
                className={`license-copy-text ${
                  isLoading || !includeLicense || !licenseText ? 'license-copy-text--disabled' : ''
                }`}
                onClick={
                  isLoading || !includeLicense || !licenseText
                    ? undefined
                    : handleCopyLicense
                }
              >
                <FiCopy style={{ marginRight: 6 }} />
                Copier la licence
              </p>
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
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
