import React, { useState, useEffect } from 'react';
import { 
  FiServer, 
  FiDatabase, 
  FiCloud, 
  FiAlertTriangle, 
  FiActivity,
  FiHardDrive,
  FiWifi,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw
} from 'react-icons/fi';
import './AdminDashboard.css';
import LoadingSpinner from '../Common/LoadingSpinner';

const SystemPage = () => {
  const [systemData, setSystemData] = useState({
    performance: {
      apiResponseTime: 0,
      dbResponseTime: 0,
      cloudinaryStatus: 'unknown',
      uptime: '0h 0m'
    },
    errors: {
      recentErrors: [],
      cloudinaryErrors: [],
      emailErrors: []
    },
    resources: {
      diskUsage: 0,
      bandwidth: 0,
      cloudinaryQuota: 0,
      cloudinaryUsed: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchSystemData();
    // Actualisation automatique toutes les 2 minutes (monitoring système)
    const interval = setInterval(fetchSystemData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Récupération des vraies données système
      const [performanceRes, resourcesRes, errorsRes] = await Promise.all([
        fetch('/api/v1/admin/system/performance', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v1/admin/system/resources', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v1/admin/system/errors', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (performanceRes.ok && resourcesRes.ok && errorsRes.ok) {
        const [performance, resources, errors] = await Promise.all([
          performanceRes.json(),
          resourcesRes.json(),
          errorsRes.json()
        ]);

        setSystemData({
          performance,
          resources,
          errors
        });
      } else {
        throw new Error('Erreur lors de la récupération des données');
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des données système:', error);
      
      // Fallback avec des données par défaut en cas d'erreur
      setSystemData({
        performance: {
          apiResponseTime: 0,
          dbResponseTime: 0,
          cloudinaryStatus: 'unknown',
          uptime: '0h 0m'
        },
        errors: {
          recentErrors: [],
          cloudinaryErrors: [],
          emailErrors: []
        },
        resources: {
          diskUsage: 0,
          bandwidth: 0,
          cloudinaryQuota: 0,
          cloudinaryUsed: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Chargement des données système..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Monitoring Système</h1>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchSystemData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Actualiser
          </button>
          <span className="last-update">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Performance */}
      <section className="dashboard-section">
        <h2><FiActivity /> Performance</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon files">
              <FiServer />
            </div>
            <div className="metric-content">
              <h3>API</h3>
              <div className="metric-value">{systemData.performance.apiResponseTime}ms</div>
              <div className="metric-subtitle">Temps de réponse moyen</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon storage">
              <FiDatabase />
            </div>
            <div className="metric-content">
              <h3>Base de données</h3>
              <div className="metric-value">{systemData.performance.dbResponseTime}ms</div>
              <div className="metric-subtitle">Temps de requête moyen</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon shares">
              <FiCloud />
            </div>
            <div className="metric-content">
              <h3>Cloudinary</h3>
              <div className="metric-value">
                <span 
                  className="status-indicator"
                  style={{ color: getStatusColor(systemData.performance.cloudinaryStatus) }}
                >
                  {systemData.performance.cloudinaryStatus === 'operational' ? (
                    <FiCheckCircle />
                  ) : (
                    <FiXCircle />
                  )}
                </span>
              </div>
              <div className="metric-subtitle">
                {systemData.performance.cloudinaryStatus === 'operational' ? 'Opérationnel' : 'Dégradé'}
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon users">
              <FiClock />
            </div>
            <div className="metric-content">
              <h3>Uptime</h3>
              <div className="metric-value">{systemData.performance.uptime}</div>
              <div className="metric-subtitle">Temps de fonctionnement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Utilisation des ressources */}
      <section className="dashboard-section">
        <h2><FiHardDrive /> Utilisation des ressources</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon storage">
              <FiHardDrive />
            </div>
            <div className="metric-content">
              <h3>Espace disque</h3>
              <div className="metric-value">{systemData.resources.diskUsage}%</div>
              <div className="metric-subtitle">
                <div className="progress-bar" style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '4px' }}>
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${systemData.resources.diskUsage}%`,
                      height: '100%',
                      background: systemData.resources.diskUsage > 80 ? '#ef4444' : systemData.resources.diskUsage > 60 ? '#f59e0b' : '#10b981',
                      borderRadius: '2px'
                    }}
                  ></div>
                </div>
                {systemData.resources.diskUsage}% utilisé
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon shares">
              <FiWifi />
            </div>
            <div className="metric-content">
              <h3>Bande passante</h3>
              <div className="metric-value">{formatBytes(systemData.resources.bandwidth)}</div>
              <div className="metric-subtitle">Utilisée ce mois</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon files">
              <FiCloud />
            </div>
            <div className="metric-content">
              <h3>Quota Cloudinary</h3>
              <div className="metric-value">{formatBytes(systemData.resources.cloudinaryUsed)} / {formatBytes(systemData.resources.cloudinaryQuota)}</div>
              <div className="metric-subtitle">
                <div className="progress-bar" style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '4px' }}>
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(systemData.resources.cloudinaryUsed / systemData.resources.cloudinaryQuota) * 100}%`,
                      height: '100%',
                      background: '#3b82f6',
                      borderRadius: '2px'
                    }}
                  ></div>
                </div>
                {Math.round((systemData.resources.cloudinaryUsed / systemData.resources.cloudinaryQuota) * 100)}% utilisé
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Erreurs système */}
      <section className="dashboard-section">
        <h2><FiAlertTriangle /> Erreurs récentes</h2>
        <div className="errors-container">
          {systemData.errors.recentErrors.length > 0 ? (
            <div className="errors-list">
              {systemData.errors.recentErrors.map(error => (
                <div key={error.id} className="error-item">
                  <div className="error-header">
                    <span 
                      className="error-severity"
                      style={{ color: getSeverityColor(error.severity) }}
                    >
                      <FiAlertTriangle />
                    </span>
                    <span className="error-type">{error.type}</span>
                    <span className="error-time">{formatTime(error.timestamp)}</span>
                  </div>
                  <div className="error-message">{error.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-errors">
              <FiCheckCircle />
              <p>Aucune erreur récente</p>
            </div>
          )}
        </div>
      </section>

      {/* Erreurs Cloudinary */}
      {systemData.errors.cloudinaryErrors.length > 0 && (
        <section className="dashboard-section">
          <h2><FiCloud /> Erreurs Cloudinary</h2>
          <div className="errors-list">
            {systemData.errors.cloudinaryErrors.map(error => (
              <div key={error.id} className="error-item">
                <div className="error-header">
                  <span className="error-user">{error.user}</span>
                  <span className="error-time">{formatTime(error.timestamp)}</span>
                </div>
                <div className="error-message">{error.message}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SystemPage;
