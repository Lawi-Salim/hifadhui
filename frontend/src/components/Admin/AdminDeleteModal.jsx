import React from 'react';
import PropTypes from 'prop-types';
import { FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemCount, 
  itemType = 'élément',
  title = 'Confirmation de suppression',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getItemMessage = () => {
    if (itemType === 'notification') {
      return itemCount === 1 
        ? 'cette 1 notification sélectionnée' 
        : `ces ${itemCount} notifications sélectionnées`;
    } else if (itemType === 'message') {
      return itemCount === 1 
        ? 'ce 1 message sélectionné' 
        : `ces ${itemCount} messages sélectionnés`;
    } else {
      return itemCount === 1 
        ? 'cet 1 élément sélectionné' 
        : `ces ${itemCount} éléments sélectionnés`;
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      // Le modal reste ouvert en cas d'erreur
    }
  };

  return (
    <div className="modal-overlay admin-delete-modal-overlay" onClick={onClose}>
      <div className="modal-content admin-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-delete-header">
          <div className="admin-delete-title">
            <FiAlertTriangle className="admin-delete-icon" />
            <h3>{title}</h3>
          </div>
          <button 
            className="admin-delete-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <FiX />
          </button>
        </div>
        
        <div className="admin-delete-body">
          <p>
            Êtes-vous sûr de vouloir supprimer {getItemMessage()} ?
          </p>
          <p className="admin-delete-warning">
            Cette action est irréversible.
          </p>
        </div>
        
        <div className="admin-delete-actions">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            <FiTrash2 />
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

AdminDeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  itemCount: PropTypes.number.isRequired,
  itemType: PropTypes.oneOf(['notification', 'message', 'élément']),
  title: PropTypes.string,
  isLoading: PropTypes.bool
};

export default AdminDeleteModal;
