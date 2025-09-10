import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Affichez un spinner ou un composant de chargement ici si nécessaire
    return <div>Chargement...</div>;
  }

  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AdminRoute;
