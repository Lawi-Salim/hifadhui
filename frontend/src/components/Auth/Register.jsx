import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    criteria: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fonction de validation de la force du mot de passe
  const validatePasswordStrength = (password) => {
    const criteria = {
      length: password.length >= 8,
      pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
    
    const score = Object.values(criteria).filter(Boolean).length;
    
    return { score, criteria };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validation en temps réel du mot de passe
    if (name === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }
    
    // Vérification en temps réel si les mots de passe correspondent
    if (name === 'confirmPassword' || name === 'password') {
      const password = name === 'password' ? value : formData.password;
      const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Mot de passe différent'
        }));
      } else if (confirmPassword && password === confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
    
    // Effacer l'erreur du champ modifié (sauf pour confirmPassword géré ci-dessus)
    if (errors[name] && name !== 'confirmPassword') {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else {
      const strength = validatePasswordStrength(formData.password);
      if (strength.score < 5) {
        const missing = [];
        if (!strength.criteria.length) missing.push('8 caractères minimum');
        if (!strength.criteria.uppercase) missing.push('1 majuscule');
        if (!strength.criteria.lowercase) missing.push('1 minuscule');
        if (!strength.criteria.number) missing.push('1 chiffre');
        if (!strength.criteria.special) missing.push('1 caractère spécial');
        newErrors.password = `Mot de passe trop faible. Manque: ${missing.join(', ')}`;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    return newErrors;
  };

  // Fonction pour obtenir la couleur de la barre de force
  const getStrengthColor = (score) => {
    if (score <= 2) return '#ef4444'; // Rouge
    if (score <= 3) return '#f59e0b'; // Orange
    if (score <= 4) return '#eab308'; // Jaune
    return '#10b981'; // Vert
  };

  // Fonction pour obtenir le texte de force
  const getStrengthText = (score) => {
    if (score === 0) return 'Aucun';
    if (score <= 2) return 'Faible';
    if (score <= 3) return 'Moyen';
    if (score <= 4) return 'Bon';
    return 'Très fort';
  };

  // Composant d'affichage des critères (version compacte)
  const PasswordCriteria = ({ criteria }) => {
    const criteriaList = [
      { key: 'length', label: '8+ car.', fullLabel: 'Au moins 8 caractères' },
      { key: 'uppercase', label: 'A-Z', fullLabel: 'Au moins 1 majuscule' },
      { key: 'lowercase', label: 'a-z', fullLabel: 'Au moins 1 minuscule' },
      { key: 'number', label: '0-9', fullLabel: 'Au moins 1 chiffre' },
      { key: 'special', label: '!@#', fullLabel: 'Au moins 1 caractère spécial' }
    ];

    return (
      <div className="password-criteria-compact">
        {criteriaList.map(({ key, label, fullLabel }) => (
          <div 
            key={key} 
            className={`criteria-badge ${criteria[key] ? 'valid' : 'invalid'}`}
            title={fullLabel}
          >
            <span className="criteria-icon">
              {criteria[key] ? <FiCheck /> : <FiX />}
            </span>
            <span className="criteria-text">{label}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const result = await register(formData.username, formData.email, formData.password);
    
    if (result.success) {
      navigate('/login');
    } else {
      setErrors({ general: result.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="back-to-home">
          <FiArrowLeft /> Retour à l'accueil
        </Link>
        <div className="auth-header">
          <div className="auth-logo"><FiLock /> hifadhwi</div>
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">
            Rejoignez hifadhwi et sécurisez vos documents
          </p>
        </div>

        {errors.general && (
          <div className="alert alert-error">
            {errors.general}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Votre nom d'utilisateur"
                disabled={loading}
              />
              {errors.username && (
                <div className="form-error">{errors.username}</div>
              )}
            </div>

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

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmer le mot de passe
              </label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error password-mismatch' : ''}`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="password-mismatch-message">{errors.confirmPassword}</div>
              )}
            </div>
          </div>

          {/* Indicateur de force du mot de passe - élargi sur toute la largeur */}
          <div className="password-strength-full-width">
            <div className="strength-header">
              <span className="strength-label">Force du mot de passe :</span>
              {formData.password && (
                <span 
                  className="strength-text" 
                  style={{ color: getStrengthColor(passwordStrength.score) }}
                >
                  {getStrengthText(passwordStrength.score)}
                </span>
              )}
            </div>
            <div className="strength-bar">
              <div 
                className="strength-fill"
                style={{
                  width: formData.password ? `${(passwordStrength.score / 5) * 100}%` : '0%',
                  backgroundColor: formData.password ? getStrengthColor(passwordStrength.score) : 'var(--border-color)'
                }}
              />
            </div>
            {/* Critères toujours visibles sur une ligne */}
            <PasswordCriteria criteria={passwordStrength.criteria} />
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
                Création...
              </>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Déjà un compte ?{' '}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
