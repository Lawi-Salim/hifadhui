import React from 'react';
import './Pagination.css';

/**
 * Composant de pagination minimaliste
 * Format: ← Précédent [page-1] ... [page+1] Suivant →
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {number} props.currentPage - Page actuelle
 * @param {number} props.totalPages - Nombre total de pages
 * @param {number} props.totalItems - Nombre total d'éléments
 * @param {number} props.itemsPerPage - Nombre d'éléments par page
 * @param {boolean} props.hasNextPage - Y a-t-il une page suivante
 * @param {boolean} props.hasPrevPage - Y a-t-il une page précédente
 * @param {function} props.onPageChange - Fonction appelée lors du changement de page
 * @param {function} props.onPrevPage - Fonction appelée pour la page précédente
 * @param {function} props.onNextPage - Fonction appelée pour la page suivante
 * @param {string} props.itemName - Nom des éléments (ex: "tentatives", "utilisateurs")
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onPrevPage,
  onNextPage,
  itemName = "éléments"
}) => {
  // Ne pas afficher la pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) {
    return null;
  }

  // Logique de pagination minimaliste
  const getMinimalistPaginationConfig = () => {
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;
    
    return {
      prevPage,
      nextPage,
      showEllipsis: totalPages > 2 // Afficher ... seulement s'il y a plus de 2 pages
    };
  };

  const paginationConfig = getMinimalistPaginationConfig();

  return (
    <div className="pagination-controls">
      <div className="pagination-info">
        <span>
          Page {currentPage} sur {totalPages}
          {totalItems && (
            <> ({totalItems} {itemName} au total)</>
          )}
        </span>
      </div>
      
      <div className="pagination-buttons">
        {/* Bouton Précédent */}
        <button 
          className="pagination-btn"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          title="Page précédente"
        >
          ← Précédent
        </button>
        
        {/* Page précédente (si elle existe) */}
        {paginationConfig.prevPage && (
          <button
            className="pagination-btn"
            onClick={() => onPageChange(paginationConfig.prevPage)}
            title={`Page ${paginationConfig.prevPage}`}
          >
            {paginationConfig.prevPage}
          </button>
        )}
        
        {/* Ellipse fixe (si plus de 2 pages) */}
        {paginationConfig.showEllipsis && (
          <span className="pagination-ellipsis">...</span>
        )}
        
        {/* Page suivante (si elle existe) */}
        {paginationConfig.nextPage && (
          <button
            className="pagination-btn"
            onClick={() => onPageChange(paginationConfig.nextPage)}
            title={`Page ${paginationConfig.nextPage}`}
          >
            {paginationConfig.nextPage}
          </button>
        )}
        
        {/* Bouton Suivant */}
        <button 
          className="pagination-btn"
          onClick={onNextPage}
          disabled={!hasNextPage}
          title="Page suivante"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
