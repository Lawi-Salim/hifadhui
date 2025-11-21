import React, { useState, useEffect } from 'react';
import { 
  FiShield,
  FiAlertTriangle,
  FiEye,
  FiTrash2,
  FiUserX,
  FiMail,
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiUser,
  FiFile,
  FiImage,
  FiCheckCircle,
  FiXCircle,
  FiPause,
  FiUserCheck,
  FiArchive,
  FiZap,
  FiActivity,
  FiTarget,
  FiCpu,
  FiBell,
  FiMenu
} from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import ModerationActionModal from './ModerationActionModal';
import ReportDetailsTable from './FailedLoginAttemptsTable';
import ModerationActionsTable from './ModerationActionsTable';
import './AdminDashboard.css';

const ReportsPage = () => {
  // États pour les onglets
  const [activeTab, setActiveTab] = useState('reports'); // reports, warnings, suspensions, deletions
  // États pour les signalements (onglet 1)
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [typeFilter, setTypeFilter] = useState('all'); // all, inappropriate, spam, copyright
  const [sourceFilter, setSourceFilter] = useState('all'); // all, manual, automatic
  
  // États pour les avertissements (onglet 2)
  const [warnings, setWarnings] = useState([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  
  // États pour les suspensions (onglet 3)
  const [suspensions, setSuspensions] = useState([]);
  const [suspensionsLoading, setSuspensionsLoading] = useState(false);
  
  // États pour les suppressions (onglet 4)
  const [deletions, setDeletions] = useState([]);
  const [deletionsLoading, setDeletionsLoading] = useState(false);
  
  // États pour le modal d'action
  const [moderationModal, setModerationModal] = useState({
    isOpen: false,
    actionType: null,
    userInfo: null,
    reportInfo: null
  });
  
  // Statistiques globales
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    avgResponseTime: 0,
    totalWarnings: 0,
    totalSuspensions: 0,
    totalDeletions: 0,
    autoReports: 0,
    manualReports: 0,
    avgRiskScore: 0,
    criticalAlerts: 0
  });

  // États pour les alertes temps réel
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Charger toutes les données au démarrage pour les compteurs
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchReports(),
        fetchWarnings(),
        fetchSuspensions(),
        fetchDeletions()
      ]);
    };
    
    loadAllData();
  }, []); // Une seule fois au démarrage

  useEffect(() => {
    // Charger les données selon l'onglet actif (si pas déjà chargées)
    switch (activeTab) {
      case 'reports':
        if (reports.length === 0) fetchReports();
        break;
      case 'warnings':
        if (warnings.length === 0) fetchWarnings();
        break;
      case 'suspensions':
        if (suspensions.length === 0) fetchSuspensions();
        break;
      case 'deletions':
        if (deletions.length === 0) fetchDeletions();
        break;
      default:
        if (reports.length === 0) fetchReports();
    }
  }, [activeTab]);

  // Charger les alertes temps réel au démarrage
  useEffect(() => {
    fetchRealtimeAlerts();
  }, []);

  // Actualisation automatique toutes les 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      switch (activeTab) {
        case 'reports':
          fetchReports();
          break;
        case 'warnings':
          fetchWarnings();
          break;
        case 'suspensions':
          fetchSuspensions();
          break;
        case 'deletions':
          fetchDeletions();
          break;
      }
      // Actualiser aussi les alertes temps réel
      fetchRealtimeAlerts();
    }, 900000); // 15 minutes
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.warn('ReportsPage: aucun token trouvé, appels API admin ignorés (reports)');
        return;
      }
      
      const response = await fetch(`/api/v1/admin/reports?status=${filter}&type=${typeFilter}&source=${sourceFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setStats(data.stats || {});
      } else {
        console.error('Erreur lors du chargement des signalements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnings = async () => {
    try {
      setWarningsLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.warn('ReportsPage: aucun token trouvé, appels API admin ignorés (warnings)');
        return;
      }
      
      const response = await fetch('/api/v1/admin/moderation/warnings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWarnings(data.warnings || []);
        setStats(prev => ({ ...prev, totalWarnings: data.total || 0 }));
      } else {
        console.error('Erreur lors du chargement des avertissements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avertissements:', error);
      setWarnings([]);
      setStats(prev => ({ ...prev, totalWarnings: 0 }));
    } finally {
      setWarningsLoading(false);
    }
  };

  const fetchSuspensions = async () => {
    try {
      setSuspensionsLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.warn('ReportsPage: aucun token trouvé, appels API admin ignorés (suspensions)');
        return;
      }
      
      const response = await fetch('/api/v1/admin/moderation/suspensions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuspensions(data.suspensions || []);
        setStats(prev => ({ ...prev, totalSuspensions: data.total || 0 }));
      } else {
        console.error('Erreur lors du chargement des suspensions');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des suspensions:', error);
      setSuspensions([]);
      setStats(prev => ({ ...prev, totalSuspensions: 0 }));
    } finally {
      setSuspensionsLoading(false);
    }
  };

  const fetchDeletions = async () => {
    try {
      setDeletionsLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.warn('ReportsPage: aucun token trouvé, appels API admin ignorés (deletions)');
        return;
      }
      
      const response = await fetch('/api/v1/admin/moderation/deletions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDeletions(data.deletions || []);
        setStats(prev => ({ ...prev, totalDeletions: data.total || 0 }));
      } else {
        console.error('Erreur lors du chargement des suppressions');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des suppressions:', error);
      setDeletions([]);
      setStats(prev => ({ ...prev, totalDeletions: 0 }));
    } finally {
      setDeletionsLoading(false);
    }
  };

  // Récupérer les alertes temps réel
  const fetchRealtimeAlerts = async () => {
    try {
      setAlertsLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.warn('ReportsPage: aucun token trouvé, appels API admin ignorés (alerts)');
        return;
      }
      
      const response = await fetch('/api/v1/admin/alerts/realtime', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRealtimeAlerts(data.alerts || []);
        setStats(prev => ({ 
          ...prev, 
          criticalAlerts: data.criticalCount || 0,
          avgRiskScore: data.avgRiskScore || 0
        }));
      } else {
        console.error('Erreur lors du chargement des alertes');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      setRealtimeAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleAction = async (reportId, action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/v1/admin/reports/${reportId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reason })
      });

      if (response.ok) {
        fetchReports(); // Recharger la liste
      } else {
        console.error('Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    }
  };

  // Actions de modération directes
  const handleWarnUser = async (userId, reason) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v1/admin/moderation/warn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, reason })
      });

      if (response.ok) {
        // Recharger les données selon l'onglet actif
        if (activeTab === 'warnings') fetchWarnings();
        return true;
      } else {
        console.error('Erreur lors de l\'avertissement');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'avertissement:', error);
      return false;
    }
  };

  const handleSuspendUser = async (userId, reason, duration = 14) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v1/admin/moderation/suspend', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, reason, duration })
      });

      if (response.ok) {
        // Recharger les données selon l'onglet actif
        if (activeTab === 'suspensions') fetchSuspensions();
        return true;
      } else {
        console.error('Erreur lors de la suspension');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
      return false;
    }
  };

  const handleDeleteUser = async (userId, reason) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v1/admin/moderation/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, reason })
      });

      if (response.ok) {
        // Recharger les données selon l'onglet actif
        if (activeTab === 'deletions') fetchDeletions();
        return true;
      } else {
        console.error('Erreur lors de la suppression');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  };

  // Ouvrir le modal d'action de modération
  const openModerationModal = (actionType, report, user = null) => {
    setModerationModal({
      isOpen: true,
      actionType,
      userInfo: user || {
        userId: report.userId,
        username: report.username,
        email: report.userEmail,
        createdAt: report.userCreatedAt
      },
      reportInfo: report
    });
  };

  // Fermer le modal d'action
  const closeModerationModal = () => {
    setModerationModal({
      isOpen: false,
      actionType: null,
      userInfo: null,
      reportInfo: null
    });
  };

  // Exécuter l'action de modération
  const executeModerationAction = async (actionData) => {
    const { userId, reportId, reason, duration } = actionData;
    
    try {
      let success = false;
      
      switch (moderationModal.actionType) {
        case 'warn':
          success = await handleWarnUser(userId, reason);
          if (success && reportId) {
            await handleAction(reportId, 'warn');
          }
          break;
          
        case 'suspend':
          success = await handleSuspendUser(userId, reason, duration);
          if (success && reportId) {
            await handleAction(reportId, 'ban');
          }
          break;
          
        case 'delete':
          success = await handleDeleteUser(userId, reason);
          if (success && reportId) {
            await handleAction(reportId, 'delete');
          }
          break;
          
        case 'hide':
          if (reportId) {
            success = await handleAction(reportId, 'hide');
          }
          break;
          
        default:
          console.error('Type d\'action non reconnu:', moderationModal.actionType);
          return false;
      }
      
      if (success) {
        // Recharger les données de l'onglet actif
        switch (activeTab) {
          case 'reports': fetchReports(); break;
          case 'warnings': fetchWarnings(); break;
          case 'suspensions': fetchSuspensions(); break;
          case 'deletions': fetchDeletions(); break;
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error);
      return false;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'inappropriate': return <FiAlertTriangle />;
      case 'spam': return <FiMail />;
      case 'copyright': return <FiShield />;
      case 'failed_login_attempts': return <FiUserX />;
      default: return <FiAlertTriangle />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'inappropriate': return 'Contenu inapproprié';
      case 'spam': return 'Spam';
      case 'copyright': return 'Violation droits d\'auteur';
      case 'harassment': return 'Harcèlement';
      case 'failed_login_attempts': return 'Tentatives de connexion suspectes';
      default: return 'Autre';
    }
  };

  // Fonction pour grouper les signalements par type
  const groupReportsByType = (reportsList) => {
    return reportsList.reduce((groups, report) => {
      const type = report.type || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(report);
      return groups;
    }, {});
  };

  // Fonction pour grouper les actions de modération par type
  const groupModerationActionsByType = (actionsList) => {
    return actionsList.reduce((groups, action) => {
      // Essayer différentes façons de déterminer le type
      let type = action.actionType || action.action_type || action.type;
      
      // Si pas de type explicite, déduire du contexte de l'onglet actif
      if (!type || type === 'other') {
        if (activeTab === 'warnings') {
          type = 'warning';
        } else if (activeTab === 'suspensions') {
          type = 'suspension';
        } else if (activeTab === 'deletions') {
          type = 'deletion';
        } else {
          type = 'other';
        }
      }
      
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(action);
      return groups;
    }, {});
  };

  // Rendu de l'onglet Signalements
  const renderReportsTab = () => {
    const groupedReports = groupReportsByType(reports);
    
    return (
      <div className="tab-content">
        {loading ? (
          <LoadingSpinner message="Chargement des signalements..." />
        ) : reports.length === 0 ? (
          <div className="no-data">
            <FiCheckCircle />
            <h3>Aucun signalement</h3>
            <p>Aucun signalement ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="reports-list">
            {Object.entries(groupedReports).map(([type, typeReports]) => (
              <ReportDetailsTable 
                key={type} 
                report={typeReports[0]} // Premier signalement pour les métadonnées du type
                reports={typeReports} // Tous les signalements de ce type
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Rendu de l'onglet Avertissements
  const renderWarningsTab = () => {
    const groupedWarnings = groupModerationActionsByType(warnings);
    
    return (
      <div className="tab-content">
        {warningsLoading ? (
          <LoadingSpinner message="Chargement des avertissements..." />
        ) : warnings.length === 0 ? (
          <div className="no-data">
            <FiUserCheck />
            <h3>Aucun avertissement</h3>
            <p>Aucun utilisateur n'a été averti récemment.</p>
          </div>
        ) : (
          <div className="reports-list">
            {Object.entries(groupedWarnings).map(([type, typeWarnings]) => (
              <ModerationActionsTable 
                key={type} 
                actions={typeWarnings}
                type={type}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Rendu de l'onglet Suspensions
  const renderSuspensionsTab = () => {
    const groupedSuspensions = groupModerationActionsByType(suspensions);
    
    return (
      <div className="tab-content">
        {suspensionsLoading ? (
          <LoadingSpinner message="Chargement des suspensions..." />
        ) : suspensions.length === 0 ? (
          <div className="no-data">
            <FiUserCheck />
            <h3>Aucune suspension</h3>
            <p>Aucun utilisateur n'est actuellement suspendu.</p>
          </div>
        ) : (
          <div className="reports-list">
            {Object.entries(groupedSuspensions).map(([type, typeSuspensions]) => (
              <ModerationActionsTable 
                key={type} 
                actions={typeSuspensions}
                type={type}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Rendu de l'onglet Suppressions
  const renderDeletionsTab = () => {
    const groupedDeletions = groupModerationActionsByType(deletions);
    
    return (
      <div className="tab-content">
        {deletionsLoading ? (
          <LoadingSpinner message="Chargement des suppressions..." />
        ) : deletions.length === 0 ? (
          <div className="no-data">
            <FiArchive />
            <h3>Aucune suppression</h3>
            <p>Aucun compte n'a été supprimé définitivement.</p>
          </div>
        ) : (
          <div className="reports-list">
            {Object.entries(groupedDeletions).map(([type, typeDeletions]) => (
              <ModerationActionsTable 
                key={type} 
                actions={typeDeletions}
                type={type}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading && activeTab === 'reports') {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Chargement des signalements..." />
      </div>
    );
  }

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'reports': return loading;
      case 'warnings': return warningsLoading;
      case 'suspensions': return suspensionsLoading;
      case 'deletions': return deletionsLoading;
      default: return loading;
    }
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case 'reports': fetchReports(); break;
      case 'warnings': fetchWarnings(); break;
      case 'suspensions': fetchSuspensions(); break;
      case 'deletions': fetchDeletions(); break;
      default: fetchReports();
    }
    // Actualiser aussi les alertes
    fetchRealtimeAlerts();
  };

  // Fonction pour obtenir la couleur du score de risque
  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#dc3545'; // Rouge critique
    if (score >= 60) return '#fd7e14'; // Orange élevé
    if (score >= 40) return '#ffc107'; // Jaune modéré
    if (score >= 20) return '#17a2b8'; // Bleu attention
    return '#28a745'; // Vert sécurisé
  };

  // Fonction pour obtenir le label du score de risque
  const getRiskScoreLabel = (score) => {
    if (score >= 80) return 'Critique';
    if (score >= 60) return 'Élevé';
    if (score >= 40) return 'Modéré';
    if (score >= 20) return 'Attention';
    return 'Sécurisé';
  };

  return (
    <div className="admin-dashboard">
      <div className="messages-header">
        <div className="header-title">
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
            <h1><FiAlertTriangle className="page-icon" /> Modération & Signalements</h1>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={getCurrentLoading()}
          >
            <FiRefreshCw className={getCurrentLoading() ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Alertes temps réel */}
      {realtimeAlerts.length > 0 && (
        <section className="dashboard-section">
          <h2><FiBell /> Alertes temps réel</h2>
          <div className="alerts-container">
            {realtimeAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.severity}`}>
                <div className="alert-icon">
                  {alert.severity === 'critical' && <FiZap />}
                  {alert.severity === 'warning' && <FiAlertTriangle />}
                  {alert.severity === 'info' && <FiBell />}
                </div>
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <div className="alert-meta">
                    <span>Score: {alert.evidence?.riskScore || 0}/100</span>
                    <span>{alert.timeAgo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Statistiques */}
      <section className="dashboard-section">
        <h2><FiShield /> Statistiques de modération</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon files">
              <FiAlertTriangle />
            </div>
            <div className="metric-content">
              <h3>Total signalements</h3>
              <div className="metric-value">{stats.total || 0}</div>
              <div className="metric-subtitle">Tous types confondus</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon users">
              <FiClock />
            </div>
            <div className="metric-content">
              <h3>En attente</h3>
              <div className="metric-value">{stats.pending || 0}</div>
              <div className="metric-subtitle">À traiter</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon storage">
              <FiCheckCircle />
            </div>
            <div className="metric-content">
              <h3>Résolus</h3>
              <div className="metric-value">{stats.resolved || 0}</div>
              <div className="metric-subtitle">Actions prises</div>
            </div>
          </div>

        </div>
      </section>

      {/* Filtres */}
      <div className="admin-filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">
              <FiFilter className="filter-icon" />
              Statut
            </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="resolved">Résolus</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <FiAlertTriangle className="filter-icon" />
              Type
            </label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous types</option>
              <option value="inappropriate">⚠️ Inapproprié</option>
              <option value="spam">📧 Spam</option>
              <option value="copyright">🛡️ Copyright</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <FiUser className="filter-icon" />
              Source
            </label>
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes sources</option>
              <option value="manual">👤 Manuels</option>
              <option value="automatic">🤖 Automatiques</option>
            </select>
          </div>
        </div>
      </div>

      {/* Onglets de modération */}
      <section className="dashboard-section">
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FiAlertTriangle />
            Signalements ({reports.length})
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            <FiMail />
            Avertissements ({warnings.length})
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'suspensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suspensions')}
          >
            <FiPause />
            Suspensions ({suspensions.length})
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'deletions' ? 'active' : ''}`}
            onClick={() => setActiveTab('deletions')}
          >
            <FiArchive />
            Suppressions ({deletions.length})
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'warnings' && renderWarningsTab()}
        {activeTab === 'suspensions' && renderSuspensionsTab()}
        {activeTab === 'deletions' && renderDeletionsTab()}
      </section>

      {/* Modal d'action de modération */}
      <ModerationActionModal
        isOpen={moderationModal.isOpen}
        onClose={closeModerationModal}
        onConfirm={executeModerationAction}
        actionType={moderationModal.actionType}
        userInfo={moderationModal.userInfo}
        reportInfo={moderationModal.reportInfo}
      />
    </div>
  );
};

export default ReportsPage;
