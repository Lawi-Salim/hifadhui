import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const TestAuth = () => {
  try {
    const { user } = useAuth();
    return (
      <div>
        <h2>Test useAuth</h2>
        <p>useAuth fonctionne !</p>
        <p>Utilisateur: {user ? user.email : 'Non connecté'}</p>
      </div>
    );
  } catch (error) {
    return (
      <div>
        <h2>Test useAuth</h2>
        <p style={{ color: 'red' }}>Erreur: {error.message}</p>
      </div>
    );
  }
};

export default TestAuth;
