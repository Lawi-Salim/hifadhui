"use client"
import { Link } from "react-router-dom"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"
import "./Footer.css"

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { theme, setTheme } = useTheme()
  const { isAuthenticated } = useAuth()

  return (
    <footer className="footer">
      <div className="footer-container">
        {!isAuthenticated ? (
          // Footer complet pour les visiteurs non connectés
          <>
            <div className="footer-top">
              <div className="footer-brand">
                <Link to="/" className="footer-logo">
                  <span className="footer-logo-icon">📸</span>
                  <span className="footer-logo-text">Hifadhui</span>
                </Link>
                <p className="footer-tagline">Protégez vos créations photographiques en toute sécurité</p>
              </div>

              <div className="footer-links">
                <div className="footer-links-column">
                  <h3 className="footer-links-title">Navigation</h3>
                  <ul className="footer-links-list">
                    <li>
                      <Link to="/">Accueil</Link>
                    </li>
                    <li>
                      <Link to="/dashboard">Mes Photos</Link>
                    </li>
                    <li>
                      <Link to="/upload">Ajouter</Link>
                    </li>
                  </ul>
                </div>

                <div className="footer-links-column">
                  <h3 className="footer-links-title">Compte</h3>
                  <ul className="footer-links-list">
                    <li>
                      <Link to="/login">Connexion</Link>
                    </li>
                    <li>
                      <Link to="/register">Inscription</Link>
                    </li>
                    <li>
                      <Link to="/contact">Contactez-nous</Link>
                    </li>
                  </ul>
                </div>

                <div className="footer-links-column">
                  <h3 className="footer-links-title">Mentions Légales</h3>
                  <ul className="footer-links-list">
                    <li>
                      <Link to="/terms">Conditions d'utilisation</Link>
                    </li>
                    <li>
                      <Link to="/privacy-policy">Politique de confidentialité</Link>
                    </li>
                    <li>
                      <Link to="/about">À propos</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p className="footer-copyright">&copy; {currentYear} Hifadhui - Tous droits réservés</p>
              <p className="footer-credits">
                Conçu avec ❤️ pour protéger vos créations développé par
                <em>
                  <strong> Wakati Mavuna</strong>
                </em>
              </p>
            </div>
          </>
        ) : (
          // Footer minimaliste pour les utilisateurs connectés
          <div className="footer-minimal">
            <div className="footer-minimal-content">
              <div className="footer-minimal-links">
                <Link to="/about" className="footer-minimal-link">À propos</Link>
                <span className="footer-minimal-separator">•</span>
                <Link to="/contact" className="footer-minimal-link">Contact</Link>
                <span className="footer-minimal-separator">•</span>
                <Link to="/terms" className="footer-minimal-link">CGU</Link>
              </div>
              <div className="footer-minimal-credits">
                <p>&copy; {currentYear} Hifadhui - Développé avec ❤️ par <strong>Wakati Mavuna</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  )
}

export default Footer

