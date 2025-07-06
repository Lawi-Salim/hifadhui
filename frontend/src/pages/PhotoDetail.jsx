"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import "./PhotoDetail.css"

const PhotoDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showWatermark, setShowWatermark] = useState(true)

  useEffect(() => {
    fetchPhoto()
  }, [id])

  const fetchPhoto = async () => {
    try {
      setLoading(true)
      const data = await api.getPhoto(id)
      setPhoto(data)
      setError(null)
    } catch (err) {
      console.error("Erreur lors du chargement de la photo:", err)
      
      // Messages d'erreur plus spécifiques
      if (err.message.includes("404")) {
        setError("Photo non trouvée. Elle a peut-être été supprimée ou déplacée.")
      } else if (err.message.includes("403")) {
        setError("Vous n'avez pas l'autorisation d'accéder à cette photo.")
      } else if (err.message.includes("Réponse invalide")) {
        setError("Erreur de communication avec le serveur. Veuillez réessayer.")
      } else {
        setError(`Erreur lors du chargement de la photo: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
      try {
        setLoading(true)
        await api.deletePhoto(id)
        navigate("/dashboard")
      } catch (err) {
        setError("Erreur lors de la suppression de la photo")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    return false
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement de la photo...</p>
      </div>
    )
  }

  if (error || !photo) {
    return (
      <div className="error-container">
        <div className="error-message">{error || "Photo non trouvée"}</div>
        <button onClick={() => navigate("/dashboard")} className="btn btn-primary">
          Retour à mes photos
        </button>
      </div>
    )
  }

  return (
    <div className="photo-detail-container">
      <div className="photo-detail-header">
        <button onClick={() => navigate("/dashboard")} className="btn btn-ghost back-btn">
          ← Retour
        </button>
        <h1>{photo.title}</h1>
        <button onClick={handleDelete} className="btn btn-danger">
          Supprimer
        </button>
      </div>

      <div className="photo-detail-content">
        <div className="photo-detail-main">
          <div className="photo-image-container">
            <img
              src={photo.filepath}
              alt={photo.title}
              className="photo-detail-image"
              onContextMenu={handleContextMenu}
              draggable="false"
            />
            {showWatermark && <div className="photo-watermark">© Hifadhui</div>}
          </div>
          <div className="photo-controls">
            <button
              className={`btn ${showWatermark ? "btn-outline" : "btn-primary"}`}
              onClick={() => setShowWatermark(!showWatermark)}
            >
              {showWatermark ? "Masquer le filigrane" : "Afficher le filigrane"}
            </button>
          </div>
        </div>

        <div className="photo-info">
          <div className="info-card">
            <h2>Détails</h2>

            <div className="info-group">
              <h3>Description</h3>
              <p>{photo.description || "Aucune description"}</p>
            </div>

            <div className="info-group">
              <h3>Date d'ajout</h3>
              <p>{formatDate(photo.upload_date)}</p>
            </div>

            <div className="info-group">
              <h3>Identifiant</h3>
              <p className="photo-id">#{photo.id}</p>
            </div>
          </div>

          <div className="info-card">
            <h2>Protection</h2>
            <p className="protection-info">
              Cette photo est protégée et stockée en toute sécurité dans votre espace personnel Hifadhui.
            </p>
            <div className="protection-status">
              <div className="status-item">
                <span className="status-label">Accès privé</span>
                <span className="status-value active">Activé</span>
              </div>
              <div className="status-item">
                <span className="status-label">Filigrane</span>
                <span className={`status-value ${showWatermark ? "active" : "inactive"}`}>
                  {showWatermark ? "Activé" : "Désactivé"}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Protection contre copie</span>
                <span className="status-value active">Activée</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoDetail

// Compare this snippet from frontend/src/components/Footer.jsx: