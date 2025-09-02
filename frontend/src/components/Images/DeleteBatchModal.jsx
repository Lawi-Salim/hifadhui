import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal'; // Utilisation du composant Modal centralisé

const DeleteBatchModal = ({ isOpen, onClose, onConfirm, imageCount }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="delete-modal">
      <div className="delete-batch-modal-content">
        <h2>Confirmation de suppression</h2>
        <p>
          Êtes-vous sûr de vouloir supprimer les {imageCount} {imageCount > 1 ? 'images sélectionnées' : 'image sélectionnée'} ?
          <br />
          Cette action est irréversible.
        </p>
        <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  );
};

DeleteBatchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  imageCount: PropTypes.number.isRequired,
};

export default DeleteBatchModal;
