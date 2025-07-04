"use client"

import { createContext, useState, useContext, useEffect } from "react"
import api from "../services/api"
import { supabase } from "../services/supabase"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Vérifier la session Supabase
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        // Récupérer le user du localStorage (pour le username)
        const user = JSON.parse(localStorage.getItem("user"));
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await api.login(email, password)
      const { user } = response

      // Récupérer le username depuis la nouvelle API
      let username = '';
      try {
        const profileRes = await fetch(`/api/auth/profile?id=${user.id}`)
        if (profileRes.ok) {
          const profile = await profileRes.json()
          username = profile.username
        }
      } catch (e) {
        console.warn("Erreur lors de la récupération de username :", e);
      }

      const userWithUsername = { ...user, username }
      localStorage.setItem("user", JSON.stringify(userWithUsername))

      setCurrentUser(userWithUsername)
      setIsAuthenticated(true)

      return userWithUsername
    } catch (err) {
      setError(err.message || "Erreur de connexion")
      throw err
    }
  }

  const register = async (username, email, password) => {
    try {
      setError(null)
      const response = await api.register(username, email, password)
      return response
    } catch (err) {
      setError(err.message || "Erreur d'inscription")
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setCurrentUser(null)
    setIsAuthenticated(false)
    api.removeAuthToken()
  }

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

