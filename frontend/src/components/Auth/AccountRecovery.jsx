import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiShield, FiArrowLeft, FiCheck, FiAlertCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import './Auth.css';

const AccountRecovery = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountData, setAccountData] = useState(null);

  // Vérifier la validité du token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token de récupération manquant');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/auth/account-recovery/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
          setAccountData(data.user);
        } else {
          setError(data.details || data.error || 'Token de récupération invalide ou expiré');
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

  const handleRecovery = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/auth/account-recovery/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Compte récupéré avec succès ! Vous pouvez maintenant vous connecter.',
              type: 'success'
            }
          });
        }, 3000);
      } else {
        setError(data.details || data.error || 'Une erreur est survenue lors de la récupération');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
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
            <div className="auth-logo"><FiShield /> Hifadhui</div>
            <h1 className="auth-title">Vérification...</h1>
            <p className="auth-subtitle">
              Vérification de votre lien de récupération de compte.
            </p>
          </div>
          <div className="loading-spinner">
            <FiRefreshCw className="spin" />
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
            <div className="auth-logo"><FiShield /> Hifadhui</div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: 'var(--error-color)', 
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
              <h1 className="auth-title">Lien de récupération invalide</h1>
              <p className="auth-subtitle">
                {error}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
                Le lien de récupération a peut-être expiré ou été déjà utilisé.
              </p>
            </div>
          </div>

          <div className="auth-footer">
            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              Réinitialiser mon mot de passe
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
            <div className="auth-logo"><FiShield /> Hifadhui</div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: 'var(--success-color)', 
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
              <h1 className="auth-title">Compte récupéré !</h1>
              <p className="auth-subtitle">
                Votre compte a été récupéré avec succès. La suppression a été annulée.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
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
          <div className="auth-logo"><FiShield /> Hifadhui</div>
          <h1 className="auth-title">Récupération de compte</h1>
          <p className="auth-subtitle">
            Votre compte est programmé pour suppression. Vous pouvez le récupérer maintenant.
          </p>
        </div>

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

        {accountData && (
          <div className="recovery-info">
            <div className="account-info">
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
                Informations du compte
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Email :</span>
                  <span className="info-value">{accountData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nom d'utilisateur :</span>
                  <span className="info-value">{accountData.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Demande de suppression :</span>
                  <span className="info-value">
                    {new Date(accountData.deletedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="countdown-warning">
              <div className="countdown-header">
                <FiClock style={{ color: 'var(--warning-color)' }} />
                <h3>Temps restant</h3>
              </div>
              <div className="countdown-value">
                {accountData.daysRemaining} jour{accountData.daysRemaining > 1 ? 's' : ''}
              </div>
              <div className="countdown-date">
                Suppression programmée le {new Date(accountData.deletionScheduledAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="recovery-warning">
              <h4>⚠️ Que se passe-t-il si vous récupérez votre compte ?</h4>
              <ul>
                <li>✅ Votre compte sera immédiatement réactivé</li>
                <li>✅ La suppression programmée sera annulée</li>
                <li>✅ Vous pourrez vous reconnecter normalement</li>
                <li>✅ Tous vos fichiers et dossiers seront préservés</li>
                <li>✅ Vos liens de partage seront réactivés</li>
              </ul>
            </div>
          </div>
        )}

        <div className="recovery-actions">
          <button
            onClick={handleRecovery}
            className="btn btn-primary recovery-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <FiRefreshCw className="spin" style={{ marginRight: '0.5rem' }} />
                Récupération en cours...
              </>
            ) : (
              <>
                <FiShield style={{ marginRight: '0.5rem' }} />
                Récupérer mon compte
              </>
            )}
          </button>

          <p style={{ 
            textAlign: 'center', 
            margin: '1rem 0', 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem' 
          }}>
            Si vous ne souhaitez pas récupérer votre compte, fermez simplement cette page.
          </p>
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
};

export default AccountRecovery;
