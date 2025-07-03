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

  return headers
}

const handleResponse = async (response) => {
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
const getPhotos = async () => {
  const response = await fetch(`${API_URL}/photos`, {
    headers: getHeaders(),
  })

  return handleResponse(response)
}

const getPhoto = async (id) => {
  const response = await fetch(`${API_URL}/photos/${id}`, {
    headers: getHeaders(),
  })

  return handleResponse(response)
}

const uploadPhoto = async (photoData) => {
  const headers = { "Content-Type": "application/json" }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
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

