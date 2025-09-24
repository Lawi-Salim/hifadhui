import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHome, 
  FiUpload, 
  FiFileText, 
  FiFolder, 
  FiImage, 
  FiBarChart2, 
  FiUser, 
  FiActivity, 
  FiServer, 
  FiPieChart,
  FiShield,
  FiLock,
  FiClock,
  FiMonitor,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle
} from 'react-icons/fi';
import UserMenu from './UserMenu';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef(null);

  // Détecter si on est sur mobile/tablette et très petit écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 1024);
      setIsVerySmallScreen(window.innerWidth <= 600);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // État pour détecter si on est sur très petit écran (mobile) - dynamique
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(window.innerWidth <= 600);

  // Écouter l'événement personnalisé pour ouvrir le sidebar depuis les pages
  useEffect(() => {
    const handleToggleSidebar = () => {
      if (isVerySmallScreen) {
        setIsExpanded(!isExpanded);
      }
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
  }, [isVerySmallScreen, isExpanded]);

  // Fermer la sidebar étendue quand on clique en dehors (seulement sur mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);


  let menuItems;

  if (user && user.role === 'admin') {
    // Menu admin pur - supervision uniquement
    menuItems = [
      { path: '/admin/dashboard', label: 'Dashboard Admin', icon: FiBarChart2 },
      { path: '/admin/users', label: 'Utilisateurs', icon: FiUser },
      { path: '/admin/files', label: 'Tous les PDFs', icon: FiFileText },
      { path: '/admin/images', label: 'Toutes les Images', icon: FiImage },
      { path: '/admin/activity', label: 'Logs d\'activité', icon: FiActivity },
      { path: '/admin/system', label: 'Système', icon: FiServer },
      { path: '/admin/analytics', label: 'Analytics', icon: FiPieChart },
      { path: '/admin/reports', label: 'Signalements', icon: FiAlertTriangle },
      { path: '/admin/technical', label: 'Données techniques', icon: FiMonitor }
    ];
  } else {
    // Menu utilisateur standard
    menuItems = [
      { path: '/dashboard', label: 'Tableau de bord', icon: FiBarChart2 },
      { path: '/upload', label: 'Uploader', icon: FiUpload },
      { path: '/files', label: 'PDFs', icon: FiFileText },
      { path: '/dossiers', label: 'Mes Dossiers', icon: FiFolder },
      { path: '/images', label: 'Images', icon: FiImage },
    ];
  }

  const handleNavClick = (item, e) => {
    if (!isMobile) return; // Pas de logique spéciale sur desktop
    
    const isCurrentPage = location.pathname === item.path || 
                          (item.path === '/dossiers' && location.pathname.startsWith('/dossiers/')) ||
                          (item.path === '/admin' && location.pathname.startsWith('/admin'));
    
    if (isCurrentPage) {
      // Si on clique sur l'icône de la page active, on toggle l'expansion
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else {
      // Si on clique sur une autre icône, on ferme l'expansion et on navigue
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Overlay pour fermer le menu sur mobile */}
      {isVerySmallScreen && isExpanded && (
        <div className="sidebar-overlay" onClick={() => setIsExpanded(false)}></div>
      )}
      
      <nav ref={sidebarRef} className={`sidebar ${isMobile && isExpanded ? 'expanded' : ''} ${isVerySmallScreen ? 'mobile-hidden' : ''}`}>
      <div className="sidebar-brand">
        <Link to="/dashboard" className="brand-link">
          <span className="brand-icon"><FiLock /></span>
          {(!isMobile || isExpanded) && <span className="brand-text">Hifadhui</span>}
        </Link>
      </div>

      <div className="sidebar-menu">
        <div className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path === '/dossiers' && location.pathname.startsWith('/dossiers/')) ||
                            (item.path.startsWith('/admin') && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={(e) => handleNavClick(item, e)}
              >
                <span className="nav-icon"><item.icon /></span>
                {(!isMobile || isExpanded) && <span className="nav-text">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="sidebar-user">
          <UserMenu isExpanded={!isMobile || isExpanded} />
        </div>
      </div>
      </nav>
    </>
  );
};

export default Sidebar;
