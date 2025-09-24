import React, { useState, useEffect } from 'react';
import { 
  FiGlobe, 
  FiMonitor, 
  FiUsers, 
  FiActivity, 
  FiFilter,
  FiRefreshCw,
  FiUser,
  FiEye,
  FiAlertTriangle,
  FiShield,
  FiDownload,
  FiClock,
  FiWifi,
  FiMapPin,
  FiSearch,
  FiSmartphone
} from 'react-icons/fi';
import SessionDetailModal from './SessionDetailModal';
import './AdminDashboard.css';
import LoadingSpinner from '../Common/LoadingSpinner';

const TechnicalPage = () => {
  const [technicalData, setTechnicalData] = useState({
    connections: [],
    stats: {
      totalConnections: 0,
      uniqueIPs: 0,
      suspiciousActivity: 0,
      topCountries: []
    },
    browsers: [],
    operatingSystems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefresh = () => {
    fetchTechnicalData();
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  useEffect(() => {
    fetchTechnicalData();
  }, [filter, selectedTimeRange]);

  const fetchTechnicalData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/v1/admin/technical?filter=${filter}&timeRange=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTechnicalData(data);
      } else {
        console.error('Erreur lors du chargement des données techniques');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données techniques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getCountryFlag = (countryCode) => {
    // Simulation d'emojis de drapeaux
    const flags = {
      'FR': '🇫🇷',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'CA': '🇨🇦',
      'Unknown': '🌍'
    };
    return flags[countryCode] || '🌍';
  };

  const getBrowserIcon = (browser) => {
    switch (browser.toLowerCase()) {
      case 'chrome': return '🌐';
      case 'firefox': return '🦊';
      case 'safari': return '🧭';
      case 'edge': return '🔷';
      default: return '🌐';
    }
  };

  const getOSIcon = (os) => {
    switch (os.toLowerCase()) {
      case 'windows': return '🪟';
      case 'macos': return '🍎';
      case 'linux': return '🐧';
      case 'android': return '🤖';
      case 'ios': return '📱';
      default: return '💻';
    }
  };

  const exportTechnicalData = (format) => {
    // Simulation d'export
    console.log(`Export des données techniques en format ${format}`);
  };

  const filteredConnections = technicalData.connections.filter(connection =>
    connection.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.ipAddress?.includes(searchTerm) ||
    connection.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Chargement des données techniques..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Données techniques</h1>
        <div className="header-actions">
          <button 
            className="export-btn"
            onClick={() => exportTechnicalData('csv')}
          >
            <FiDownload />
            Exporter CSV
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchTechnicalData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <section className="dashboard-section">
        <h2><FiMonitor /> Vue d'ensemble technique</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon users">
              <FiWifi />
            </div>
            <div className="metric-content">
              <h3>Connexions totales</h3>
              <div className="metric-value">{technicalData.stats.totalConnections || 0}</div>
              <div className="metric-subtitle">Dernières {selectedTimeRange}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon files">
              <FiGlobe />
            </div>
            <div className="metric-content">
              <h3>Adresses IP uniques</h3>
              <div className="metric-value">{technicalData.stats.uniqueIPs || 0}</div>
              <div className="metric-subtitle">Sources différentes</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon storage">
              <FiAlertTriangle />
            </div>
            <div className="metric-content">
              <h3>Activités suspectes</h3>
              <div className="metric-value">{technicalData.stats.suspiciousActivity || 0}</div>
              <div className="metric-subtitle">À surveiller</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon shares">
              <FiMapPin />
            </div>
            <div className="metric-content">
              <h3>Pays principaux</h3>
              <div className="metric-value">{technicalData.stats.topCountries?.length || 0}</div>
              <div className="metric-subtitle">Géolocalisation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres et recherche */}
      <section className="dashboard-section">
        <h2><FiFilter /> Filtres et recherche</h2>
        <div className="filters-container">
          <div className="filter-group">
            <label>Période :</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${selectedTimeRange === '24h' ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange('24h')}
              >
                24h
              </button>
              <button 
                className={`filter-btn ${selectedTimeRange === '7d' ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange('7d')}
              >
                7 jours
              </button>
              <button 
                className={`filter-btn ${selectedTimeRange === '30d' ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange('30d')}
              >
                30 jours
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Type :</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Toutes
              </button>
              <button 
                className={`filter-btn ${filter === 'suspicious' ? 'active' : ''}`}
                onClick={() => setFilter('suspicious')}
              >
                <FiAlertTriangle />
                Suspectes
              </button>
              <button 
                className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
                onClick={() => setFilter('recent')}
              >
                <FiClock />
                Récentes
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Recherche :</label>
            <div className="search-input">
              <FiSearch />
              <input
                type="text"
                placeholder="IP, email, pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Analyse des navigateurs et OS */}
      <section className="dashboard-section">
        <h2><FiSmartphone /> Analyse des plateformes</h2>
        <div className="platform-analysis">
          <div className="platform-card">
            <h3>Navigateurs</h3>
            <div className="platform-list">
              {technicalData.browsers.length > 0 ? (
                technicalData.browsers.map((browser, index) => (
                  <div key={index} className="platform-item">
                    <span className="platform-icon">{getBrowserIcon(browser.name)}</span>
                    <span className="platform-name">{browser.name}</span>
                    <span className="platform-count">{browser.count}</span>
                    <div className="platform-bar">
                      <div 
                        className="platform-fill"
                        style={{ width: `${(browser.count / technicalData.stats.totalConnections) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data-text">Aucune donnée de navigateur disponible</p>
              )}
            </div>
          </div>

          <div className="platform-card">
            <h3>Systèmes d'exploitation</h3>
            <div className="platform-list">
              {technicalData.operatingSystems.length > 0 ? (
                technicalData.operatingSystems.map((os, index) => (
                  <div key={index} className="platform-item">
                    <span className="platform-icon">{getOSIcon(os.name)}</span>
                    <span className="platform-name">{os.name}</span>
                    <span className="platform-count">{os.count}</span>
                    <div className="platform-bar">
                      <div 
                        className="platform-fill"
                        style={{ width: `${(os.count / technicalData.stats.totalConnections) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data-text">Aucune donnée de système disponible</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Historique des connexions */}
      <section className="dashboard-section">
        <h2><FiWifi /> Historique des connexions ({filteredConnections.length})</h2>
        
        {filteredConnections.length === 0 ? (
          <div className="no-data">
            <FiMonitor />
            <h3>Aucune connexion</h3>
            <p>Aucune connexion ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="connections-table">
            <div className="table-header">
              <div className="header-cell">Utilisateur</div>
              <div className="header-cell">Adresse IP</div>
              <div className="header-cell">Localisation</div>
              <div className="header-cell">Navigateur</div>
              <div className="header-cell">Système</div>
              <div className="header-cell">Date/Heure</div>
              <div className="header-cell">Actions</div>
            </div>
            
            {filteredConnections.map((connection, index) => (
              <div key={index} className="table-row">
                <div className="table-cell">
                  <div className="user-info">
                    <FiUser />
                    <span>{connection.userEmail || 'Anonyme'}</span>
                  </div>
                </div>
                
                <div className="table-cell">
                  <div className="ip-info">
                    <code>{connection.ipAddress}</code>
                    {connection.isSuspicious && (
                      <FiAlertTriangle className="suspicious-icon" />
                    )}
                  </div>
                </div>
                
                <div className="table-cell">
                  <div className="location-info">
                    <span className="flag">{getCountryFlag(connection.countryCode)}</span>
                    <span>{connection.country}, {connection.city}</span>
                  </div>
                </div>
                
                <div className="table-cell">
                  <div className="browser-info">
                    <span className="browser-icon">{getBrowserIcon(connection.browser)}</span>
                    <span>{connection.browser} {connection.browserVersion}</span>
                  </div>
                </div>
                
                <div className="table-cell">
                  <div className="os-info">
                    <span className="os-icon">{getOSIcon(connection.os)}</span>
                    <span>{connection.os}</span>
                  </div>
                </div>
                
                <div className="table-cell">
                  <div className="time-info">
                    <FiClock />
                    <span>{formatDate(connection.timestamp)}</span>
                  </div>
                </div>
                
                <div className="table-cell">
                  <div className="action-buttons">
                    <button 
                      className="action-btn view"
                      title="Voir détails"
                      onClick={() => handleViewSession(connection)}
                    >
                      <FiEye />
                    </button>
                    {connection.isSuspicious && (
                      <button 
                        className="action-btn block"
                        title="Bloquer IP"
                      >
                        <FiShield />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Note de conformité RGPD */}
      <section className="dashboard-section">
        <div className="compliance-notice">
          <FiShield />
          <div>
            <h4>Conformité RGPD</h4>
            <p>
              Les données techniques sont collectées uniquement à des fins de sécurité et d'amélioration du service. 
              Elles sont automatiquement anonymisées après 90 jours et peuvent être supprimées sur demande de l'utilisateur.
            </p>
          </div>
        </div>
      </section>

      {/* Modal de détails de session */}
      <SessionDetailModal 
        session={selectedSession}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default TechnicalPage;
