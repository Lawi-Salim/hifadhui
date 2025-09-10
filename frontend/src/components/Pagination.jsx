import React from 'react';
import './Pagination.css';

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav>
      <ul className="pagination">
        {/* Bouton Précédent */}
        {currentPage > 1 && (
          <li className="page-item">
            <button onClick={() => paginate(currentPage - 1)} className="page-link">
              &lt;
            </button>
          </li>
        )}

        {/* Page actuelle */}
        <li className="page-item active">
          <button className="page-link">
            {currentPage}
          </button>
        </li>

        {/* Points de suspension si pas la dernière page */}
        {currentPage < totalPages && (
          <li className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        )}

        {/* Dernière page si différente de la page actuelle */}
        {currentPage < totalPages && (
          <li className="page-item">
            <button onClick={() => paginate(totalPages)} className="page-link">
              {totalPages}
            </button>
          </li>
        )}

        {/* Bouton Suivant */}
        {currentPage < totalPages && (
          <li className="page-item">
            <button onClick={() => paginate(currentPage + 1)} className="page-link">
              &gt;
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
