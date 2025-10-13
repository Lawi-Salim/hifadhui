import React, { useState, useEffect } from 'react';
import {
  FiActivity,
  FiTarget,
  FiZap,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiCpu,
  FiAlertTriangle,
  FiShield,
  FiRefreshCw,
  FiSettings,
  FiBarChart2,
  FiPieChart,
  FiUpload,
  FiUserX,
  FiEye,
  FiClock,
  FiServer,
  FiMenu
} from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import './AdminDashboard.css';

const RiskDashboard = () => {
  // États pour les données
  const [riskData, setRiskData] = useState({
    currentRiskLevel: 0,
    activeUsers: 0,
    suspiciousUsers: 0,
    autoActions: 0,
    systemHealth: 100
  });
  
  const [realtimeStats, setRealtimeStats] = useState({
    requestsPerMinute: 0,
    uploadsPerMinute: 0,
    failedLoginsPerMinute: 0,
    riskScoreDistribution: {},
    topRiskyUsers: []
  });
  
  const [trends, setTrends] = useState({
    riskScoreHistory: [],
    actionsHistory: [],
    userActivityHistory: []
  });
  
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    responseTime: 0,
    uptime: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, system, config
  
  // Charger les données au démarrage
  useEffect(() => {
    fetchRiskData();
    fetchRealtimeStats();
    fetchTrends();
    fetchSystemMetrics();
  }, []);
  
  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRiskData();
      fetchRealtimeStats();
      fetchSystemMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Récupérer les données de risque
  const fetchRiskData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/admin/risk/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRiskData(data.riskData || {});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de risque:', error);
    }
  };
  
  // Récupérer les statistiques temps réel
  const fetchRealtimeStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/admin/risk/realtime', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealtimeStats(data.stats || {});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats temps réel:', error);
    }
  };
  
  // Récupérer les tendances
  const fetchTrends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/admin/risk/trends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || {});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tendances:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Récupérer les métriques système
  const fetchSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/admin/system/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data.metrics || {});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métriques système:', error);
    }
  };
  
  // Fonctions utilitaires
  const getRiskLevelColor = (level) => {
    if (level >= 80) return '#dc3545';
    if (level >= 60) return '#fd7e14';
    if (level >= 40) return '#ffc107';
    if (level >= 20) return '#17a2b8';
    return '#28a745';
  };
  
  const getRiskLevelLabel = (level) => {
    if (level >= 80) return 'Critique';
    if (level >= 60) return 'Élevé';
    if (level >= 40) return 'Modéré';
    if (level >= 20) return 'Attention';
    return 'Sécurisé';
  };
  
  const getSystemHealthColor = (health) => {
    if (health >= 90) return '#28a745';
    if (health >= 70) return '#ffc107';
    if (health >= 50) return '#fd7e14';
    return '#dc3545';
  };
  
  // Rendu de l'onglet Vue d'ensemble
  const renderOverviewTab = () => (
    <div className="dashboard-content">
      {/* Métriques principales */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon activity">
            <FiShield />
          </div>
          <div className="metric-content">
            <h3>Système de sécurité</h3>
            <div className="metric-value" style={{ color: getSystemHealthColor(riskData.systemHealth) }}>
              {riskData.systemHealth}%
            </div>
            <div className="metric-subtitle">Santé du système</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon users">
            <FiUsers />
          </div>
          <div className="metric-content">
            <h3>Utilisateurs actifs</h3>
            <div className="metric-value">{riskData.activeUsers || 0}</div>
            <div className="metric-subtitle">Dernière heure</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon warning">
            <FiAlertTriangle />
          </div>
          <div className="metric-content">
            <h3>Utilisateurs signalés</h3>
            <div className="metric-value">{riskData.suspiciousUsers || 0}</div>
            <div className="metric-subtitle">Signalements actifs</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon activity">
            <FiCpu />
          </div>
          <div className="metric-content">
            <h3>Actions automatiques</h3>
            <div className="metric-value">{riskData.autoActions || 0}</div>
            <div className="metric-subtitle">Dernières 24h</div>
          </div>
        </div>
      </div>
      
      {/* Statistiques temps réel */}
      <div className="realtime-section">
        <h3><FiActivity /> Activité temps réel</h3>
        <div className="realtime-grid">
          <div className="realtime-card">
            <div className="realtime-icon">
              <FiBarChart2 />
            </div>
            <div className="realtime-content">
              <div className="realtime-value">{realtimeStats.requestsPerMinute || 0}</div>
              <div className="realtime-label">Requêtes/min</div>
            </div>
          </div>
          
          <div className="realtime-card">
            <div className="realtime-icon">
              <FiTrendingUp />
            </div>
            <div className="realtime-content">
              <div className="realtime-value">{realtimeStats.uploadsPerMinute || 0}</div>
              <div className="realtime-label">Uploads/min</div>
            </div>
          </div>
          
          <div className="realtime-card">
            <div className="realtime-icon">
              <FiZap />
            </div>
            <div className="realtime-content">
              <div className="realtime-value">{realtimeStats.failedLoginsPerMinute || 0}</div>
              <div className="realtime-label">Échecs/min</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
  
  // Rendu de l'onglet Utilisateurs à risque
  const renderUsersTab = () => (
    <div className="dashboard-content">
      <h3><FiUsers /> Utilisateurs à risque élevé</h3>
      <div className="risky-users-list">
        {realtimeStats.topRiskyUsers?.length > 0 ? (
          realtimeStats.topRiskyUsers.map((user, index) => (
            <div key={user.id} className="risky-user-card">
              <div className="user-rank">#{index + 1}</div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <div className="user-risk">
                <div 
                  className="risk-score"
                  style={{ color: getRiskLevelColor(user.riskScore) }}
                >
                  {user.riskScore}/100
                </div>
                <div className="risk-reasons">
                  {user.reasons?.slice(0, 2).map((reason, i) => (
                    <span key={i} className="risk-reason">{reason}</span>
                  ))}
                </div>
              </div>
              <div className="user-actions">
                <button className="btn-view" title="Voir détails">
                  <FiEye />
                </button>
                <button className="btn-action" title="Actions">
                  <FiShield />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-risky-users">
            <FiShield />
            <p>Aucun utilisateur à risque élevé détecté</p>
          </div>
        )}
      </div>
    </div>
  );
  
  // Rendu de l'onglet Système
  const renderSystemTab = () => (
    <div className="dashboard-content">
      <h3><FiServer /> Santé du système</h3>
      
      {/* Santé globale */}
      <div className="system-health">
        <div className="health-indicator">
          <div 
            className="health-circle"
            style={{ 
              background: `conic-gradient(${getSystemHealthColor(riskData.systemHealth)} ${riskData.systemHealth * 3.6}deg, #e9ecef 0deg)`
            }}
          >
            <div className="health-value">{riskData.systemHealth}%</div>
          </div>
          <div className="health-label">Santé globale</div>
        </div>
      </div>
      
      {/* Métriques système */}
      <div className="system-metrics">
        <div className="metric-row">
          <div className="metric-label">CPU</div>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ 
                width: `${systemMetrics.cpuUsage}%`,
                backgroundColor: systemMetrics.cpuUsage > 80 ? '#dc3545' : '#28a745'
              }}
            ></div>
          </div>
          <div className="metric-value">{systemMetrics.cpuUsage}%</div>
        </div>
        
        <div className="metric-row">
          <div className="metric-label">Mémoire</div>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ 
                width: `${systemMetrics.memoryUsage}%`,
                backgroundColor: systemMetrics.memoryUsage > 80 ? '#dc3545' : '#28a745'
              }}
            ></div>
          </div>
          <div className="metric-value">{systemMetrics.memoryUsage}%</div>
        </div>
        
        <div className="metric-row">
          <div className="metric-label">Temps de réponse</div>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ 
                width: `${Math.min(systemMetrics.responseTime / 10, 100)}%`,
                backgroundColor: systemMetrics.responseTime > 500 ? '#dc3545' : '#28a745'
              }}
            ></div>
          </div>
          <div className="metric-value">{systemMetrics.responseTime}ms</div>
        </div>
        
        <div className="metric-row">
          <div className="metric-label">Uptime</div>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ width: '100%', backgroundColor: '#28a745' }}
            ></div>
          </div>
          <div className="metric-value">{Math.floor(systemMetrics.uptime / 3600)}h</div>
        </div>
      </div>
    </div>
  );
  
  // Rendu de l'onglet Configuration
  const renderConfigTab = () => (
    <div className="dashboard-content">
      <h3><FiSettings /> Configuration du système de risque</h3>
      <div className="config-section">
        <p>Interface de configuration des seuils et règles de modération automatique.</p>
        <div className="config-placeholder">
          <FiSettings size={48} />
          <p>Configuration avancée disponible prochainement</p>
        </div>
      </div>
    </div>
  );
  
  const handleRefresh = () => {
    fetchRiskData();
    fetchRealtimeStats();
    fetchTrends();
    fetchSystemMetrics();
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <button 
          className="mobile-hamburger-menu"
          onClick={() => {
            const event = new CustomEvent('toggleSidebar');
            window.dispatchEvent(event);
          }}
          aria-label="Toggle menu"
        >
          <FiMenu />
        </button>
        <div className="title-content">
          <h1><FiShield className="page-icon" /> Risque</h1>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh}>
            <FiRefreshCw />
            Actualiser
          </button>
        </div>
      </div>
      
      {/* Onglets */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiActivity />
          Vue d'ensemble
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers />
          Utilisateurs à risque
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <FiServer />
          Système
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <FiSettings />
          Configuration
        </button>
      </div>
      
      {/* Contenu selon l'onglet actif */}
      <section className="dashboard-section">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'config' && renderConfigTab()}
      </section>
    </div>
  );
};

export default RiskDashboard;
