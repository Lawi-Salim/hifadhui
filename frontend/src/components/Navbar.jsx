"use client"
import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import "./Navbar.css"

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth()
  const { theme, setTheme, isDarkTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Détecte le défilement pour changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Ferme le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsDropdownOpen(false)
  }, [location])

  // Ferme le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    setIsDropdownOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <nav className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="logo">
            <span className="logo-icon">📸</span>
            <span className="logo-text">Hifadhui</span>
          </Link>

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Menu">
            <span className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}></span>
          </button>
        </div>

        <div className={`navbar-menu ${isMobileMenuOpen ? "active" : ""}`}>
          <div className="navbar-links">
            <Link to="/" className={`navbar-item ${location.pathname === "/" ? "active" : ""}`}>
              Accueil
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/dashboard" className={`navbar-item ${location.pathname === "/dashboard" ? "active" : ""}`}>
                  Photos
                </Link>
                <Link to="/upload" className={`navbar-item ${location.pathname === "/upload" ? "active" : ""}`}>
                  Ajouter
                </Link>
              </>
            )}
          </div>

          {isAuthenticated ? (
            <div className="user-profile" ref={dropdownRef}>
              <div className="user-profile-button" onClick={toggleDropdown}>
                <div className="user-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
                <span className="username">{currentUser.username}</span>
                <span className={`dropdown-arrow ${isDropdownOpen ? "up" : "down"}`}></span>
              </div>

              {isDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-section">
                    <div className="dropdown-section-title">Thème</div>
                    <button
                      onClick={() => changeTheme("light")}
                      className={`dropdown-item theme-option ${theme === "light" ? "active" : ""}`}
                    >
                      {/* <span className="theme-icon">☀️</span> */}
                      Clair
                    </button>
                    <button
                      onClick={() => changeTheme("dark")}
                      className={`dropdown-item theme-option ${theme === "dark" ? "active" : ""}`}
                    >
                      {/* <span className="theme-icon">🌙</span> */}
                      Sombre
                    </button>
                    <button
                      onClick={() => changeTheme("system")}
                      className={`dropdown-item theme-option ${theme === "system" ? "active" : ""}`}
                    >
                      {/* <span className="theme-icon">💻</span> */}
                      Système
                    </button>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    {/* <span className="dropdown-icon">🚪</span> */}
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-primary">
                Inscription
              </Link>
              <button
                onClick={toggleTheme}
                className="btn btn-icon theme-toggle-btn"
                aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

