// const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"
const API_URL = process.env.REACT_APP_API_URL || "/api"

let authToken = null

const setAuthToken = (token) => {
  authToken = token
}

const removeAuthToken = () => {
  authToken = null
}

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  // Log pour debug
  console.log("Headers envoyés pour API :", headers)
  return headers
}

const handleResponse = async (response) => {
  // Vérifier le type de contenu de la réponse
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    // Si ce n'est pas du JSON, on lit le texte pour le debug
    const text = await response.text();
    console.error('Réponse non-JSON reçue:', text);
    throw new Error(`Réponse invalide du serveur: ${response.status} ${response.statusText}`);
  }

  const data = await response.json()

  if (!response.ok) {
    const error = (data && data.message) || response.statusText
    throw new Error(error)
  }

  return data
}

// Authentification
const register = async (username, email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  })

  return handleResponse(response)
}

const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  return handleResponse(response)
}

// Photos
const getPhotos = async (accessToken) => {
  const headers = { "Content-Type": "application/json" }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }
  const response = await fetch(`${API_URL}/photos`, {
    headers,
  })
  return handleResponse(response)
}

const getPhoto = async (id) => {
  const response = await fetch(`${API_URL}/photos/${id}`, {
    headers: getHeaders(),
  })

  return handleResponse(response)
}

const uploadPhoto = async (photoData, accessToken) => {
  const headers = { "Content-Type": "application/json" }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }
  const response = await fetch(`${API_URL}/photos`, {
    method: "POST",
    headers,
    body: JSON.stringify(photoData),
  })
  return handleResponse(response)
}

const deletePhoto = async (id) => {
  const response = await fetch(`${API_URL}/photos/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  })

  return handleResponse(response)
}

export default {
  setAuthToken,
  removeAuthToken,
  register,
  login,
  getPhotos,
  getPhoto,
  uploadPhoto,
  deletePhoto,
}

