import React, { useState } from 'react';
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "warning", // warning, danger, info
  requiresTyping = false,
  requiredText = "",
  user = null
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(!requiresTyping);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsValid(!requiresTyping || value === requiredText);
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setInputValue('');
    setIsValid(!requiresTyping);
    onClose();
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FiTrash2 className="modal-icon danger" />;
      case 'warning':
        return <FiAlertTriangle className="modal-icon warning" />;
      default:
        return <FiAlertTriangle className="modal-icon info" />;
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={handleClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div className="confirm-modal-title">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          <button className="confirm-modal-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="confirm-modal-body">
          {user && type === 'danger' && (
            <div className="user-info-summary">
              <div className="info-row">
                <span className="label">Utilisateur:</span>
                <span className="value">{user.username}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Fichiers:</span>
                <span className="value">{user.filesCount || 0}</span>
              </div>
              <div className="info-row">
                <span className="label">Stockage:</span>
                <span className="value">{user.storageUsed || '0 MB'}</span>
              </div>
            </div>
          )}

          <div className="confirm-message">
            {message}
          </div>

          {requiresTyping && (
            <div className="confirm-input-section">
              <label htmlFor="confirm-input">
                Tapez "<strong>{requiredText}</strong>" pour confirmer:
              </label>
              <input
                id="confirm-input"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={`Tapez "${requiredText}"`}
                className={`confirm-input ${isValid ? 'valid' : 'invalid'}`}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="confirm-modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
          >
            {cancelText}
          </button>
          <button 
            className={`btn btn-${type}`}
            onClick={handleConfirm}
            disabled={!isValid}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
