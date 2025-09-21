import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiKey, FiArrowLeft, FiMail, FiCheck } from 'react-icons/fi';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la demande:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo"><FiKey /> Hifadhui</div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: '#10b981', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem',
                color: 'white',
                fontSize: '24px'
              }}>
                <FiCheck />
              </div>
              <h1 className="auth-title">Email envoyé !</h1>
              <p className="auth-subtitle">
                {message}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                Vérifiez votre boîte de réception et vos spams. Le lien expire dans 15 minutes.
              </p>
            </div>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FiArrowLeft />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo"><FiKey /> Hifadhui</div>
          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-subtitle">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FiMail style={{ marginRight: '0.5rem' }} />
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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
