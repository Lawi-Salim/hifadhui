import React, { useState, useRef } from 'react';
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
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Fichier trop volumineux (max 5MB).' });
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Type de fichier non autorisé (JPG, PNG, PDF).' });
      return;
    }

    uploadProgressBar.startProgress('Upload en cours...', file.size);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('document', file);
    if (dossierId) {
      formData.append('dossier_id', dossierId);
    }

    try {
      await api.post('/files/upload', formData, {
        onUploadProgress: (progressEvent) => {
          // Ignorer la progression Axios, utiliser la progression simulée adaptée à la taille
          // La progression est déjà gérée par useProgressBar avec la taille du fichier
        },
      });

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
          accept=".jpg,.jpeg,.png,.pdf"
          disabled={uploadProgressBar.isActive}
        />
        <div className="upload-icon">
          {uploadProgressBar.isActive ? <FiClock size={48} /> : <FiUpload size={48} />}
        </div>
        <div className="upload-text">
          {uploadProgressBar.isActive ? `Upload en cours... ${uploadProgressBar.progress}%` : 'Cliquez ou glissez-déposez'}
        </div>
        <div className="upload-subtext">Formats acceptés: JPG, PNG, PDF, ZIP (max. 5MB) <br />Les dossiers zip ne sont pas acceptés ici. </div>
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
