import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar.jsx';
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ForgotPassword from './components/Auth/ForgotPassword.jsx';
import ResetPassword from './components/Auth/ResetPassword.jsx';
import AccountRecovery from './components/Auth/AccountRecovery.jsx';
import AuthCallback from './components/Auth/AuthCallback.jsx';
import HomePage from './pages/HomePage.jsx';
import Contact from './pages/Contact.jsx';
import PrivacyPolicy from './components/privacy/PrivacyPolicy.jsx';
import TermsOfService from './components/privacy/TermsOfService.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import FileUpload from './components/Files/FileUpload.jsx';
import FilesPage from './components/Files/FilesPage.jsx';
import Images from './components/Images.jsx';
import DossiersPage from './components/Dossiers/DossiersPage.jsx';
import DossierDetailsPage from './components/Dossiers/DossierDetailsPage.jsx';
import SharedFilePage from './pages/SharedFilePage.jsx';
import SettingsPage from './components/Settings/SettingsPage.jsx';
import DeleteAccountWizard from './components/Settings/DeleteAccount/DeleteAccountWizard.jsx';
import ListeUtilisateurs from './components/Admin/ListeUtilisateurs.jsx';
import AdminDashboard from './components/Admin/AdminDashboard.jsx';
import ActivityPage from './components/Admin/ActivityPage.jsx';
import SystemPage from './components/Admin/SystemPage.jsx';
import AnalyticsPage from './components/Admin/AnalyticsPage.jsx';
import ReportsPage from './components/Admin/ReportsPage.jsx';
import TechnicalPage from './components/Admin/TechnicalPage.jsx';
import UserImages from './components/Admin/UserImages.jsx';
import UserFiles from './components/Admin/UserFiles.jsx';
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '100vh' }}>
        <div className="loading"></div>
      </div>
    );
  }
  
  // Si utilisateur connecté, rediriger vers le bon dashboard selon le rôle
  if (user) {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={dashboardPath} />;
  }
  
  // Permettre l'accès à la page d'accueil même si l'utilisateur a déjà été connecté
  // La redirection automatique vers login est supprimée pour permettre le retour à l'accueil
  
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
          <Route path="/reset-password/:token" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          <Route path="/account-recovery/:token" element={
            <PublicRoute>
              <AccountRecovery />
            </PublicRoute>
          } />
          <Route path="/contact" element={
            <PublicRoute>
              <Contact />
            </PublicRoute>
          } />
          <Route path="/privacy" element={
            <PublicRoute>
              <PrivacyPolicy />
            </PublicRoute>
          } />
          <Route path="/terms" element={
            <PublicRoute>
              <TermsOfService />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/auth/callback" element={<AuthCallback />} />
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
          <Route path="/settings/delete-account/*" element={
            <PrivateRoute>
              <DeleteAccountWizard />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          } />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<ListeUtilisateurs />} />
            <Route path="/admin/images" element={<UserImages />} />
            <Route path="/admin/files" element={<UserFiles />} />
            <Route path="/admin/activity" element={<ActivityPage />} />
            <Route path="/admin/system" element={<SystemPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/technical" element={<TechnicalPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route path="/share/:token" element={<SharedFilePage />} />
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
