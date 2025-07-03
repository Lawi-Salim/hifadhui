"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import "./UploadPhoto.css"
import { useAuth } from "../contexts/AuthContext"
import { createClient } from '@supabase/supabase-js'

const cloudName = "ddxypgvuh"
const uploadPreset = "pitcha"

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY)

const UploadPhoto = () => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  const navigate = useNavigate()
  const { currentUser } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    processFile(selectedFile)
  }

  const processFile = (selectedFile) => {
    if (selectedFile) {
      if (!selectedFile.type.match("image.*")) {
        setError("Veuillez sélectionner une image")
        setFile(null)
        setPreview(null)
        return
      }

      setFile(selectedFile)

      // Créer un aperçu de l'image
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)

      setError("")
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      return setError("Veuillez sélectionner une image")
    }

    try {
      setLoading(true)
      setError("")
      // 1. Upload sur Cloudinary
      const formDataCloud = new FormData()
      formDataCloud.append("file", file)
      formDataCloud.append("upload_preset", uploadPreset)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formDataCloud,
        }
      )
      const data = await res.json()
      if (!data.secure_url) {
        throw new Error("Erreur lors de l'upload sur Cloudinary : " + (data.error?.message || ""))
      }
      // 2. Envoi à l'API avec l'URL Cloudinary
      // Récupérer le token d'accès Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const access_token = sessionData.session.access_token;
      await api.uploadPhoto({
        title,
        description,
        photoUrl: data.secure_url,
        user_id: currentUser.id
      }, access_token)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Erreur lors du téléchargement de la photo")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setUploading(true)
    setError("")
    setImageUrl("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      )
      const data = await res.json()
      if (data.secure_url) {
        setImageUrl(data.secure_url)
      } else {
        setError("Erreur lors de l'upload : " + (data.error?.message || ""))
      }
    } catch (e) {
      setError("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Ajouter une photo</h1>
        <p>Téléchargez et protégez vos créations photographiques</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-content">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Titre</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donnez un titre à votre photo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              placeholder="Décrivez votre création (optionnel)"
            />
          </div>

          <div className="form-group">
            <label>Photo</label>
            <div
              className={`file-drop-area ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" id="photo" accept="image/*" onChange={handleFileChange} className="file-input" />
              <div className="file-drop-content">
                <div className="upload-icon">📁</div>
                <p>Glissez et déposez votre image ici ou</p>
                <button type="button" className="btn btn-outline btn-sm">
                  Parcourir
                </button>
                <p className="file-format-info">JPG, PNG, GIF, WEBP, JFIF • Max 10MB</p>
              </div>
            </div>
          </div>

          {preview && (
            <div className="preview-container">
              <h3>Aperçu</h3>
              <div className="image-preview-wrapper">
                <img src={preview || "/placeholder.svg"} alt="Aperçu" className="image-preview" />
                <button
                  type="button"
                  className="remove-preview"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate("/dashboard")} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !file}>
              {loading ? (
                <>
                  <span className="loading-spinner-sm"></span>
                  Téléchargement...
                </>
              ) : (
                "Télécharger la photo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadPhoto
