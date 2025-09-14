import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiShield, FiUpload, FiShare2, FiEye, FiLock, FiCheck } from 'react-icons/fi';
import PublicNavbar from '../components/Layout/PublicNavbar';
import Footer from '../components/Layout/Footer';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier s'il y a un paramètre redirect dans l'URL
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (redirectPath) {
      // Rediriger vers le chemin spécifié
      navigate(redirectPath, { replace: true });
    }
  }, [location, navigate]);

  const features = [
    {
      icon: <FiShield />,
      title: "Sécurité Maximale",
      description: "Vos documents sont protégés par un système de hachage SHA-256 et des certificats de propriété."
    },
    {
      icon: <FiUpload />,
      title: "Upload Facile",
      description: "Glissez-déposez vos fichiers (images, PDF, ZIP) en toute simplicité."
    },
    {
      icon: <FiShare2 />,
      title: "Partage Sécurisé",
      description: "Partagez vos documents avec des liens temporaires et des filigranes de protection."
    },
    {
      icon: <FiEye />,
      title: "Aperçu Intégré",
      description: "Visualisez vos documents directement dans l'application sans les télécharger."
    }
  ];

  const stats = [
    { number: "256", label: "Bits de sécurité", icon: <FiLock /> },
    { number: "24h", label: "Liens temporaires", icon: <FiShare2 /> },
    { number: "100%", label: "Preuve propriété", icon: <FiCheck /> }
  ];

  return (
    <div className="home-page">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Votre <span className="highlight">Coffre-fort</span> Numérique
          </h1>
          <p className="hero-subtitle">
            Stockez, sécurisez et partagez vos documents importants avec une preuve de propriété incontestable.
          </p>
          
          {user ? (
            <div className="hero-actions">
              <Link to="/upload" className="btn btn-primary btn-large">
                <FiUpload /> Uploader un document
              </Link>
              <Link to="/files" className="btn btn-secondary btn-large">
                Mes documents
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-large">
                Se connecter
              </Link>
              <Link to="/register" className="btn btn-secondary btn-large">
                Créer un compte
              </Link>
            </div>
          )}
        </div>
        
        <div className="hero-visual">
          <div className="security-badge">
            <img src="/hifadhwi-logo.svg" alt="Hifadhwi Logo" className="Hifadhwi-logo" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container-home">
          <h2 className="section-title">Pourquoi choisir Hifadhwi ?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="icon-feature">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container-home">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  {stat.icon}
                </div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="cta-section">
          <div className="container-home">
            <div className="cta-content">
              <h2>Prêt à sécuriser vos documents ?</h2>
              <p>Rejoignez Hifadhwi et bénéficiez d'un stockage sécurisé avec preuve de propriété.</p>
              <Link to="/register" className="btn btn-primary">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
};

export default HomePage;
