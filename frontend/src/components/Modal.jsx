import React from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, className, style, title }) => {
  if (!isOpen) {
    return null;
  }

  // Gère le clic sur l'overlay pour fermer la modale
  const handleOverlayClick = (e) => {
    // Si l'élément cliqué est l'overlay lui-même (et non le contenu de la modale)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className={`modal-overlay ${className || ''}`} style={style} onClick={handleOverlayClick}>
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-button">
          &times;
        </button>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default Modal;