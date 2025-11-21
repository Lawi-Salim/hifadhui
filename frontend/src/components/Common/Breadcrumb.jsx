import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import FormattedText from './FormattedText';
import './Breadcrumb.css';

const Breadcrumb = ({ items, onItemClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Gérer le clic en dehors du menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <FaChevronRight className="breadcrumb-separator" />}
          {(() => {
            const isLast = index === items.length - 1;

            // Mode contrôlé par callback: les éléments non terminaux sont cliquables via onItemClick
            if (onItemClick && !isLast) {
              return (
                <button
                  type="button"
                  className="breadcrumb-link breadcrumb-button"
                  onClick={(e) => {
                    e.preventDefault();
                    onItemClick(item, index);
                  }}
                >
                  <FormattedText text={item.name} />
                </button>
              );
            }

            // Dernier élément ou absence de callback: comportement d'origine
            if (item.path && !isLast) {
              return (
                <Link to={item.path} className="breadcrumb-link">
                  <FormattedText text={item.name} />
                </Link>
              );
            }

            return (
              <span className="breadcrumb-current">
                <FormattedText text={item.name} />
              </span>
            );
          })()}
        </React.Fragment>
      ))}
    </nav>
  );
}
;

export default Breadcrumb;
