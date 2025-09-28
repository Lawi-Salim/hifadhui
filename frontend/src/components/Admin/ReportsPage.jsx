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
  FiXCircle
} from 'react-icons/fi';
import './AdminDashboard.css';
import LoadingSpinner from '../Common/LoadingSpinner';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [typeFilter, setTypeFilter] = useState('all'); // all, inappropriate, spam, copyright
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    fetchReports();
  }, [filter, typeFilter]);

  // Actualisation automatique toutes les 15 minutes
  useEffect(() => {
    const interval = setInterval(fetchReports, 900000); // 15 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/v1/admin/reports?status=${filter}&type=${typeFilter}`, {
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
      default: return <FiAlertTriangle />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'inappropriate': return 'Contenu inapproprié';
      case 'spam': return 'Spam';
      case 'copyright': return 'Violation droits d\'auteur';
      default: return 'Autre';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Chargement des signalements..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Signalements</h1>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchReports}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
      </div>

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

          <div className="metric-card">
            <div className="metric-icon shares">
              <FiClock />
            </div>
            <div className="metric-content">
              <h3>Temps moyen</h3>
              <div className="metric-value">{stats.avgResponseTime || 0}h</div>
              <div className="metric-subtitle">Temps de traitement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="dashboard-section">
        <h2><FiFilter /> Filtres</h2>
        <div className="filters-container">
          <div className="filter-group">
            <label>Statut :</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tous
              </button>
              <button 
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                En attente
              </button>
              <button 
                className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
                onClick={() => setFilter('resolved')}
              >
                Résolus
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Type :</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                Tous types
              </button>
              <button 
                className={`filter-btn ${typeFilter === 'inappropriate' ? 'active' : ''}`}
                onClick={() => setTypeFilter('inappropriate')}
              >
                <FiAlertTriangle />
                Inapproprié
              </button>
              <button 
                className={`filter-btn ${typeFilter === 'spam' ? 'active' : ''}`}
                onClick={() => setTypeFilter('spam')}
              >
                <FiMail />
                Spam
              </button>
              <button 
                className={`filter-btn ${typeFilter === 'copyright' ? 'active' : ''}`}
                onClick={() => setTypeFilter('copyright')}
              >
                <FiShield />
                Copyright
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des signalements */}
      <section className="dashboard-section">
        <h2><FiAlertTriangle /> Signalements ({reports.length})</h2>
        
        {reports.length === 0 ? (
          <div className="no-data">
            <FiCheckCircle />
            <h3>Aucun signalement</h3>
            <p>Aucun signalement ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <div className="report-type">
                    {getTypeIcon(report.type)}
                    <span>{getTypeLabel(report.type)}</span>
                  </div>
                  <div className="report-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {report.status === 'pending' ? 'En attente' : 
                       report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                    </span>
                  </div>
                </div>

                <div className="report-content">
                  <div className="report-details">
                    <div className="report-info">
                      <div className="info-item">
                        <FiUser />
                        <span>Signalé par : {report.reporterEmail || 'Anonyme'}</span>
                      </div>
                      <div className="info-item">
                        <FiClock />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                      <div className="info-item">
                        {report.fileType === 'image' ? <FiImage /> : <FiFile />}
                        <span>Fichier : {report.fileName}</span>
                      </div>
                    </div>
                    
                    <div className="report-description">
                      <h4>Motif du signalement :</h4>
                      <p>{report.reason || 'Aucun motif spécifié'}</p>
                    </div>
                  </div>

                  <div className="report-preview">
                    {report.fileType === 'image' ? (
                      <img 
                        src={report.fileUrl} 
                        alt="Contenu signalé" 
                        className="preview-image"
                      />
                    ) : (
                      <div className="preview-file">
                        <FiFile />
                        <span>{report.fileName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {report.status === 'pending' && (
                  <div className="report-actions">
                    <button 
                      className="action-btn view"
                      onClick={() => window.open(report.fileUrl, '_blank')}
                    >
                      <FiEye />
                      Voir le fichier
                    </button>
                    
                    <button 
                      className="action-btn warn"
                      onClick={() => handleAction(report.id, 'warn')}
                    >
                      <FiMail />
                      Avertir utilisateur
                    </button>
                    
                    <button 
                      className="action-btn hide"
                      onClick={() => handleAction(report.id, 'hide')}
                    >
                      <FiEye />
                      Masquer contenu
                    </button>
                    
                    <button 
                      className="action-btn delete"
                      onClick={() => handleAction(report.id, 'delete')}
                    >
                      <FiTrash2 />
                      Supprimer
                    </button>
                    
                    <button 
                      className="action-btn ban"
                      onClick={() => handleAction(report.id, 'ban')}
                    >
                      <FiUserX />
                      Suspendre utilisateur
                    </button>
                    
                    <button 
                      className="action-btn dismiss"
                      onClick={() => handleAction(report.id, 'dismiss')}
                    >
                      <FiXCircle />
                      Rejeter signalement
                    </button>
                  </div>
                )}

                {report.status !== 'pending' && report.adminAction && (
                  <div className="report-resolution">
                    <h4>Action prise :</h4>
                    <p>{report.adminAction}</p>
                    <small>Par {report.adminEmail} le {formatDate(report.resolvedAt)}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReportsPage;
