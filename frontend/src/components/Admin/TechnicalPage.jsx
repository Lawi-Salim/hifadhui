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
import Pagination from '../Common/Pagination';

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
    operatingSystems: [],
    unauthorizedAttempts: [],
    unauthorizedStats: {
      totalAttempts: 0,
      uniqueEmails: 0,
      uniqueIPs: 0,
      topDomains: []
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('connections'); // 'connections' ou 'unauthorized'
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fonctions de pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePrevPage = () => {
    if (technicalData.pagination?.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (technicalData.pagination?.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    fetchTechnicalData();
  }, [filter, selectedTimeRange, currentPage]);

  // Actualisation automatique toutes les 1 heure
  useEffect(() => {
    const interval = setInterval(fetchTechnicalData, 3600000); // 1 heure
    return () => clearInterval(interval);
  }, []);

  const fetchTechnicalData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/v1/admin/technical?filter=${filter}&timeRange=${selectedTimeRange}&page=${currentPage}&limit=10`, {
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
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error, dateString);
      return 'Erreur date';
    }
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

          <div className="metric-card">
            <div className="metric-icon error">
              <FiShield />
            </div>
            <div className="metric-content">
              <h3>Emails non autorisés</h3>
              <div className="metric-value">{technicalData.unauthorizedStats?.totalAttempts || 0}</div>
              <div className="metric-subtitle">Tentatives bloquées</div>
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

      {/* Onglets pour basculer entre connexions et tentatives non autorisées */}
      <section className="dashboard-section">
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            <FiActivity />
            Connexions ({technicalData.connections.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'unauthorized' ? 'active' : ''}`}
            onClick={() => setActiveTab('unauthorized')}
          >
            <FiShield />
            Emails non autorisés ({technicalData.unauthorizedStats?.totalAttempts || 0})
          </button>
        </div>

        {activeTab === 'connections' && (
          <div className="tab-content">
            {/* Analyse des navigateurs et OS */}
            <div className="platform-analysis-section">
              <h3><FiSmartphone /> Analyse des plateformes</h3>
              <div className="platform-analysis">
                <div className="platform-card">
                  <h4>Navigateurs</h4>
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
                  <h4>Systèmes d'exploitation</h4>
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
                      <p className="no-data-text">Aucune donnée d'OS disponible</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des connexions - Structure table améliorée */}
            <div className="connections-section">
              <h3><FiWifi /> Historique des connexions ({filteredConnections.length})</h3>
              
              <div className="connections-table-container">
                <table className="connections-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Adresse IP</th>
                      <th>Localisation</th>
                      <th>Navigateur</th>
                      <th>Système</th>
                      <th>Date/Heure</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConnections.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">
                          <FiMonitor style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-secondary)' }} />
                          <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Aucune connexion</h4>
                          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aucune connexion ne correspond aux filtres sélectionnés.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredConnections.map((connection, index) => (
                        <tr key={index}>
                          <td className="user-cell">
                            <div className="user-info">
                              <FiUser />
                              <span>{connection.userEmail || 'Anonyme'}</span>
                            </div>
                          </td>
                          
                          <td className="ip-cell">
                            <div className="ip-info">
                              <code>{connection.ipAddress}</code>
                              {connection.isSuspicious && (
                                <FiAlertTriangle className="suspicious-icon" />
                              )}
                            </div>
                          </td>
                          
                          <td className="location-cell">
                            <div className="location-info">
                              <span className="flag">{getCountryFlag(connection.countryCode)}</span>
                              <span>{connection.country}, {connection.city}</span>
                            </div>
                          </td>
                          
                          <td className="browser-cell">
                            <div className="browser-info">
                              <span className="browser-icon">{getBrowserIcon(connection.browser)}</span>
                              <span>{connection.browser} {connection.browserVersion}</span>
                            </div>
                          </td>
                          
                          <td className="os-cell">
                            <div className="os-info">
                              <span className="os-icon">{getOSIcon(connection.os)}</span>
                              <span>{connection.os}</span>
                            </div>
                          </td>
                          
                          <td className="time-cell">
                            <div className="time-info">
                              <FiClock />
                              <span>{formatDate(connection.timestamp)}</span>
                            </div>
                          </td>
                          
                          <td className="actions-cell">
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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'unauthorized' && (
          <div className="tab-content">
            {/* Statistiques des tentatives non autorisées */}
            <div className="unauthorized-stats">
              <h3><FiShield /> Statistiques des tentatives bloquées</h3>
              <div className="stats-grid">
                <div className="unauthorized-stat-item">
                  <span className="stat-label">Total tentatives :</span>
                  <span className="stat-value">{technicalData.unauthorizedStats?.totalAttempts || 0}</span>
                </div>
                <div className="unauthorized-stat-item">
                  <span className="stat-label">Emails uniques :</span>
                  <span className="stat-value">{technicalData.unauthorizedStats?.uniqueEmails || 0}</span>
                </div>
                <div className="unauthorized-stat-item">
                  <span className="stat-label">IPs uniques :</span>
                  <span className="stat-value">{technicalData.unauthorizedStats?.uniqueIPs || 0}</span>
                </div>
              </div>

              {/* Top domaines tentés */}
              {technicalData.unauthorizedStats?.topDomains?.length > 0 && (
                <div className="top-domains">
                  <h4>Domaines les plus tentés :</h4>
                  <div className="domains-list">
                    {technicalData.unauthorizedStats.topDomains.map((domain, index) => (
                      <div key={index} className="domain-item">
                        <span className="domain-name">{domain.domain}</span>
                        <span className="domain-count">{domain.count} tentatives</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Liste des tentatives non autorisées */}
            <div className="unauthorized-attempts">
              <h3><FiAlertTriangle /> Tentatives récentes</h3>
              <div className="attempts-table-container">
                <table className="attempts-table">
                  <thead>
                    <tr>
                      <th>Email tenté</th>
                      <th>Domaine</th>
                      <th>Action</th>
                      <th>IP</th>
                      <th>User Agent</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicalData.unauthorizedAttempts?.length > 0 ? (
                      technicalData.unauthorizedAttempts.map((attempt) => (
                        <tr key={attempt.id}>
                          <td className="email-attempted">{attempt.email}</td>
                          <td className="domain-attempted">
                            <span className="domain-badge">{attempt.domain}</span>
                          </td>
                          <td className="action-attempted">{attempt.action}</td>
                          <td className="ip-address">{attempt.ipAddress}</td>
                          <td className="user-agent" title={attempt.userAgent}>
                            {attempt.userAgent ? attempt.userAgent.substring(0, 50) + '...' : 'N/A'}
                          </td>
                          <td className="timestamp">{formatDate(attempt.timestamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-data">
                          Aucune tentative d'email non autorisé trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Contrôles de pagination */}
              {technicalData.pagination && (
                <Pagination
                  currentPage={technicalData.pagination.currentPage}
                  totalPages={technicalData.pagination.totalPages}
                  totalItems={technicalData.pagination.totalItems}
                  itemsPerPage={technicalData.pagination.itemsPerPage}
                  hasNextPage={technicalData.pagination.hasNextPage}
                  hasPrevPage={technicalData.pagination.hasPrevPage}
                  onPageChange={handlePageChange}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                  itemName="tentatives"
                />
              )}
            </div>
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
