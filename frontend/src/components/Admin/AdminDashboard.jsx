import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiFile, 
  FiHardDrive, 
  FiShare2, 
  FiTrendingUp, 
  FiAlertTriangle,
  FiActivity,
  FiClock,
  FiRefreshCw,
  FiEye,
  FiDownload,
  FiUpload,
  FiMenu
} from 'react-icons/fi';
import './AdminDashboard.css';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatFileSize } from '../../utils/fileSize';

// Import conditionnel de Recharts avec fallback
let LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell;
let rechartsAvailable = false;

try {
  const recharts = require('recharts');
  LineChart = recharts.LineChart;
  Line = recharts.Line;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  ResponsiveContainer = recharts.ResponsiveContainer;
  BarChart = recharts.BarChart;
  Bar = recharts.Bar;
  PieChart = recharts.PieChart;
  Pie = recharts.Pie;
  Cell = recharts.Cell;
  rechartsAvailable = true;
} catch (error) {
  console.warn('Recharts non disponible, utilisation du fallback');
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      totalFiles: 0,
      totalImages: 0,
      totalPdfs: 0,
      totalStorage: 0
    },
    charts: {
      userRegistrations: [],
      dailyUploads: [],
      fileTypes: [],
      userActivity: []
    },
    alerts: {
      gracePeriodUsers: [],
      systemErrors: []
    },
    realTime: {
      onlineUsers: 0,
      recentActivities: []
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Actualisation automatique toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Si aucun token, ne pas appeler les endpoints admin (cela éviter les 401/403 inutiles)
      if (!token) {
        console.warn('AdminDashboard: aucun token trouvé, appels API admin ignorés');
        setLoading(false);
        return;
      }

      const authHeaders = {
        'Authorization': `Bearer ${token}`
      };
      
      // Récupérer les métriques globales
      const metricsResponse = await fetch('/api/v1/admin/dashboard/metrics', {
        headers: authHeaders
      });
      
      // Récupérer les données de graphiques
      const chartsResponse = await fetch(`/api/v1/admin/dashboard/charts?range=${timeRange}`, {
        headers: authHeaders
      });
      
      // Récupérer les alertes
      const alertsResponse = await fetch('/api/v1/admin/dashboard/alerts', {
        headers: authHeaders
      });

      if (metricsResponse.ok && chartsResponse.ok && alertsResponse.ok) {
        const metrics = await metricsResponse.json();
        const charts = await chartsResponse.json();
        const alerts = await alertsResponse.json();
        
        setDashboardData({
          metrics,
          charts,
          alerts,
          realTime: {
            onlineUsers: Math.floor(Math.random() * 10) + 1, // Simulation
            recentActivities: []
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatBytes = (bytes) => formatFileSize(bytes);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Composant de fallback pour les graphiques
  const ChartFallback = ({ title, data, type = 'line' }) => (
    <div className="chart-fallback">
      <h4>{title}</h4>
      <div className="chart-placeholder">
        <FiTrendingUp size={48} />
        <p>Graphique {type}</p>
        <small>{data?.length || 0} point(s) de données</small>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Chargement du dashboard..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-top">
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
          <h1>Dashboard Admin</h1>
          <button 
            className="btn btn-primary refresh-btn"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
        
        <div className="time-range-selector">
          <button 
            className={timeRange === '7d' ? 'active' : ''}
            onClick={() => setTimeRange('7d')}
          >
            7 jours
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''}
            onClick={() => setTimeRange('30d')}
          >
            30 jours
          </button>
          <button 
            className={timeRange === '90d' ? 'active' : ''}
            onClick={() => setTimeRange('90d')}
          >
            90 jours
          </button>
        </div>
      </div>

      {/* Métriques globales */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon users">
            <FiUsers />
          </div>
          <div className="metric-content">
            <h3>Utilisateurs</h3>
            <div className="metric-value">{formatNumber(dashboardData.metrics.totalUsers)}</div>
            <div className="metric-subtitle">
              {dashboardData.metrics.activeUsers} actifs • {dashboardData.metrics.newUsers} nouveaux
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon files">
            <FiFile />
          </div>
          <div className="metric-content">
            <h3>Fichiers</h3>
            <div className="metric-value">{formatNumber(dashboardData.metrics.totalFiles)}</div>
            <div className="metric-subtitle">
              {dashboardData.metrics.totalImages} images • {dashboardData.metrics.totalPdfs} PDFs
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon storage">
            <FiHardDrive />
          </div>
          <div className="metric-content">
            <h3>Stockage</h3>
            <div className="metric-value">{formatFileSize(dashboardData.metrics.totalStorage)}</div>
            <div className="metric-subtitle">Espace utilisé</div>
          </div>
        </div>

      </section>

      {/* Alertes système */}
      {(dashboardData.alerts.gracePeriodUsers.length > 0 || 
        dashboardData.alerts.systemErrors.length > 0) && (
        <section className="alerts-section">
          <h2><FiAlertTriangle /> Alertes système</h2>
          <div className="alerts-grid">
            {dashboardData.alerts.gracePeriodUsers.length > 0 && (
              <div className="alert-card warning">
                <h4>Comptes en période de grâce</h4>
                <p>{dashboardData.alerts.gracePeriodUsers.length} compte(s) à supprimer bientôt</p>
                <button className="alert-action">Voir détails</button>
              </div>
            )}
            
            {dashboardData.alerts.systemErrors.length > 0 && (
              <div className="alert-card error">
                <h4>Erreurs système</h4>
                <p>{dashboardData.alerts.systemErrors.length} erreur(s) récente(s)</p>
                <button className="alert-action">Voir logs</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Graphiques */}
      <section className="charts-section">
        <div className="charts-grid">
          {/* Évolution des inscriptions avec période dynamique */}
          <div className="chart-card">
            <h3><FiTrendingUp /> {
              timeRange === '7d' ? 'Inscriptions hebdomadaires' :
              timeRange === '30d' ? 'Inscriptions mensuelles' :
              'Inscriptions trimestrielles'
            }</h3>
            {rechartsAvailable ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.charts.userRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Inscriptions"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback 
                title={
                  timeRange === '7d' ? 'Inscriptions hebdomadaires' :
                  timeRange === '30d' ? 'Inscriptions mensuelles' :
                  'Inscriptions trimestrielles'
                }
                data={dashboardData.charts.userRegistrations} 
                type="ligne" 
              />
            )}
          </div>

          {/* Uploads avec période dynamique */}
          <div className="chart-card">
            <h3><FiUpload /> {
              timeRange === '7d' ? 'Uploads hebdomadaires' :
              timeRange === '30d' ? 'Uploads mensuels' :
              'Uploads trimestriels'
            }</h3>
            {rechartsAvailable ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.charts.dailyUploads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="images" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Images" 
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pdfs" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="PDFs" 
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback 
                title={
                  timeRange === '7d' ? 'Uploads hebdomadaires' :
                  timeRange === '30d' ? 'Uploads mensuels' :
                  'Uploads trimestriels'
                }
                data={dashboardData.charts.dailyUploads} 
                type="courbes" 
              />
            )}
          </div>


          {/* Répartition des types de fichiers */}
          <div className="chart-card">
            <h3><FiFile /> Types de fichiers</h3>
            {rechartsAvailable ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.charts.fileTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.charts.fileTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback 
                title="Types de fichiers" 
                data={dashboardData.charts.fileTypes} 
                type="secteurs" 
              />
            )}
          </div>

          {/* Activité utilisateurs */}
          <div className="chart-card">
            <h3><FiUsers /> Activité utilisateurs</h3>
            {rechartsAvailable ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.charts.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Utilisateurs actifs"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback 
                title="Activité utilisateurs" 
                data={dashboardData.charts.userActivity} 
                type="ligne" 
              />
            )}
          </div>
        </div>
      </section>

      {/* Statistiques rapides */}
      <section className="quick-stats-section">
        <div className="quick-stats-grid">
          <div className="quick-stat-card">
            <div className="quick-stat-header">
              <h3><FiTrendingUp /> Croissance</h3>
            </div>
            <div className="quick-stat-content">
              <div className="stat-item">
                <span className="stat-label">Nouveaux utilisateurs (7j)</span>
                <span className="stat-value positive">+{dashboardData.metrics.newUsersWeek}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Nouveaux fichiers (7j)</span>
                <span className="stat-value positive">+{dashboardData.metrics.newFilesWeek}</span>
              </div>
            </div>
          </div>
          
          <div className="quick-stat-card">
            <div className="quick-stat-header">
              <h3><FiActivity /> Activité</h3>
            </div>
            <div className="quick-stat-content">
              <div className="stat-item">
                <span className="stat-label">Taux d'engagement</span>
                <span className="stat-value">{dashboardData.metrics.totalUsers > 0 ? Math.round((dashboardData.metrics.activeUsers / dashboardData.metrics.totalUsers) * 100) : 0}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fichiers par utilisateur</span>
                <span className="stat-value">{dashboardData.metrics.totalUsers > 0 ? Math.round(dashboardData.metrics.totalFiles / dashboardData.metrics.totalUsers) : 0}</span>
              </div>
            </div>
          </div>
          
          <div className="quick-stat-card">
            <div className="quick-stat-header">
              <h3><FiHardDrive />Stockage</h3>
            </div>
            <div className="quick-stat-content">
              <div className="stat-item">
                <span className="stat-label">Espace moyen/utilisateur</span>
                <span className="stat-value">{formatBytes(dashboardData.metrics.totalUsers > 0 ? dashboardData.metrics.totalStorage / dashboardData.metrics.totalUsers : 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Taille moyenne fichier</span>
                <span className="stat-value">{formatBytes(dashboardData.metrics.totalFiles > 0 ? dashboardData.metrics.totalStorage / dashboardData.metrics.totalFiles : 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;
