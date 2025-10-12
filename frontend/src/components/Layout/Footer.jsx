import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiMail, FiGithub, FiTwitter, FiLinkedin, FiHeart } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Footer Top */}
        <div className="footer-top">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand">
              <img src="/hifadhui-name.svg" alt="Hifadhui" className="footer-brand-logo" />
            </div>
            <p className="footer-description">
              Votre coffre-fort numérique sécurisé pour stocker et partager vos documents importants avec une preuve de propriété incontestable.
            </p>
            <div className="footer-social">
              <button className="social-link" aria-label="GitHub">
                <FiGithub />
              </button>
              <button className="social-link" aria-label="Twitter">
                <FiTwitter />
              </button>
              <button className="social-link" aria-label="LinkedIn">
                <FiLinkedin />
              </button>
              <a href="mailto:contact@hifadhui.site" className="social-link" aria-label="Email">
                <FiMail />
              </a>
              <button className="social-link" aria-label="WhatsApp">
                <FaWhatsapp />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Liens rapides</h3>
            <ul className="footer-links">
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/about">A propos</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div className="footer-section">
            <h3 className="footer-title">Fonctionnalités</h3>
            <ul className="footer-links">
              <li><span>Stockage sécurisé</span></li>
              <li><span>Partage temporaire</span></li>
              <li><span>Preuve de propriété</span></li>
              <li><span>Chiffrement SHA-256</span></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h3 className="footer-title">Support</h3>
            <ul className="footer-links">
              <li><a href="mailto:support@hifadhui.site">Support technique</a></li>
              <li><Link to="/privacy">Politique de confidentialité</Link></li>
              <li><Link to="/terms">Conditions d'utilisation</Link></li>
              <li><a href="#security">Sécurité</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} Hifadhui. Tous droits réservés.
            </p>
            <div className="footer-legal-links">
              <Link to="/privacy" className="legal-link">Confidentialité</Link>
              <span className="separator">•</span>
              <Link to="/terms" className="legal-link">Conditions</Link>
              <span className="separator">•</span>
              <Link to="/contact" className="legal-link">Contact</Link>
            </div>
            <p className="footer-made-with">
              Fait avec <FiHeart className="heart-icon" /> pour la sécurité de vos documents
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
