import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiUpload, FiClock, FiLock, FiEdit3, FiFileText, FiMenu } from 'react-icons/fi';
import { FaFileImage, FaFilePdf, FaFileAlt, FaCheck } from 'react-icons/fa';
import ProgressBar from '../Common/ProgressBar';
import { useProgressBar } from '../../hooks/useProgressBar';
import './FileList.css';

const FileUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const [batchFiles, setBatchFiles] = useState([]);

  // Hook centralisé pour la progression globale (upload + extraction)
  const globalProgressBar = useProgressBar({ 
    type: 'upload',
    maxProgress: 90,
    interval: 300 
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const isPremium = user?.subscription_type === 'premium';
    const maxPerBatch = isPremium ? 5 : 1;

    if (files.length > maxPerBatch) {
      setMessage({
        type: 'warning',
        text: isPremium
          ? `Avec le plan Premium, vous pouvez uploader jusqu'à ${maxPerBatch} fichiers à la fois. Seuls les ${maxPerBatch} premiers seront pris en compte.`
          : `Avec le plan Free, vous ne pouvez uploader qu'un fichier à la fois. Seul le premier fichier sera pris en compte.`
      });
    }

    const filesToUpload = files.slice(0, maxPerBatch);

    if (isPremium) {
      setBatchFiles(filesToUpload.map(f => ({
        name: f.name,
        type: f.type,
        status: 'pending'
      })));
    } else {
      setBatchFiles([]);
    }

    for (let index = 0; index < filesToUpload.length; index++) {
      const file = filesToUpload[index];

      if (isPremium) {
        setBatchFiles(prev => prev.map((item, i) => (
          i === index ? { ...item, status: 'uploading' } : item
        )));
      }

      // Traiter chaque fichier séquentiellement pour réutiliser toute la logique existante
      // (quotas, limites techniques, flows Cloudinary/ZIP, etc.)
      // eslint-disable-next-line no-await-in-loop
      await handleFile(file);

      if (isPremium) {
        setBatchFiles(prev => prev.map((item, i) => (
          i === index ? { ...item, status: 'done' } : item
        )));
      }
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const files = Array.from(e.target.files);
    const isPremium = user?.subscription_type === 'premium';
    const maxPerBatch = isPremium ? 5 : 1;

    if (files.length > maxPerBatch) {
      setMessage({
        type: 'warning',
        text: isPremium
          ? `Avec le plan Premium, vous pouvez uploader jusqu'à ${maxPerBatch} fichiers à la fois. Seuls les ${maxPerBatch} premiers seront pris en compte.`
          : `Avec le plan Free, vous ne pouvez uploader qu'un fichier à la fois. Seul le premier fichier sera pris en compte.`
      });
    }

    const filesToUpload = files.slice(0, maxPerBatch);

    if (isPremium) {
      setBatchFiles(filesToUpload.map(f => ({
        name: f.name,
        type: f.type,
        status: 'pending'
      })));
    } else {
      setBatchFiles([]);
    }

    for (let index = 0; index < filesToUpload.length; index++) {
      const file = filesToUpload[index];

      if (isPremium) {
        setBatchFiles(prev => prev.map((item, i) => (
          i === index ? { ...item, status: 'uploading' } : item
        )));
      }

      // Traitement séquentiel pour conserver la logique actuelle de handleFile
      // eslint-disable-next-line no-await-in-loop
      await handleFile(file);

      if (isPremium) {
        setBatchFiles(prev => prev.map((item, i) => (
          i === index ? { ...item, status: 'done' } : item
        )));
      }
    }
  };

  const handleFile = async (file) => {
    // Vérifications (limite technique max, les plans free/premium sont gérés côté serveur)
    const maxSize = 10 * 1024 * 1024; // 10 Mo (limite technique Cloudinary)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ];
    const SMALL_LIMIT = 4 * 1024 * 1024; // ~4MB: au-delà, utiliser l'upload direct Cloudinary pour les fichiers non ZIP

    if (file.size > maxSize) {
      setMessage({
        type: 'error',
        text: 'Le fichier est trop volumineux. Taille maximale technique: 10 Mo'
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, SVG, PDF, ZIP'
      });
      return;
    }

    globalProgressBar.startProgress('Upload en cours...', file.size);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('document', file);

    // Déclarer les variables au niveau supérieur pour être accessibles dans catch
    let extractionInterval;
    let realFiles = [];

    try {
      // Choisir la route selon le type de fichier
      const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
      const ZIP_DIRECT_THRESHOLD = 4 * 1024 * 1024; // ~4MB: au-delà, utiliser le flux zip-cloudinary
      const ZIP_CLOUDINARY_MAX = 10 * 1024 * 1024; // Limite pratique pour le flux ZIP Cloudinary (plan Cloudinary 10 Mo)
      
      if (isZip) {
        // Gros ZIP : upload direct vers Cloudinary puis traitement côté backend
        if (file.size > ZIP_DIRECT_THRESHOLD) {

          // Protection : ne pas envoyer à Cloudinary un ZIP supérieur à la limite pratique
          if (file.size > ZIP_CLOUDINARY_MAX) {
            setMessage({
              type: 'error',
              text: 'Fichier ZIP trop volumineux pour ce mode d\'upload. Taille maximale: 20 Mo.'
            });
            globalProgressBar.resetProgress();
            return;
          }
          try {
            globalProgressBar.updateCurrentItem('Upload du ZIP vers Cloudinary...');

            // Étape 1 : préparation des paramètres d'upload Cloudinary
            const prepareZipResponse = await api.post('/files/zip-cloudinary', {
              step: 'prepare',
              filename: file.name,
              mimetype: file.type,
              size: file.size
            });

            const {
              cloudName,
              apiKey,
              timestamp,
              signature,
              folder,
              public_id,
              resource_type
            } = prepareZipResponse.data || {};

            if (!cloudName || !apiKey || !timestamp || !signature || !folder || !public_id || !resource_type) {
              throw new Error('Paramètres Cloudinary incomplets pour l\'upload direct du ZIP');
            }

            const cloudFormData = new FormData();
            cloudFormData.append('file', file);
            cloudFormData.append('api_key', apiKey);
            cloudFormData.append('timestamp', timestamp);
            cloudFormData.append('signature', signature);
            cloudFormData.append('folder', folder);
            cloudFormData.append('public_id', public_id);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resource_type}/upload`;

            const cloudinaryResponse = await axios.post(cloudinaryUrl, cloudFormData, {
              timeout: 120000
            });

            const { secure_url, bytes, original_filename } = cloudinaryResponse.data || {};

            if (!secure_url || bytes === undefined) {
              throw new Error('Réponse Cloudinary incomplète après upload direct du ZIP');
            }

            globalProgressBar.updateCurrentItem('Traitement du ZIP en cours...');

            // Timeout dynamique basé sur la taille du ZIP :
            // - minimum 60s
            // - +15s par Mo
            // - maximum 5 minutes
            const sizeInMB = file.size / (1024 * 1024);
            const baseTimeout = 60000; // 60s
            const perMBTimeout = 15000; // 15s par Mo
            const maxTimeout = 300000; // 5 minutes
            const zipProcessTimeout = Math.min(
              maxTimeout,
              baseTimeout + Math.round(sizeInMB) * perMBTimeout
            );

            const response = await api.post('/files/zip-cloudinary', {
              step: 'process',
              secure_url,
              bytes,
              originalname: original_filename || file.name
            }, {
              timeout: zipProcessTimeout
            });

            globalProgressBar.completeProgress();

            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            
            if (response.status < 200 || response.status >= 300) {
              console.warn('Statut de réponse inattendu:', response.status);
              setMessage({
                type: 'warning',
                text: `Upload terminé avec le statut ${response.status}`
              });
            }

            return;
          } catch (zipCloudinaryError) {
            console.error('Erreur upload ZIP direct Cloudinary:', zipCloudinaryError);

            // Cas particulier : timeout côté client alors que le serveur peut continuer le traitement
            if (zipCloudinaryError.code === 'ECONNABORTED') {
              setMessage({
                type: 'warning',
                text: 'Le traitement du ZIP prend plus de temps que prévu. Patientez quelques instants puis rafraîchissez vos dossiers pour vérifier que les fichiers ont bien été créés.'
              });
            } else {
              setMessage({
                type: 'error',
                text: 'Erreur lors de l\'upload du fichier ZIP (flux direct Cloudinary)'
              });
            }

            globalProgressBar.resetProgress();
            return;
          }
        }

        // ZIP petit : utiliser le flux existant (preview + upload-zip)
        try {
          const previewFormData = new FormData();
          previewFormData.append('document', file);
          
          const previewResponse = await api.post('/files/zip-preview', previewFormData, {
            timeout: 30000
          });
          
          realFiles = previewResponse.data.files.map(f => f.name);
          
          if (realFiles.length === 0) {
            throw new Error('Aucun fichier supporté trouvé dans l\'archive');
          }
          
        } catch (previewError) {
          console.error('Erreur preview ZIP:', previewError);
          setMessage({
            type: 'error',
            text: 'Erreur lors de l\'analyse du fichier ZIP'
          });
          return;
        }
        
        // Passer en mode extraction avec les vrais fichiers
        globalProgressBar.updateCurrentItem('Extraction en cours...');
        globalProgressBar.updateStats(0, realFiles.length);
        
        let fileIndex = 0;
        extractionInterval = setInterval(() => {
          if (fileIndex < realFiles.length) {
            globalProgressBar.updateCurrentItem(`Extraction: ${realFiles[fileIndex]}`);
            globalProgressBar.updateStats(fileIndex + 1, realFiles.length);
            fileIndex++;
          }
        }, 500);

        const response = await api.post('/files/upload-zip', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 90000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.loaded === progressEvent.total) {
              globalProgressBar.updateCurrentItem('Traitement et extraction en cours...');
            }
          }
        });

        if (extractionInterval) {
          clearInterval(extractionInterval);
        }
        globalProgressBar.completeProgress();

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        if (response.status < 200 || response.status >= 300) {
          console.warn('Statut de réponse inattendu:', response.status);
          setMessage({
            type: 'warning',
            text: `Upload terminé avec le statut ${response.status}`
          });
        }

        return;
      }

      let response;

      const isSmallFile = file.size <= SMALL_LIMIT;

      if (isSmallFile) {
        response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 90000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.loaded === progressEvent.total) {
              globalProgressBar.updateCurrentItem('Finalisation...');
            }
          }
        });
      } else {
        const prepareResponse = await api.post('/files/upload-cloudinary', {
          step: 'prepare',
          filename: file.name,
          mimetype: file.type,
          size: file.size,
          dossier_id: null
        });

        const {
          cloudName,
          apiKey,
          timestamp,
          signature,
          folder,
          public_id,
          resource_type
        } = prepareResponse.data || {};

        if (!cloudName || !apiKey || !timestamp || !signature || !folder || !public_id || !resource_type) {
          throw new Error('Paramètres Cloudinary incomplets pour l\'upload direct');
        }

        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        cloudFormData.append('api_key', apiKey);
        cloudFormData.append('timestamp', timestamp);
        cloudFormData.append('signature', signature);
        cloudFormData.append('folder', folder);
        cloudFormData.append('public_id', public_id);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resource_type}/upload`;

        const cloudinaryResponse = await axios.post(cloudinaryUrl, cloudFormData, {
          timeout: 120000
        });

        const { secure_url, bytes, original_filename } = cloudinaryResponse.data || {};

        if (!secure_url || bytes === undefined) {
          throw new Error('Réponse Cloudinary incomplète après upload direct');
        }

        response = await api.post('/files/upload-cloudinary', {
          step: 'register',
          secure_url,
          bytes,
          mimetype: file.type,
          dossier_id: null,
          originalname: original_filename || file.name
        });
      }

      // Compléter la progression
      if (extractionInterval) {
        clearInterval(extractionInterval);
      }
      globalProgressBar.completeProgress();

      // Vérifier si la réponse indique un succès réel (logs pour debug)
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Ne pas afficher de message ici car le hook useProgressBar gère déjà le message de succès
      // Le message "Upload terminé avec succès !" du hook est suffisant
      
      if (response.status < 200 || response.status >= 300) {
        // Afficher seulement en cas d'erreur/statut inattendu
        console.warn('Statut de réponse inattendu:', response.status);
        setMessage({
          type: 'warning',
          text: `Upload terminé avec le statut ${response.status}`
        });
      }

    } catch (error) {
      console.error('Erreur upload:', error);
      
      // Nettoyer les intervalles en cas d'erreur
      if (extractionInterval) {
        clearInterval(extractionInterval);
      }
      
      // Vérifier si c'est une erreur de quota (429)
      if (error.response?.status === 429 && error.response?.data?.code === 'QUOTA_EXCEEDED') {
        setMessage({
          type: 'error',
          text: error.response.data.error
        });
        return;
      }
      
      // Diagnostic détaillé des autres erreurs
      let errorMessage = 'Erreur lors de l\'upload du fichier';
      
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
        
        if (error.response.status === 413) {
          errorMessage = 'Fichier trop volumineux pour le serveur';
        } else if (error.response.status === 415) {
          errorMessage = 'Type de fichier non supporté par le serveur';
        } else if (error.response.status === 500) {
          errorMessage = 'Erreur interne du serveur lors du traitement';
        } else if (error.response.status === 408) {
          errorMessage = 'Timeout du serveur - le traitement a pris trop de temps';
        } else {
          errorMessage = error.response.data?.error || error.response.data?.message || `Erreur serveur (${error.response.status})`;
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse
        console.error('Request:', error.request);
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout - le traitement du fichier a pris trop de temps';
        } else {
          errorMessage = 'Pas de réponse du serveur (connexion interrompue)';
        }
      } else {
        // Erreur lors de la configuration de la requête
        console.error('Error:', error.message);
        errorMessage = `Erreur de configuration: ${error.message}`;
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
      
      // Réinitialiser la barre de progression en cas d'erreur
      globalProgressBar.resetProgress();
    } finally {
      // Les barres de progression se réinitialisent automatiquement après un délai
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <div className="upload-page">
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
              <h1 className="text-2xl font-bold">Upload</h1>
            </div>
          </div>
        </div>
        
        <div className="upload-header">
          <h2 className="text-3xl font-bold mb-2">Uploader un fichier</h2>
          <p className="text-secondary">
            Sécurisez vos documents avec notre système de chiffrement SHA-256
          </p>
        </div>


        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div
              className={`upload-zone ${dragActive ? 'dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleChange}
                accept=".jpg,.jpeg,.png,.svg,.pdf,.zip"
                disabled={globalProgressBar.isActive}
              />
              
              <div className="upload-icon">
                {globalProgressBar.isActive ? <FiClock size={48} /> : <FiUpload size={48} />}
              </div>
              
              <div className="upload-text">
                {globalProgressBar.isActive ? `${globalProgressBar.currentItem} ${globalProgressBar.progress}%` : 'Cliquez ou glissez-déposez votre fichier'}
              </div>
              
              <div className="upload-subtext">
                Formats acceptés: JPG, PNG, SVG, PDF, ZIP (taille maximale technique: 10 Mo) <br />
                {user?.subscription_type === 'premium'
                  ? 'Possibilité d\'uploader jusqu\'à 5 fichiers à la fois.'
                  : '1 fichier à uploader à la fois.'}
              </div>

              {user?.subscription_type === 'premium' && batchFiles.length > 0 && (
                <div
                  className="upload-batch-status"
                  style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.75rem'
                  }}
                >
                  {batchFiles.map((item, index) => {
                    let IconComponent = FaFileAlt;
                    if (item.type && item.type.startsWith('image/')) {
                      IconComponent = FaFileImage;
                    } else if (item.type === 'application/pdf') {
                      IconComponent = FaFilePdf;
                    }

                    const isDone = item.status === 'done';

                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className="upload-batch-item"
                        style={{
                          width: '100px',
                          height: '72px',
                          borderRadius: '14px',
                          background: isDone
                            ? 'var(--navbar-hover-bg)'
                            : 'var(--navbar-active-bg)',
                          border: isDone
                            ? '1px solid var(--success-color)'
                            : '0',
                          boxShadow: isDone
                            ? 'var(--shadow-sm)'
                            : 'var(--shadow-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <IconComponent className="text-secondary" style={{ fontSize: '1.25rem' }} />
                        {isDone && (
                          <FaCheck
                            className="text-green-500"
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              borderRadius: '50%',
                              background: 'var(--success-color)',
                              padding: '2px'
                            }}
                          />
                        )}
                        <span
                          className="text-xs text-secondary"
                          style={{
                            marginTop: '0.35rem',
                            textAlign: 'center',
                            maxWidth: '64px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {globalProgressBar.isActive && (
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <ProgressBar
                    isVisible={true}
                    progress={globalProgressBar.progress}
                    type={globalProgressBar.type}
                    currentItem={globalProgressBar.currentItem}
                    stats={globalProgressBar.stats}
                    error={globalProgressBar.error}
                    completed={globalProgressBar.completed}
                    showAsModal={false}
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Fonctionnalités de sécurité</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="security-feature-item">
                  <div className="text-primary text-6xl"><FiLock /></div>
                  <div>
                    <div className="font-medium">Chiffrement SHA-256</div>
                    <div className="text-sm text-secondary">Hash unique pour chaque fichier</div>
                  </div>
                </div>
                
                <div className="security-feature-item">
                  <div className="text-primary text-6xl"><FiEdit3 /></div>
                  <div>
                    <div className="font-medium">Signature numérique</div>
                    <div className="text-sm text-secondary">Preuve d'authenticité</div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
