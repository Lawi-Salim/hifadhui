"use client"
import { useState } from "react"
import { Link } from "react-router-dom"
import "./PhotoCard.css"

const PhotoCard = ({ photo, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
      onDelete(photo.id)
    }
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    return false
  }

  return (
    <div className="photo-card" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Link to={`/photos/${photo.id}`} className="photo-link">
        <div className="photo-image-container">
          <img
            src={photo.filepath}
            alt={photo.title}
            className="photo-image"
            loading="lazy"
            onContextMenu={handleContextMenu}
            draggable="false"
          />
          <div className={`photo-overlay ${isHovered ? "active" : ""}`}>
            <h3 className="photo-title">{photo.title}</h3>
            {photo.description && (
              <p className="photo-description">
                {photo.description.substring(0, 100)}
                {photo.description.length > 100 ? "..." : ""}
              </p>
            )}
            <span className="photo-date">{formatDate(photo.upload_date)}</span>
          </div>
        </div>
      </Link>
      <div className={`photo-actions ${isHovered ? "active" : ""}`}>
        <Link to={`/photos/${photo.id}`} className="action-btn view-btn">
          Voir
        </Link>
        <button onClick={handleDelete} className="action-btn delete-btn">
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default PhotoCard

