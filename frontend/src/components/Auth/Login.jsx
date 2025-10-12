import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { FaGoogle, FaFacebook, FaGithub } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  // Composant de connexion utilisateur
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Gérer les paramètres d'URL pour les messages
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const registered = urlParams.get('registered');
    const message = urlParams.get('message');
    const error = urlParams.get('error');

    if (registered === 'true' && message) {
      setSuccessMessage(decodeURIComponent(message));
    } else if (error && message) {
      setErrors({ general: decodeURIComponent(message) });
    }
  }, [location.search]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const shouldRemember = localStorage.getItem('rememberMe') === 'true';
    const from = location.state?.from || '/';

    if (shouldRemember && savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }

    // Rediriger vers la page d'accueil si l'utilisateur est déjà connecté
    if (location.state?.user) {
      navigate(from, { replace: true });
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, rememberMe);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }
        
        // Rediriger vers la page précédente ou le bon dashboard selon le rôle
        const defaultPath = result.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        const from = location.state?.from || defaultPath;
        navigate(from, { replace: true });
      } else {
        // Gestion spéciale pour le blocage temporaire
        if (result.blocked) {
          setErrors({ 
            general: result.message,
            blocked: true,
            retryAfter: result.retryAfter
          });
        } else {
          setErrors({ general: result.message || 'Échec de la connexion' });
        }
      }
    } catch (error) {
      setErrors({ general: error.message || 'Erreur lors de la connexion' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      // Rediriger vers l'endpoint Google OAuth du backend avec paramètre login
      const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const googleUrl = `${backendUrl}/api/v1/auth/google?action=login`;
      
      window.location.href = googleUrl;
      
    } catch (error) {
      console.error('❌ [GOOGLE LOGIN] Erreur lors de la redirection:', error);
      setErrors({ general: 'Erreur lors de la redirection vers Google' });
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="back-to-home">
          <FiArrowLeft /> Retour à l'accueil
        </Link>
        <div className="auth-header">
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">
            Accédez à votre coffre-fort numérique
          </p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div className={`alert ${errors.blocked ? 'alert-warning' : 'alert-error'}`}>
            {errors.blocked && (
              <div className="blocked-message">
                <strong>🔒 Accès temporairement bloqué</strong>
                <br />
                {errors.general}
                <br />
                <small>
                  Votre IP a été temporairement bloquée suite à plusieurs tentatives de connexion échouées.
                  Ceci est une mesure de sécurité automatique.
                </small>
              </div>
            )}
            {!errors.blocked && errors.general}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="votre@email.com"
              disabled={loading}
            />
            {errors.email && (
              <div className="form-error">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">Se souvenir de moi</span>
            </label>
            <Link to="/forgot-password" className="auth-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="oauth-m">
            <div className='label-oauth'>Ou se connecter avec</div>
            <div className="oauth-s">
              <button 
                type="button"
                className="btn-oauth"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FaGoogle size={18} />
                Google
              </button>

              <button 
                type="button"
                className="btn-oauth"
                disabled
                title="Bientôt disponible"
              >
                <FaFacebook size={18} />
                Facebook
              </button>

              <button
                type="button"
                className="btn-oauth"
                disabled
                title='Bientôt disponible'
              >
                <FaGithub size={18} />
                Github
              </button>
            </div>
          </div>  

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading"></span>
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
