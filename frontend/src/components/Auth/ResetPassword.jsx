import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiKey, FiArrowLeft, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // Critères de validation du mot de passe
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Vérifier la validité du token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token manquant');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setError(data.error || 'Token invalide ou expiré');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setError('Erreur de connexion. Veuillez réessayer.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Valider le mot de passe en temps réel
  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Veuillez saisir un mot de passe');
      return;
    }

    if (!confirmPassword) {
      setError('Veuillez confirmer votre mot de passe');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Vérifier tous les critères
    const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
    if (!allCriteriaMet) {
      setError('Le mot de passe ne respecte pas tous les critères requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' }
          });
        }, 3000);
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Affichage pendant la vérification du token
  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo"><FiKey /> Hifadhwi</div>
            <h1 className="auth-title">Vérification...</h1>
            <p className="auth-subtitle">
              Vérification de la validité du lien de réinitialisation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage si le token est invalide
  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo"><FiKey /> Hifadhwi</div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: '#ef4444', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem',
                color: 'white',
                fontSize: '24px'
              }}>
                <FiAlertCircle />
              </div>
              <h1 className="auth-title">Lien invalide</h1>
              <p className="auth-subtitle">
                {error}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                Le lien de réinitialisation a peut-être expiré ou été déjà utilisé.
              </p>
            </div>
          </div>

          <div className="auth-footer">
            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              Demander un nouveau lien
            </Link>
            <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FiArrowLeft />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de succès
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo"><FiKey /> Hifadhwi</div>
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
              <h1 className="auth-title">Mot de passe réinitialisé !</h1>
              <p className="auth-subtitle">
                Votre mot de passe a été mis à jour avec succès.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                Redirection vers la page de connexion dans quelques secondes...
              </p>
            </div>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Se connecter maintenant
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
          <div className="auth-logo"><FiKey /> Hifadhwi</div>
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p className="auth-subtitle">
            Choisissez un mot de passe fort pour sécuriser votre compte.
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
            <label htmlFor="password" className="form-label">
              <FiLock style={{ marginRight: '0.5rem' }} />
              Nouveau mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input"
                placeholder="Votre nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <FiLock style={{ marginRight: '0.5rem' }} />
              Confirmer le mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer'
                }}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Critères de validation du mot de passe */}
          {password && (
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '0.5rem', 
              padding: '0.75rem', 
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#374151' }}>
                Critères requis :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: passwordCriteria.length ? '#10b981' : '#6b7280' }}>
                    {passwordCriteria.length ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordCriteria.length ? '#10b981' : '#6b7280' }}>
                    8 caractères min
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: passwordCriteria.uppercase ? '#10b981' : '#6b7280' }}>
                    {passwordCriteria.uppercase ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordCriteria.uppercase ? '#10b981' : '#6b7280' }}>
                    1 majuscule
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: passwordCriteria.lowercase ? '#10b981' : '#6b7280' }}>
                    {passwordCriteria.lowercase ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordCriteria.lowercase ? '#10b981' : '#6b7280' }}>
                    1 minuscule
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: passwordCriteria.number ? '#10b981' : '#6b7280' }}>
                    {passwordCriteria.number ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordCriteria.number ? '#10b981' : '#6b7280' }}>
                    1 chiffre
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <span style={{ color: passwordCriteria.special ? '#10b981' : '#6b7280' }}>
                    {passwordCriteria.special ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordCriteria.special ? '#10b981' : '#6b7280' }}>
                    1 caractère spécial (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !Object.values(passwordCriteria).every(Boolean)}
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
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

export default ResetPassword;
