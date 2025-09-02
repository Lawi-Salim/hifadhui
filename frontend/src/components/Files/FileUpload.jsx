import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiUpload, FiClock, FiLock, FiEdit3, FiFileText } from 'react-icons/fi';
import './FileList.css';

const FileUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('document', file);

    try {
      // Choisir la route selon le type de fichier
      const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
      const uploadRoute = isZip ? '/files/upload-zip' : '/files/upload';
      
      const response = await api.post(uploadRoute, formData, {
                // L'intercepteur d'api.js s'occupe du header d'authentification
        // et le Content-Type est géré automatiquement par le navigateur pour FormData.
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

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
      setUploading(false);
      setUploadProgress(0);
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
        <div className="upload-header">
          <h1 className="text-3xl font-bold mb-2">Uploader un fichier</h1>
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
                disabled={uploading}
              />
              
              <div className="upload-icon">
                {uploading ? <FiClock size={48} /> : <FiUpload size={48} />}
              </div>
              
              <div className="upload-text">
                {uploading ? `Upload en cours... ${uploadProgress}%` : 'Cliquez ou glissez-déposez votre fichier'}
              </div>
              
              <div className="upload-subtext">
                Formats acceptés: JPG, PNG, PDF, ZIP (max. 5MB)
              </div>

              {uploading && (
                <div className="upload-progress">
                  <div 
                    className="upload-progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <div className="upload-progress-text">
                    {uploadProgress}%
                  </div>
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
