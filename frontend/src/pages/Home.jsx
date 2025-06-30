"use client"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import "./Home.css"

const Home = () => {
  const { isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content animate-fade-in">
          <h1>Protégez vos créations photographiques</h1>
          <p className="hero-subtitle">
            Hifadhui vous offre un espace sécurisé pour stocker, organiser et protéger vos œuvres photographiques
          </p>

          <div className="hero-buttons">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Voir mes photos
                </Link>
                <Link to="/upload" className="btn btn-outline btn-lg">
                  Ajouter une photo
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Commencer gratuitement
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Se connecter
                </Link>
              </>
            )}
            {/* <button
              onClick={toggleTheme}
              className="btn btn-icon theme-toggle-btn"
              aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button> */}
          </div>
        </div>
        <div className="hero-image animate-slide-up">
          <img
            src="http://localhost:5000/uploads/Hifahdui.png"
            alt="Protection de photos"
            className="rounded-lg shadow-lg"
            onContextMenu={(e) => e.preventDefault()}
            draggable="false"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-header">
          <h2>Pourquoi choisir Hifadhui?</h2>
          <p>Des fonctionnalités conçues pour les créateurs et photographes</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Sécurité avancée</h3>
            <p>
              Vos photos sont protégées par un système d'authentification robuste et accessibles uniquement par vous
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Accessible partout</h3>
            <p>Consultez et gérez vos créations depuis n'importe quel appareil, à tout moment</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Interface intuitive</h3>
            <p>Une expérience utilisateur fluide et moderne pour gérer facilement votre collection</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏷️</div>
            <h3>Organisation simplifiée</h3>
            <p>Ajoutez des titres et descriptions à vos photos pour les retrouver facilement</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>Comment ça fonctionne</h2>
          <p>Trois étapes simples pour protéger vos créations photographiques</p>
        </div>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Créez votre compte</h3>
              <p>Inscrivez-vous gratuitement en quelques secondes pour accéder à votre espace personnel sécurisé</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Téléchargez vos photos</h3>
              <p>Ajoutez facilement vos créations avec des titres et descriptions pour les organiser</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Gérez votre collection</h3>
              <p>Visualisez, partagez et protégez vos œuvres en toute simplicité</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="gallery-preview">
        <div className="section-header">
          <h2>Exemples de créations</h2>
          <p>Découvrez comment Hifadhui protège vos œuvres</p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-item">
            <img
              src="http://localhost:5000/uploads/MechaByte.png"
              alt="MechaByte"
              className="gallery-image"
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
            <div className="gallery-overlay">
              <span className="gallery-watermark">© Protégé par Hifadhui</span>
            </div>
          </div>

          <div className="gallery-item">
            <img
              src="http://localhost:5000/uploads/AstroBot.png"
              alt="AstroBot"
              className="gallery-image"
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
            <div className="gallery-overlay">
              <span className="gallery-watermark">© Protégé par Hifadhui</span>
            </div>
          </div>

          <div className="gallery-item">
            <img
              src="http://localhost:5000/uploads/ByteBot.png"
              alt="ByteBot"
              className="gallery-image"
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
            <div className="gallery-overlay">
              <span className="gallery-watermark">© Protégé par Hifadhui</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Prêt à protéger vos créations?</h2>
          <p>Rejoignez des milliers de créateurs qui font confiance à Hifadhui pour sécuriser leurs œuvres</p>

          {isAuthenticated ? (
            <Link to="/upload" className="btn btn-primary btn-lg">
              Ajouter mes photos
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg">
              Commencer maintenant
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home

