"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import "./Legal.css"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulation d'envoi (remplacez par votre logique d'envoi réelle)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus("success")
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      })
      
      // Reset du statut après 5 secondes
      setTimeout(() => setSubmitStatus(null), 5000)
    }, 2000)
  }

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Contactez-nous</h1>
        <p className="legal-updated">Nous sommes là pour vous aider</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>Informations de contact</h2>
          <div style={{ marginBottom: "2rem" }}>
            <p><strong>Email :</strong> wakati.mavuna@gmail.com</p>
            <p><strong>Site web :</strong> <a href="https://hifadhui.vercel.app" target="_blank" rel="noopener noreferrer">https://hifadhui.vercel.app</a></p>
            <p><strong>Développeur :</strong> Wakati Mavuna</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Formulaire de contact</h2>
          <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="name" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Nom complet *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="subject" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Sujet *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="message" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  resize: "vertical"
                }}
              />
            </div>

            {submitStatus === "success" && (
              <div style={{
                padding: "1rem",
                backgroundColor: "#d4edda",
                color: "#155724",
                borderRadius: "4px",
                marginBottom: "1rem"
              }}>
                ✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "0.75rem 2rem",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </button>
          </form>
        </section>

        <section className="legal-section">
          <h2>Horaires de réponse</h2>
          <p>
            Nous nous efforçons de répondre à tous les messages dans un délai de 24 à 48 heures.
            Pour les questions urgentes concernant la sécurité de votre compte, nous répondons généralement plus rapidement.
          </p>
        </section>

        <section className="legal-section">
          <h2>Types de demandes</h2>
          <ul>
            <li><strong>Support technique :</strong> Problèmes d'utilisation, bugs, questions sur les fonctionnalités</li>
            <li><strong>Questions légales :</strong> Droits d'auteur, protection des créations, conformité</li>
            <li><strong>Suggestions :</strong> Améliorations, nouvelles fonctionnalités</li>
            <li><strong>Partenariats :</strong> Collaborations, intégrations</li>
            <li><strong>Autres :</strong> Toute autre question concernant Hifadhui</li>
          </ul>
        </section>
      </div>

      <div className="legal-footer">
        <Link to="/" className="btn btn-outline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

export default Contact 