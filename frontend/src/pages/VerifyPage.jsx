import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUpload, FaSearch, FaCheckCircle, FaTimesCircle, FaSpinner, FaCertificate } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import certificateService from '../services/certificateService';
import './VerifyPage.css';

/**
 * Page publique de vérification d'authenticité des fichiers
 */
const VerifyPage = () => {
  const { hash: urlHash } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('file'); // 'file', 'hash' ou 'productId'
  const [file, setFile] = useState(null);
  const [hashInput, setHashInput] = useState(urlHash || '');
  const PRODUCT_ID_PREFIX = 'HFD-LW-';
  const [productIdInput, setProductIdInput] = useState(PRODUCT_ID_PREFIX);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Si un hash est dans l'URL, vérifier automatiquement
  useEffect(() => {
    if (urlHash) {
      setActiveTab('hash');
      setHashInput(urlHash);
      verifyHash(urlHash);
    }
  }, [urlHash]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleVerifyFile = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      const data = await certificateService.verifyByFile(file);
      setResult(data);

    } catch (err) {
      console.error('Erreur vérification:', err);
      setError('Erreur lors de la vérification du fichier');
    } finally {
      setVerifying(false);
    }
  };

  const verifyHash = async (hash) => {
    if (!hash || hash.length !== 64) {
      setError('Le hash SHA-256 doit contenir exactement 64 caractères hexadécimaux');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      const data = await certificateService.verifyByHash(hash);
      setResult(data);

    } catch (err) {
      console.error('Erreur vérification:', err);
      setError('Erreur lors de la vérification du hash');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyHash = () => {
    verifyHash(hashInput);
  };

  const verifyProductId = async (productId) => {
    if (!productId || productId.trim() === '') {
      setError('Veuillez entrer un Product ID');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      const data = await certificateService.verifyByProductId(productId);
      setResult(data);

    } catch (err) {
      console.error('Erreur vérification:', err);
      setError('Erreur lors de la vérification du Product ID');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyProductId = () => {
    verifyProductId(productIdInput);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy à HH:mm:ss', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  const resetVerification = () => {
    setFile(null);
    setHashInput('');
    setProductIdInput(PRODUCT_ID_PREFIX);
    setResult(null);
    setError(null);
    if (urlHash) {
      navigate('/verify');
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        {/* Header */}
        <div className="verify-header">
          <FaCertificate className="verify-header-icon" />
          <h1 className="verify-title">Vérification d'Authenticité</h1>
          <p className="verify-subtitle">
            Vérifiez qu'un fichier a bien été déposé sur Hifadhui et n'a pas été modifié
          </p>
        </div>

        {/* Tabs */}
        <div className="verify-tabs">
          <button
            className={`verify-tab ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <FaUpload /> Vérifier par fichier
          </button>
          <button
            className={`verify-tab ${activeTab === 'hash' ? 'active' : ''}`}
            onClick={() => setActiveTab('hash')}
          >
            <FaSearch /> Vérifier par hash
          </button>
          <button
            className={`verify-tab ${activeTab === 'productId' ? 'active' : ''}`}
            onClick={() => setActiveTab('productId')}
          >
            <FaSearch /> Vérifier par Product ID
          </button>
        </div>

        {/* Content */}
        <div className="verify-content">
          {activeTab === 'file' ? (
            <div className="verify-method">
              <h3 className="verify-method-title">Uploader votre fichier</h3>
              <p className="verify-method-description">
                Sélectionnez le fichier que vous souhaitez vérifier. Nous calculerons son empreinte
                cryptographique et la comparerons à notre base de données.
              </p>

              <div className="verify-upload-zone">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="verify-upload-label">
                  <FaUpload className="verify-upload-icon" />
                  <span className="verify-upload-text">
                    {file ? file.name : 'Cliquez pour sélectionner un fichier'}
                  </span>
                  {file && (
                    <span className="verify-upload-size">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                </label>
              </div>

              <button
                className="verify-submit-btn"
                onClick={handleVerifyFile}
                disabled={!file || verifying}
              >
                {verifying ? (
                  <>
                    <FaSpinner className="spinning" /> Vérification en cours...
                  </>
                ) : (
                  <>
                    <FaSearch /> Vérifier le fichier
                  </>
                )}
              </button>
            </div>
          ) : activeTab === 'hash' ? (
            <div className="verify-method">
              <h3 className="verify-method-title">Entrer le hash SHA-256</h3>
              <p className="verify-method-description">
                Saisissez l'empreinte cryptographique (hash) du fichier que vous souhaitez vérifier.
              </p>

              <input
                type="text"
                className="verify-hash-input"
                placeholder="Ex: a1b2c3d4e5f6..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value.toLowerCase())}
                maxLength={64}
              />

              <button
                className="verify-submit-btn"
                onClick={handleVerifyHash}
                disabled={!hashInput || hashInput.length !== 64 || verifying}
              >
                {verifying ? (
                  <>
                    <FaSpinner className="spinning" /> Vérification en cours...
                  </>
                ) : (
                  <>
                    <FaSearch /> Vérifier le hash
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="verify-method">
              <h3 className="verify-method-title">Entrer le Product ID</h3>
              <p className="verify-method-description">
                Saisissez le Product ID de l'empreinte (format: HFD-LW-XXXXXX-YYYYYY).
              </p>

              <input
                type="text"
                className="verify-hash-input"
                placeholder="Ex: HFD-LW-000001-ABC123"
                value={productIdInput}
                onChange={(e) => {
                  const raw = e.target.value.toUpperCase();
                  // Extraire la partie après le préfixe et ne garder que les chiffres
                  let digits = raw.replace(/^HFD-LW-?/, '').replace(/[^0-9]/g, '');

                  // Limiter à 12 chiffres (6 séquentiel + 6 aléatoire)
                  if (digits.length > 12) {
                    digits = digits.slice(0, 12);
                  }

                  // Insérer automatiquement le tiret après les 6 premiers chiffres
                  let formattedSuffix;
                  if (digits.length <= 6) {
                    formattedSuffix = digits;
                  } else {
                    formattedSuffix = digits.slice(0, 6) + '-' + digits.slice(6);
                  }

                  setProductIdInput(PRODUCT_ID_PREFIX + formattedSuffix);
                }}
              />

              <button
                className="verify-submit-btn"
                onClick={handleVerifyProductId}
                disabled={
                  // Actif seulement quand les 12 chiffres du suffixe sont saisis
                  productIdInput.replace(/^HFD-LW-?/, '').replace(/-/g, '').length !== 12 || verifying
                }
              >
                {verifying ? (
                  <>
                    <FaSpinner className="spinning" /> Vérification en cours...
                  </>
                ) : (
                  <>
                    <FaSearch /> Vérifier le Product ID
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="verify-error">
              <FaTimesCircle /> {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`verify-result ${result.verified ? 'verified' : 'not-verified'}`}>
              <div className="verify-result-header">
                {result.verified ? (
                  <>
                    <FaCheckCircle className="verify-result-icon success" />
                    <h3 className="verify-result-title">Fichier Authentique ✓</h3>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="verify-result-icon error" />
                    <h3 className="verify-result-title">Fichier Non Trouvé</h3>
                  </>
                )}
              </div>

              {result.verified ? (
                <div className="verify-result-details">
                  <div className="verify-result-item">
                    <span className="verify-result-label">Date de dépôt</span>
                    <span className="verify-result-value">{formatDate(result.uploadDate)}</span>
                  </div>

                  {result.filename && result.filename !== '****** (confidentiel)' && (
                    <>
                      <div className="verify-result-item">
                        <span className="verify-result-label">Nom du fichier</span>
                        <span className="verify-result-value">{result.filename}</span>
                      </div>

                      {result.size && (
                        <div className="verify-result-item">
                          <span className="verify-result-label">Taille</span>
                          <span className="verify-result-value">{formatFileSize(result.size)}</span>
                        </div>
                      )}

                      {result.mimetype && (
                        <div className="verify-result-item">
                          <span className="verify-result-label">Type</span>
                          <span className="verify-result-value">{result.mimetype}</span>
                        </div>
                      )}

                      {result.owner && (
                        <div className="verify-result-item">
                          <span className="verify-result-label">Propriétaire</span>
                          <span className="verify-result-value">{result.owner.name}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="verify-result-item">
                    <span className="verify-result-label">Hash SHA-256</span>
                    <span className="verify-result-value mono">{result.hash}</span>
                  </div>

                  {result.message && (
                    <div className="verify-result-message">
                      ℹ️ {result.message}
                    </div>
                  )}
                </div>
              ) : (
                <div className="verify-result-message">
                  {result.message || 'Ce fichier n\'a pas été trouvé dans notre base de données.'}
                </div>
              )}

              <button className="verify-reset-btn" onClick={resetVerification}>
                Nouvelle vérification
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="verify-info">
          <h4>Comment ça fonctionne ?</h4>
          <ul>
            <li>Chaque fichier déposé sur Hifadhui possède une empreinte cryptographique unique (hash SHA-256)</li>
            <li>Cette empreinte change complètement si le fichier est modifié, même d'un seul bit</li>
            <li>En vérifiant un fichier, vous pouvez prouver qu'il existait à une date précise et qu'il n'a pas été altéré</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
