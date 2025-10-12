import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiUpload, FiClock, FiLock, FiEdit3, FiFileText, FiMenu } from 'react-icons/fi';
import ProgressBar from '../Common/ProgressBar';
import { useProgressBar } from '../../hooks/useProgressBar';
import './FileList.css';

const FileUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    // Vérifications
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > maxSize) {
      setMessage({
        type: 'error',
        text: 'Le fichier est trop volumineux. Taille maximale: 5MB'
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
      
      if (isZip) {
        // Première étape : obtenir la liste des fichiers du ZIP
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
      }

      // La progression est déjà gérée par useProgressBar
      const uploadRoute = isZip ? '/files/upload-zip' : '/files/upload';
      
      const response = await api.post(uploadRoute, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 90000, // 1.5 minutes pour les uploads de fichiers (5MB max + traitement)
        onUploadProgress: (progressEvent) => {
          // Progression gérée par le hook useProgressBar
          // Quand l'upload atteint 100%, indiquer le traitement
          if (progressEvent.loaded === progressEvent.total) {
            globalProgressBar.updateCurrentItem(isZip ? 'Traitement et extraction en cours...' : 'Finalisation...');
          }
        }
      });

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
                Formats acceptés: JPG, PNG, SVG, PDF, ZIP (max. 5MB) <br /> Veuillez rester sur cette page jusqu'à la fin de l'upload.
              </div>

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
