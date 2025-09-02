import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import fileService from '../../services/fileService';

const RenameFileModal = ({ isOpen, onClose, file, onFileRenamed }) => {
  const [baseName, setBaseName] = useState('');
  const [extension, setExtension] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file && file.filename) {
      const lastDotIndex = file.filename.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        setBaseName(file.filename.substring(0, lastDotIndex));
        setExtension(file.filename.substring(lastDotIndex));
      } else {
        setBaseName(file.filename);
        setExtension('');
      }
    } else {
      setBaseName('');
      setExtension('');
    }
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseName.trim()) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const finalName = `${baseName.trim()}${extension}`;
      await fileService.renameFile(file.id, finalName);
      onFileRenamed();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="rename-modal" title="Renommer le fichier">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fileName">Nouveau nom</label>
          <div style={{ position: 'relative' }}>
            <input
              id="fileName"
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              className="form-control w-full"
              style={{ paddingRight: '50px' }} 
              required
            />
            {extension && (
              <span 
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  color: 'var(--placeholder-color)',
                  pointerEvents: 'none',
                  borderLeftStyle: 'solid',
                  borderLeftColor: 'var(--placeholder-color)',
                  borderLeftWidth: '1px',
                  paddingLeft: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                {extension}
              </span>
            )}
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Renommage...' : 'Renommer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RenameFileModal;
