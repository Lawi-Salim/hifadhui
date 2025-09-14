import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar.jsx';
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ForgotPassword from './components/Auth/ForgotPassword.jsx';
import HomePage from './pages/HomePage.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import FileUpload from './components/Files/FileUpload.jsx';
import FilesPage from './components/Files/FilesPage.jsx';
import Images from './components/Images.jsx';
import CertificateList from './components/Certificates/CertificateList.jsx';
import DossiersPage from './components/Dossiers/DossiersPage.jsx';
import DossierDetailsPage from './components/Dossiers/DossierDetailsPage.jsx';
import SharedFilePage from './pages/SharedFilePage.jsx';
import ListeUtilisateurs from './components/Admin/ListeUtilisateurs.jsx';
import AdminDashboard from './components/Admin/AdminDashboard.jsx';
import AdminRoute from './components/routes/AdminRoute.jsx';
import './App.css';

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '100vh' }}>
        <div className="loading"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Composant pour rediriger les utilisateurs connectés
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '100vh' }}>
        <div className="loading"></div>
      </div>
    );
  }
  
  // Ne pas rediriger si on est sur une page de partage
  if (location.pathname.startsWith('/share/')) {
    return children;
  }
  
  // Si utilisateur connecté, vérifier s'il y a un paramètre redirect
  if (user) {
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (redirectPath) {
      // Permettre le traitement du redirect sur HomePage
      return children;
    }
    
    return <Navigate to="/dashboard" />;
  }
  
  // Si pas connecté mais a déjà été connecté avant, rediriger vers login
  const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore') === 'true';
  if (hasLoggedInBefore && window.location.pathname === '/') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  const shouldShowSidebar = user && location.pathname !== '/' && !location.pathname.startsWith('/share/');

  return (
    <div className="App">
      {shouldShowSidebar && <Sidebar />}
      <main className={shouldShowSidebar ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/files" element={
            <PrivateRoute>
              <FilesPage />
            </PrivateRoute>
          } />
          <Route path="/upload" element={
            <PrivateRoute>
              <FileUpload />
            </PrivateRoute>
          } />
          <Route path="/images" element={
            <PrivateRoute>
              <Images />
            </PrivateRoute>
          } />
          <Route path="/certificates" element={
            <PrivateRoute>
              <CertificateList />
            </PrivateRoute>
          } />
          <Route path="/dossiers" element={
            <PrivateRoute>
              <DossiersPage />
            </PrivateRoute>
          } />
          <Route path="/dossiers/:id" element={
            <PrivateRoute>
              <DossierDetailsPage />
            </PrivateRoute>
          } />
          <Route path="/dossiers/*" element={
            <PrivateRoute>
              <DossierDetailsPage />
            </PrivateRoute>
          } />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<ListeUtilisateurs />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route path="/share/:token" element={
            <PublicRoute>
              <SharedFilePage />
            </PublicRoute>
          } />
          <Route path="/" element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ViewModeProvider>
        <Router>
          <AppContent />
        </Router>
      </ViewModeProvider>
    </AuthProvider>
  );
}

export default App;
