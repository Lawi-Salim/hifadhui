"use client"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import UploadPhoto from "./pages/UploadPhoto"
import PhotoDetail from "./pages/PhotoDetail"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import TermsOfService from "./pages/TermsOfService"
import PrivacyPolicy from "./pages/PrivacyPolicy"
import About from "./pages/About"
import Contact from "./pages/Contact"
import "./App.css"
import { useEffect } from "react"
import api from "./services/api";
import PitchaDetail from "./pages/PitchaDetail";

// Fonction pour précharger les images
const preloadImages = () => {
  const imageUrls = [
    "/uploads/MechaByte.png",
    "/uploads/AstroBot.png",
    "/uploads/ByteBot.png",
    "/uploads/Hifahdui.png",
  ]

  imageUrls.forEach((url) => {
    const img = new Image()
    img.src = url
  })
}

// Route protégée qui vérifie si l'utilisateur est connecté
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return children
}

function AppWithAuth() {
  const location = useLocation();
  const isPitchaDetail = location.pathname.startsWith("/pitcha-detail/");

  // Le token est maintenant géré directement par Supabase dans AuthContext
  // Plus besoin de chercher dans le localStorage

  return (
    <Router>
      <div className="app">
        {!isPitchaDetail && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPhoto />
                </ProtectedRoute>
              }
            />
            <Route
              path="/photos/:id"
              element={
                <ProtectedRoute>
                  <PhotoDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/pitcha-detail/:id" element={<PitchaDetail />} />
          </Routes>
        </main>
        {!isPitchaDetail && <Footer />}
      </div>
    </Router>
  );
}

function App() {
  // Précharger les images au chargement de l'application
  useEffect(() => {
    preloadImages()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

