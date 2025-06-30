"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import "./Auth.css"

const ResetPassword = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(true)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Vérifier la validité du token
    const verifyToken = async () => {
      try {
        // Dans une application réelle, vous appelleriez votre API
        // await api.verifyResetToken(token)

        // Simulation de vérification du token
        if (!token || token.length < 10) {
          setValidToken(false)
          setError("Le lien de réinitialisation est invalide ou a expiré.")
        }
      } catch (err) {
        setValidToken(false)
        setError("Le lien de réinitialisation est invalide ou a expiré.")
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas")
    }

    if (password.length < 6) {
      return setError("Le mot de passe doit contenir au moins 6 caractères")
    }

    try {
      setError("")
      setLoading(true)

      // Dans une application réelle, vous appelleriez votre API
      // await api.resetPassword(token, password)

      // Simulation d'un délai pour la réinitialisation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)
    } catch (err) {
      setError("Une erreur est survenue lors de la réinitialisation du mot de passe.")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (!validToken) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Lien invalide</h2>
          <div className="error-message">{error}</div>
          <Link to="/forgot-password" className="btn btn-primary btn-block">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Réinitialiser le mot de passe</h2>

        {error && <div className="error-message">{error}</div>}

        {success ? (
          <div className="success-container">
            <div className="success-message">Votre mot de passe a été réinitialisé avec succès.</div>
            <p className="success-instructions">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner-sm"></span>
                  Réinitialisation en cours...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword

