import React from 'react';
import { Link } from 'react-router-dom';
import { FiKey, FiArrowLeft } from 'react-icons/fi';
import './Auth.css';

const ForgotPassword = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo"><FiKey /> hifadhwi</div>
          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-subtitle">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="votre@email.com"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Envoyer le lien
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <FiArrowLeft />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
