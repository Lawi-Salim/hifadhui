"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import PhotoCard from "../components/PhotoCard"
import api from "../services/api"
import "./Dashboard.css"
import { getSupabaseClient } from '../supabaseClient'

const Dashboard = () => {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const { data: sessionData } = await getSupabaseClient().auth.getSession();
      const access_token = sessionData.session ? sessionData.session.access_token : null;
      const data = await api.getPhotos(access_token)
      setPhotos(data)
      setError(null)
    } catch (err) {
      setError("Erreur lors du chargement des photos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async (id) => {
    try {
      setLoading(true)
      await api.deletePhoto(id)
      setPhotos(photos.filter((photo) => photo.id !== id))
    } catch (err) {
      setError("Erreur lors de la suppression de la photo")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.description && photo.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.upload_date) - new Date(a.upload_date)
    } else if (sortBy === "oldest") {
      return new Date(a.upload_date) - new Date(b.upload_date)
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title)
    }
    return 0
  })

  if (loading && photos.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement de vos photos...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Ma Collection</h1>
          <p className="photo-count">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          Ajouter une photo
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {photos.length > 0 && (
        <div className="dashboard-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher par titre ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="sort-container">
            <label htmlFor="sort">Trier par:</label>
            <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="newest">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="title">Titre</option>
            </select>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h2>Aucune photo pour le moment</h2>
          <p>Commencez à ajouter vos créations pour les protéger</p>
          <Link to="/upload" className="btn btn-primary btn-lg">
            Ajouter ma première photo
          </Link>
        </div>
      ) : sortedPhotos.length === 0 ? (
        <div className="empty-search">
          <p>Aucun résultat pour "{searchTerm}"</p>
          <button onClick={() => setSearchTerm("")} className="btn btn-outline">
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="photos-grid">
          {sortedPhotos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard

// The Dashboard component is a functional component that displays the user's photo collection. The component fetches the user's photos from the API using the getPhotos method from the api service. The component uses the useState and useEffect hooks to manage the state of the photos, loading status, error message, search term, and sort order. The component includes a search input and a sort select to filter and sort the photos. The component also includes a list of PhotoCard components to display the user's photos. The component handles the delete action for each photo using the handleDeletePhoto function. The component is styled using CSS in the Dashboard.css file.