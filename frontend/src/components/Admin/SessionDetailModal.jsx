import React from 'react';
import { 
  FiUser, 
  FiGlobe, 
  FiMonitor, 
  FiSmartphone, 
  FiClock, 
  FiMapPin,
  FiWifi,
  FiAlertTriangle,
  FiShield,
  FiX
} from 'react-icons/fi';
import './SessionDetailModal.css';

const SessionDetailModal = ({ session, isOpen, onClose }) => {
  if (!isOpen || !session) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatValue = (value, fallback = 'Non disponible') => {
    if (!value || value === 'null' || value === 'undefined' || value === 'Unknown' || value === 'unknown') {
      return <span className="undefined-value">{fallback}</span>;
    }
    return value;
  };

  const formatLocation = (session) => {
    const parts = [];
    if (session.city && session.city !== 'Unknown') parts.push(session.city);
    if (session.region && session.region !== 'Unknown') parts.push(session.region);
    if (session.country && session.country !== 'Unknown') parts.push(session.country);
    
    if (parts.length === 0) {
      return <span className="undefined-value">Localisation non disponible</span>;
    }
    return parts.join(', ');
  };

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <FiSmartphone />;
      case 'tablet':
        return <FiMonitor />;
      default:
        return <FiMonitor />;
    }
  };

  const getBrowserIcon = (browser) => {
    // Vous pouvez ajouter des icônes spécifiques par navigateur
    return <FiGlobe />;
  };

  return (
    <div className="session-modal-overlay" onClick={onClose}>
      <div className="session-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="session-modal-header">
          <h2>
            <FiUser />
            Détails de la session
          </h2>
          <button onClick={onClose} className="session-modal-close-btn">
            <FiX />
          </button>
        </div>

        <div className="session-modal-body">
          {/* Informations utilisateur */}
          <div className="session-section">
            <h3>
              <FiUser />
              Utilisateur
            </h3>
            <div className="session-info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{formatValue(session.user?.email || session.userEmail)}</p>
              </div>
              <div className="info-item">
                <label>Nom</label>
                <p>{formatValue(session.user?.username || session.userName)}</p>
              </div>
              <div className="info-item">
                <label>ID Utilisateur</label>
                <p className="session-id">{formatValue(session.userId)}</p>
              </div>
            </div>
          </div>

          {/* Informations réseau */}
          <div className="session-section">
            <h3>
              <FiWifi />
              Réseau
            </h3>
            <div className="session-info-grid">
              <div className="info-item">
                <label>Adresse IP</label>
                <p className="ip-address">{formatValue(session.ipAddress, 'IP non disponible')}</p>
              </div>
              <div className="info-item">
                <label>ISP</label>
                <p>{formatValue(session.isp, 'Fournisseur inconnu')}</p>
              </div>
              <div className="info-item">
                <label>Localisation</label>
                <p>{formatLocation(session)}</p>
              </div>
              <div className="info-item">
                <label>Fuseau horaire</label>
                <p>{formatValue(session.timezone, 'Fuseau inconnu')}</p>
              </div>
            </div>
          </div>

          {/* Informations appareil */}
          <div className="session-section">
            <h3>
              {getDeviceIcon(session.device)}
              Appareil
            </h3>
            <div className="session-info-grid">
              <div className="info-item">
                <label>Navigateur</label>
                <p>
                  {getBrowserIcon(session.browser)}
                  {formatValue(session.browser ? 
                    `${session.browser}${session.browserVersion ? ` ${session.browserVersion}` : ''}` : 
                    null, 'Navigateur inconnu')}
                </p>
              </div>
              <div className="info-item">
                <label>Système d'exploitation</label>
                <p>{formatValue(session.os, 'OS inconnu')}</p>
              </div>
              <div className="info-item">
                <label>Type d'appareil</label>
                <p>{formatValue(session.device, 'Desktop')}</p>
              </div>
              <div className="info-item full-width">
                <label>User-Agent</label>
                <p className="user-agent">{formatValue(session.userAgent, 'User-Agent non disponible')}</p>
              </div>
            </div>
          </div>

          {/* Informations session */}
          <div className="session-section">
            <h3>
              <FiClock />
              Session
            </h3>
            <div className="session-info-grid">
              <div className="info-item">
                <label>Début de session</label>
                <p>{formatDate(session.sessionStart) || <span className="undefined-value">Date inconnue</span>}</p>
              </div>
              <div className="info-item">
                <label>Fin de session</label>
                <p>{formatDate(session.sessionEnd) || <span className="active-status">Session active</span>}</p>
              </div>
              <div className="info-item">
                <label>Statut</label>
                <p className={`session-status ${session.isActive ? 'active' : 'inactive'}`}>
                  {session.isActive ? 'Active' : 'Terminée'}
                </p>
              </div>
              <div className="info-item">
                <label>ID Session</label>
                <p className="session-id">{formatValue(session.id, 'ID non disponible')}</p>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          {(session.isSuspicious || session.suspiciousReason) && (
            <div className="session-section security-section">
              <h3>
                <FiAlertTriangle />
                Sécurité
              </h3>
              <div className="session-info-grid">
                <div className="info-item">
                  <label>Session suspecte</label>
                  <p className={`suspicious-status ${session.isSuspicious ? 'suspicious' : 'safe'}`}>
                    {session.isSuspicious ? (
                      <>
                        <FiAlertTriangle />
                        Oui
                      </>
                    ) : (
                      <>
                        <FiShield />
                        Non
                      </>
                    )}
                  </p>
                </div>
                {session.suspiciousReason && (
                  <div className="info-item full-width">
                    <label>Raison</label>
                    <p className="suspicious-reason">{session.suspiciousReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SessionDetailModal;
