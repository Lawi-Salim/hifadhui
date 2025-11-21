import React, { useState, useRef } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import api from '../../services/api';
import { FiUpload, FiClock } from 'react-icons/fi';
import ProgressBar from '../Common/ProgressBar';
import { useProgressBar } from '../../hooks/useProgressBar';

const FileUploadModal = ({ isOpen, onClose, onUploadComplete, dossierId }) => {
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Hook centralisé pour la progression
  const uploadProgressBar = useProgressBar({ 
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
    const SMALL_LIMIT = 4 * 1024 * 1024; // ~4MB: au-delà, utiliser l'upload direct Cloudinary

    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Fichier trop volumineux (max 10MB).' });
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Type de fichier non autorisé (JPG, PNG, SVG, PDF).' });
      return;
    }

    uploadProgressBar.startProgress('Upload en cours...', file.size);
    setMessage({ type: '', text: '' });

    try {
      const isSmallFile = file.size <= SMALL_LIMIT;

      if (isSmallFile) {
        // Flux actuel : envoi du fichier via le backend (multipart)
        const formData = new FormData();
        formData.append('document', file);
        if (dossierId) {
          formData.append('dossier_id', dossierId);
        }

        await api.post('/files/upload', formData, {
          onUploadProgress: () => {
            // Progression réelle ignorée: la progression est simulée par useProgressBar
          }
        });
      } else {
        // Nouveau flux : upload direct vers Cloudinary avec enregistrement via /files/upload-cloudinary
        // Étape 1 : préparation des paramètres d'upload
        const prepareResponse = await api.post('/files/upload-cloudinary', {
          step: 'prepare',
          filename: file.name,
          mimetype: file.type,
          size: file.size,
          dossier_id: dossierId || null
        });

        const {
          cloudName,
          apiKey,
          timestamp,
          signature,
          folder,
          public_id,
          resource_type,
          dossier_id: preparedDossierId
        } = prepareResponse.data || {};

        if (!cloudName || !apiKey || !timestamp || !signature || !folder || !public_id || !resource_type) {
          throw new Error('Paramètres Cloudinary incomplets pour l\'upload direct');
        }

        // Étape 2 : upload direct vers Cloudinary
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

        // Étape 3 : enregistrement du fichier dans la base via le backend
        await api.post('/files/upload-cloudinary', {
          step: 'register',
          secure_url,
          bytes,
          mimetype: file.type,
          dossier_id: preparedDossierId || dossierId || null,
          originalname: original_filename || file.name
        });
      }

      uploadProgressBar.completeProgress();
      setMessage({ type: 'success', text: 'Fichier uploadé avec succès!' });
      setTimeout(() => {
        onUploadComplete();
        onClose();
        uploadProgressBar.resetProgress();
      }, 1500);

    } catch (error) {
      uploadProgressBar.setProgressError(error.response?.data?.error || 'Erreur lors de l\'upload.');
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur lors de l\'upload.' });
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Téléverser un fichier</h2>
      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
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
          accept=".jpg,.jpeg,.png,.svg,.pdf"
          disabled={uploadProgressBar.isActive}
        />
        <div className="upload-icon">
          {uploadProgressBar.isActive ? <FiClock size={48} /> : <FiUpload size={48} />}
        </div>
        <div className="upload-text">
          {uploadProgressBar.isActive ? `Upload en cours... ${uploadProgressBar.progress}%` : 'Cliquez ou glissez-déposez'}
        </div>
        <div className="upload-subtext">Formats acceptés: JPG, PNG, SVG, PDF (max. 10MB) <br />Les dossiers zip ne sont pas acceptés ici. </div>
        {uploadProgressBar.isActive && (
          <div style={{ marginTop: '1rem' }}>
            <ProgressBar
              isVisible={true}
              progress={uploadProgressBar.progress}
              type={uploadProgressBar.type}
              currentItem={uploadProgressBar.currentItem}
              stats={uploadProgressBar.stats}
              error={uploadProgressBar.error}
              completed={uploadProgressBar.completed}
              showAsModal={false}
            />
          </div>
        )}
      </div>
      <div className="modal-actions">
        <button onClick={onClose} className="btn btn-secondary">Fermer</button>
      </div>
    </Modal>
  );
};

export default FileUploadModal;
