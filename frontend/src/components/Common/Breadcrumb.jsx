import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight, FaEllipsisH } from 'react-icons/fa';
import './Breadcrumb.css';

const Breadcrumb = ({ items }) => {
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

  // Si moins de 4 éléments, affichage normal
  if (items.length <= 3) {
    return (
      <nav className="breadcrumb">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <FaChevronRight className="breadcrumb-separator" />}
            {item.path ? (
              <Link to={item.path} className="breadcrumb-link">
                {item.name}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.name}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  // Si plus de 3 éléments, affichage compacté
  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const middleItems = items.slice(1, -1);

  return (
    <nav className="breadcrumb">
      {/* Premier élément (Mes Dossiers) */}
      <Link to={firstItem.path} className="breadcrumb-link">
        {firstItem.name}
      </Link>
      
      <FaChevronRight className="breadcrumb-separator" />
      
      {/* Menu déroulant pour les éléments du milieu */}
      <div className="breadcrumb-dropdown" ref={dropdownRef}>
        <button 
          className="breadcrumb-ellipsis"
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          aria-expanded={showDropdown}
          aria-haspopup="true"
          aria-label="Afficher le menu de navigation"
        >
          <FaEllipsisH />
        </button>
        
        <div 
          className="breadcrumb-dropdown-menu"
          data-visible={showDropdown}
        >
          {middleItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.path} 
              className="breadcrumb-dropdown-item"
              onClick={() => setShowDropdown(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      
      <FaChevronRight className="breadcrumb-separator" />
      
      {/* Dernier élément */}
      {lastItem.path ? (
        <Link to={lastItem.path} className="breadcrumb-link">
          {lastItem.name}
        </Link>
      ) : (
        <span className="breadcrumb-current">{lastItem.name}</span>
      )}
    </nav>
  );
};

export default Breadcrumb;
