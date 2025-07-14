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
      setError("Erreur lors du chargement de la photo")
      console.error(err)
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
            {/* Filigrane toujours affiché, bouton masqué */}
            {showWatermark && <div className="photo-watermark">© Hifadhui</div>}
          </div>
          {/* Le bouton 'Masquer le filigrane' est retiré */}
        </div>
        <div className="photo-detail-sidebar">
          <div className="photo-details-card">
            <h2>Détails</h2>
            {/* Miniature de la photo */}
            <div className="photo-thumbnail" style={{ marginBottom: 12 }}>
              <img src={photo.filepath} alt="Miniature" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
            </div>
            <div>
              <strong>Description</strong>
              <div>{photo.description || "Aucune description"}</div>
            </div>
            <div>
              <strong>Date d'ajout</strong>
              <div>{formatDate(photo.upload_date)}</div>
            </div>
            {/* Identifiant copiable */}
            <div>
              <strong>Identifiant</strong>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 12, background: "#222", padding: "2px 6px", borderRadius: 4 }}>{photo.id}</span>
                <button
                  className="btn btn-xs"
                  style={{ marginLeft: 8 }}
                  onClick={() => navigator.clipboard.writeText(photo.id)}
                  title="Copier l'identifiant"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
          {/* ... Protection ... */}
        </div>
      </div>
    </div>
  )
}

export default PhotoDetail

// Compare this snippet from frontend/src/components/Footer.jsx: