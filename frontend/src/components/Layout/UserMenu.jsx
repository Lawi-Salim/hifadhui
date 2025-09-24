import React, { useState, useEffect, useRef } from 'react';
import Profil from './Profil';
import { useAuth } from '../../contexts/AuthContext';
import SmartAvatar from './SmartAvatar';
import UserDisplayName from './UserDisplayName';
import { FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './UserMenu.css';

const UserMenu = ({ isExpanded }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfilModalOpen, setProfilModalOpen] = useState(false);
  const menuRef = useRef(null);


  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="user-menu-container" ref={menuRef}>
      <div className="user-drop">
        <button className="user-menu-trigger" onClick={toggleMenu}>
          <SmartAvatar user={user} size={36} />
          {(isExpanded === undefined || isExpanded) && (
            <p className="dropdown-user-email">
              <UserDisplayName user={user} />
            </p>
          )}
          {(isExpanded === undefined || isExpanded) && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`user-menu-chevron ${isOpen ? 'open' : ''}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>}
        </button>
      </div>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="dropdown-header">
            <p className="dropdown-user-name">
              <UserDisplayName user={user} />
            </p>
            <p className="dropdown-user-email">{user?.email}</p>
          </div>
          <button onClick={() => setProfilModalOpen(true)} className="dropdown-item">
            <FiUser /> Mon profil
          </button>
          <Link to="/settings" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <FiSettings /> Paramètres
          </Link>
          <div className="dropdown-divider"></div>
          <button onClick={handleLogout} className="dropdown-item logout">
            <FiLogOut /> Se déconnecter
          </button>
        </div>
      )}
    </div>
      <Profil isOpen={isProfilModalOpen} onClose={() => setProfilModalOpen(false)} />
    </>
  );
};

export default UserMenu;
