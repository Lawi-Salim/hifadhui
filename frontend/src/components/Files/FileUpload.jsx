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
  const navigate = useNavigate();

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
        text: 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, PDF, ZIP'
      });
      return;
    }

    globalProgressBar.startProgress('Upload en cours...', file.size);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('document', file);

    try {
      // Choisir la route selon le type de fichier
      const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
      
      // Pour les fichiers ZIP, obtenir la liste réelle des fichiers
      let extractionInterval;
      let realFiles = [];
      
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
        // L'intercepteur d'api.js s'occupe du header d'authentification
        // et le Content-Type est géré automatiquement par le navigateur pour FormData.
        timeout: 300000, // 5 minutes pour les gros fichiers
        onUploadProgress: (progressEvent) => {
          // On ignore pour garder la progression évolutive
        },
      });

      // Compléter la progression
      if (extractionInterval) {
        clearInterval(extractionInterval);
      }
      globalProgressBar.completeProgress();
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 200));

      setMessage({
        type: 'success',
        text: 'Fichier uploadé avec succès!'
      });

      // Pas de redirection automatique - laisser l'utilisateur sur la page d'upload

    } catch (error) {
      console.error('Erreur upload:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erreur lors de l\'upload du fichier'
      });
    } finally {
      // Les barres de progression se réinitialisent automatiquement après un délai
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                accept=".jpg,.jpeg,.png,.pdf,.zip"
                disabled={globalProgressBar.isActive}
              />
              
              <div className="upload-icon">
                {globalProgressBar.isActive ? <FiClock size={48} /> : <FiUpload size={48} />}
              </div>
              
              <div className="upload-text">
                {globalProgressBar.isActive ? `${globalProgressBar.currentItem} ${globalProgressBar.progress}%` : 'Cliquez ou glissez-déposez votre fichier'}
              </div>
              
              <div className="upload-subtext">
                Formats acceptés: JPG, PNG, PDF, ZIP (max. 5MB) <br /> Veuillez rester sur cette page jusqu’à la fin de l’upload.
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
                
                <div className="security-feature-item">
                  <div className="text-primary text-6xl"><FiFileText /></div>
                  <div>
                    <div className="font-medium">Certificat PDF</div>
                    <div className="text-sm text-secondary">Preuve de propriété</div>
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
