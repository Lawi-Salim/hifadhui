import React from 'react';
import './Pagination.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

  // Génère la liste des éléments de pagination (numéros + ellipses)
  const getPageItems = () => {
    // Cas simples: peu de pages, on les affiche toutes
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items = [];

    // Début de liste (pages 1..4, puis ellipses, puis dernière)
    if (currentPage <= 2) {
      items.push(1, 2, 3, 4, 'ellipsis', totalPages);
      return items;
    }

    // Fin de liste (première, ellipses, puis les 4 dernières)
    if (currentPage >= totalPages - 1) {
      items.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    // Milieu de liste (première, ellipses, voisinage de la page courante, ellipses, dernière)
    items.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    return items;
  };

  const pageItems = getPageItems();

  const handleSafePageChange = (page) => {
    if (!onPageChange || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <div className="pagination-controls">
      <div className="pagination-buttons">
        {/* Flèche précédente */}
        <button
          className="pagination-btn pagination-arrow"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          title="Page précédente"
        >
          <FiChevronLeft size={16} />
        </button>

        {/* Boutons de page + ellipses */}
        {pageItems.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }

          const pageNumber = item;
          const isActive = pageNumber === currentPage;

          return (
            <button
              key={pageNumber}
              className={`pagination-btn pagination-page ${isActive ? 'active' : ''}`}
              onClick={() => handleSafePageChange(pageNumber)}
              title={`Page ${pageNumber}`}
            >
              {pageNumber}
            </button>
          );
        })}

        {/* Flèche suivante */}
        <button
          className="pagination-btn pagination-arrow"
          onClick={onNextPage}
          disabled={!hasNextPage}
          title="Page suivante"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
