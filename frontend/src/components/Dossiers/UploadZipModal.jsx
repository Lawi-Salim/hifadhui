import React, { useState } from 'react';
import Modal from '../Modal';
import dossierService from '../../services/dossierService';

const UploadZipModal = ({ isOpen, onClose, dossier, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/zip') {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
      setError('Veuillez sélectionner un fichier .zip');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Aucun fichier sélectionné.');
      return;
    }
    setLoading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('zipfile', selectedFile);

    try {
      const response = await dossierService.uploadZipToDossier(dossier.id, formData);
      setUploadResult(response.data);
      onUploadComplete(); // Pour rafraîchir la liste des dossiers
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue lors de l\'upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setUploadResult(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Uploader dans "${dossier?.name}"`}>
      {!uploadResult ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="zipFile" className="form-label">Fichier ZIP</label>
            <input
              type="file"
              id="zipFile"
              accept=".zip,application/zip"
              onChange={handleFileChange}
              className="form-input"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading || !selectedFile} className="btn btn-primary">
              {loading ? 'Upload en cours...' : 'Uploader'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="alert alert-success">
            <p>Upload terminé avec succès !</p>
            <p>{uploadResult.success.length} fichier(s) ajouté(s).</p>
            {uploadResult.errors.length > 0 && (
              <p className="text-danger">{uploadResult.errors.length} erreur(s).</p>
            )}
          </div>
          <div className="modal-footer">
             <button onClick={handleClose} className="btn btn-primary">
              Fermer
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UploadZipModal;
