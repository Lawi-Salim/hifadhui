"use client"
import { useState } from "react"
import { Link } from "react-router-dom"
import { FaShareAlt } from "react-icons/fa"
import "./PhotoCard.css"

const PhotoCard = ({ photo, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
      onDelete(photo.id)
    }
  }

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 1. Rendre la photo publique pour 10 minutes
    await fetch('/api/photos/publicity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: photo.id,
        is_public: true,
        public_until: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
    });
    // 2. Copier le lien
    const url = `${window.location.origin}/pitcha-detail/${photo.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    return false
  }

  return (
    <div className="photo-card" style={{ position: "relative" }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Bouton de partage en haut à droite */}
      <button
        onClick={handleShare}
        className="share-btn"
        title="Partager"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          borderRadius: "50%",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#222",
          color: "#fff",
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 2,
          cursor: "pointer",
        }}
      >
        <FaShareAlt size={18} />
      </button>
      {copied && (
        <span style={{
          position: "absolute",
          top: 12,
          right: 56,
          color: "#4caf50",
          fontSize: 12,
          background: "#222",
          padding: "2px 8px",
          borderRadius: 6,
          zIndex: 2,
        }}>
          Lien copié !
        </span>
      )}
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

