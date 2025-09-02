import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiUser, FiLogIn, FiMenu, FiX } from 'react-icons/fi';
import './PublicNavbar.css';

const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <nav className="public-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <FiShield className="brand-icon" />
          <span className="brand-text">hifadhwi</span>
        </Link>

        {/* Menu Desktop */}
        <div className="navbar-menu">
          <Link to="/" className="navbar-link btn-secondary">
            Accueil
          </Link>
          <Link to="about" className="navbar-link btn-secondary">
            A propos
          </Link>
          <Link to="contact" className="navbar-link btn-secondary">
            Contact
          </Link>
          <Link to="/login" className="btn btn-primary">
            <FiLogIn /> Connexion
          </Link>
          <Link to="/register" className="btn btn-secondary">
            <FiUser /> S'inscrire
          </Link>
        </div>

        {/* Bouton Menu Mobile */}
        <button 
          className="mobile-menu-button" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Menu Mobile */}
      <div ref={menuRef} className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="mobile-menu-link btn btn-secondary" onClick={() => setIsMenuOpen(false)}>
          Accueil
        </Link>
        <Link to="about" className="mobile-menu-link btn btn-secondary" onClick={() => setIsMenuOpen(false)}>
          A propos
        </Link>
        <Link to="contact" className="mobile-menu-link btn btn-secondary" onClick={() => setIsMenuOpen(false)}>
          Contact
        </Link>
        <Link to="/login" className="mobile-menu-link btn btn-primary" onClick={() => setIsMenuOpen(false)}>
          <FiLogIn /> Connexion
        </Link>
        <Link to="/register" className="mobile-menu-link btn btn-secondary" onClick={() => setIsMenuOpen(false)}>
          <FiUser /> S'inscrire
        </Link>
      </div>
    </nav>
  );
};

export default PublicNavbar;
