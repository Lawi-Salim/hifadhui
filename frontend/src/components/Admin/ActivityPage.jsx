import React, { useEffect, useState } from 'react';
import { FiClock, FiMenu, FiActivity, FiDownloadCloud, FiUsers } from 'react-icons/fi';
import ActivityList from './ActivityList';
import './AdminDashboard.css';
import { getActivityStats } from '../../services/adminService';
import LoadingSpinner from '../Common/LoadingSpinner';

const ActivityPage = () => {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('week');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const params = {};

        // Mapper le filtre de période sur la query "range" du backend
        if (periodFilter === 'week') {
          params.range = 'week';
        } else if (periodFilter === 'month') {
          params.range = 'month';
        } else if (periodFilter === 'year') {
          params.range = 'year';
        } else {
          params.range = 'all';
        }

        const response = await getActivityStats(params);
        setStats(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des stats d\'activité:', err);
        setError('Impossible de charger les statistiques d\'activité');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [periodFilter]);

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
            <h1><FiActivity className="page-icon" /> Logs d'activité</h1>
          </div>
        </div>
      </div>

      {/* Statistiques d'activité */}
      <section className="dashboard-section">
        <div
          className="dashboard-section-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <h2><FiActivity /> Statistiques d'activité</h2>
          <div className="filters-section-activity">
            <div className="filters-grid filter-activity">
              <div className="filter-group">
                <select
                  className="filter-select"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                >
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois-ci</option>
                  <option value="year">Cette année</option>
                  <option value="all">Toutes les dates</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {loadingStats && !stats && !error && (
          <LoadingSpinner message="Chargement des statistiques d'activité..." />
        )}
        {error && !loadingStats && (
          <p style={{ color: 'var(--error-color)' }}>{error}</p>
        )}
        {stats && !loadingStats && !error && (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon files">
                <FiDownloadCloud />
              </div>
              <div className="metric-content">
                <h3>Fichiers téléchargés</h3>
                <div className="metric-value">{stats.individualDownloads}</div>
                <div className="metric-subtitle">
                  {`Images ${stats.individualImageDownloads || 0} et PDFs ${stats.individualPdfDownloads || 0}`}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon storage">
                <FiDownloadCloud />
              </div>
              <div className="metric-content">
                <h3>Téléchargements ZIP</h3>
                <div className="metric-value">{stats.zipDownloads}</div>
                <div className="metric-subtitle">
                  {`Images ${stats.zipImageDownloads || 0} et PDFs ${stats.zipPdfDownloads || 0}`}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon shares">
                <FiDownloadCloud />
              </div>
              <div className="metric-content">
                <h3>Téléchargements totaux</h3>
                <div className="metric-value">{stats.totalDownloads}</div>
                <div className="metric-subtitle">Individuel + ZIP</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon users">
                <FiUsers />
              </div>
              <div className="metric-content">
                <h3>Téléchargement par user</h3>
                <div className="metric-value">{stats.activeDownloadUsers}</div>
                <div className="metric-subtitle">Distincts sur 7 jours</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Journal des activités récentes */}
      <section className="dashboard-section">
        <h2><FiClock /> Journal des activités récentes</h2>
        <ActivityList />
      </section>
    </div>
  );
};

export default ActivityPage;
