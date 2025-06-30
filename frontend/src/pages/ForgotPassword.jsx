"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import "./Auth.css"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError("")
      setLoading(true)

      // Simuler l'envoi d'un email de réinitialisation
      // Dans une application réelle, vous appelleriez votre API
      // await api.forgotPassword(email)

      // Simulation d'un délai pour l'envoi d'email
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi de l'email de réinitialisation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Mot de passe oublié</h2>

        {error && <div className="error-message">{error}</div>}

        {success ? (
          <div className="success-container">
            <div className="success-message">
              Un email de réinitialisation a été envoyé à {email} si ce compte existe dans notre système.
            </div>
            <p className="success-instructions">
              Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de
              passe.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="auth-instructions">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner-sm"></span>
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                <Link to="/login">Retour à la connexion</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword

