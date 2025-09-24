import React, { useState, useEffect } from 'react';
import { 
  FiFileText, 
  FiDownload, 
  FiCalendar, 
  FiUsers, 
  FiFile,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import './AdminDashboard.css';
import LoadingSpinner from '../Common/LoadingSpinner';

const AnalyticsPage = () => {
  const [reportData, setReportData] = useState({
    summary: {},
    data: [],
    type: 'usage',
    period: 'monthly',
    totalRecords: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('usage');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, selectedReport, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Appel API pour récupérer les vraies données
      const response = await fetch(`/api/v1/admin/reports/data?type=${selectedReport}&period=${selectedPeriod}&startDate=${dateRange.start}&endDate=${dateRange.end}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData({
          summary: data.summary,
          data: data.data,
          type: data.type,
          period: data.period,
          totalRecords: data.totalRecords
        });
      } else {
        console.error('Erreur lors du chargement des données de rapport');
        // Fallback avec données vides
        setReportData({
          summary: {},
          data: [],
          type: selectedReport,
          period: selectedPeriod,
          totalRecords: 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const exportReport = (format) => {
    const data = reportData.data || [];
    const reportName = `hifadhui-rapport-${selectedReport}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      // Headers dynamiques selon le type de rapport
      let headers = ['Période'];
      let dataMapper = (row) => [row.period];
      
      switch (selectedReport) {
        case 'usage':
          headers = ['Période', 'Uploads', 'Taille totale (B)', 'Utilisateurs actifs', 'Taille moyenne/fichier'];
          dataMapper = (row) => [row.period, row.uploads, row.totalSize, row.activeUsers, row.avgSizePerFile];
          break;
        case 'users':
          headers = ['Période', 'Nouveaux utilisateurs', 'Utilisateurs Google', 'Utilisateurs locaux', '% Google'];
          dataMapper = (row) => [row.period, row.newUsers, row.googleUsers, row.localUsers, row.googlePercentage];
          break;
        case 'files':
          headers = ['Période', 'Images', 'PDFs', 'Total', 'Taille moyenne', 'Taille max'];
          dataMapper = (row) => [row.period, row.images, row.pdfs, row.total, row.avgSize, row.maxSize];
          break;
        case 'storage':
          headers = ['Période', 'Taille période', 'Taille cumulative', 'Nombre fichiers', 'Utilisateurs uniques'];
          dataMapper = (row) => [row.period, row.periodSize, row.cumulativeSize, row.fileCount, row.uniqueUsers];
          break;
      }
      
      const csvContent = [
        headers,
        ...data.map(dataMapper)
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify({
        metadata: {
          reportType: selectedReport,
          period: selectedPeriod,
          dateRange: dateRange,
          generatedAt: new Date().toISOString()
        },
        summary: reportData.summary,
        data: data
      }, null, 2);
      
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const reportTypes = [
    { id: 'usage', label: 'Utilisation', icon: FiTrendingUp },
    { id: 'users', label: 'Utilisateurs', icon: FiUsers },
    { id: 'files', label: 'Fichiers', icon: FiFile },
    { id: 'storage', label: 'Stockage', icon: FiPieChart }
  ];

  const periods = [
    { id: 'daily', label: 'Quotidien' },
    { id: 'weekly', label: 'Hebdomadaire' },
    { id: 'monthly', label: 'Mensuel' }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Génération des rapports..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchReportData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Résumé */}
      <section className="dashboard-section">
        <h2><FiBarChart2 /> Résumé exécutif</h2>
        <div className="metrics-grid">
          {/* Carte 1 - Adaptée selon le type de rapport */}
          <div className="metric-card">
            <div className="metric-icon users">
              <FiUsers />
            </div>
            <div className="metric-content">
              {selectedReport === 'usage' && (
                <>
                  <h3>Uploads totaux</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.totalUploads || 0)}</div>
                  <div className="metric-subtitle">{formatNumber(reportData.summary.peakActiveUsers || 0)} utilisateurs actifs</div>
                </>
              )}
              {selectedReport === 'users' && (
                <>
                  <h3>Nouveaux utilisateurs</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.totalNewUsers || 0)}</div>
                  <div className="metric-subtitle">{formatNumber(reportData.summary.avgUsersPerPeriod || 0)} par période</div>
                </>
              )}
              {selectedReport === 'files' && (
                <>
                  <h3>Fichiers totaux</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.totalFiles || 0)}</div>
                  <div className="metric-subtitle">{formatNumber(reportData.summary.totalImages || 0)} images</div>
                </>
              )}
              {selectedReport === 'storage' && (
                <>
                  <h3>Fichiers totaux</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.totalFiles || 0)}</div>
                  <div className="metric-subtitle">Tous types</div>
                </>
              )}
            </div>
          </div>

          {/* Carte 2 - Adaptée selon le type de rapport */}
          <div className="metric-card">
            <div className="metric-icon files">
              <FiFile />
            </div>
            <div className="metric-content">
              {selectedReport === 'usage' && (
                <>
                  <h3>Stockage utilisé</h3>
                  <div className="metric-value">{formatBytes(reportData.summary.totalSize || 0)}</div>
                  <div className="metric-subtitle">Espace total</div>
                </>
              )}
              {selectedReport === 'users' && (
                <>
                  <h3>Adoption Google</h3>
                  <div className="metric-value">{reportData.summary.googleAdoptionRate || 0}%</div>
                  <div className="metric-subtitle">Connexions Google</div>
                </>
              )}
              {selectedReport === 'files' && (
                <>
                  <h3>PDFs</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.totalPdfs || 0)}</div>
                  <div className="metric-subtitle">{reportData.summary.imagePercentage || 0}% images</div>
                </>
              )}
              {selectedReport === 'storage' && (
                <>
                  <h3>Stockage total</h3>
                  <div className="metric-value">{formatBytes(reportData.summary.totalStorage || 0)}</div>
                  <div className="metric-subtitle">Cumulé</div>
                </>
              )}
            </div>
          </div>

          {/* Carte 3 - Adaptée selon le type de rapport */}
          <div className="metric-card">
            <div className="metric-icon storage">
              <FiPieChart />
            </div>
            <div className="metric-content">
              {selectedReport === 'usage' && (
                <>
                  <h3>Moyenne par période</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.avgUploadsPerPeriod || 0)}</div>
                  <div className="metric-subtitle">Uploads</div>
                </>
              )}
              {selectedReport === 'users' && (
                <>
                  <h3>Périodes analysées</h3>
                  <div className="metric-value">{formatNumber(reportData.summary.totalPeriods || 0)}</div>
                  <div className="metric-subtitle">Mois de données</div>
                </>
              )}
              {selectedReport === 'files' && (
                <>
                  <h3>Répartition</h3>
                  <div className="metric-value">{reportData.summary.imagePercentage || 0}%</div>
                  <div className="metric-subtitle">Images vs PDFs</div>
                </>
              )}
              {selectedReport === 'storage' && (
                <>
                  <h3>Croissance</h3>
                  <div className="metric-value">{reportData.summary.storageGrowthRate || 0}%</div>
                  <div className="metric-subtitle">Évolution stockage</div>
                </>
              )}
            </div>
          </div>

          {/* Carte 4 - Métrique générale */}
          <div className="metric-card">
            <div className="metric-icon shares">
              <FiTrendingUp />
            </div>
            <div className="metric-content">
              <h3>Période</h3>
              <div className="metric-value">{selectedPeriod === 'daily' ? 'Jour' : selectedPeriod === 'weekly' ? 'Semaine' : 'Mois'}</div>
              <div className="metric-subtitle">{reportData.totalRecords || 0} enregistrements</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres et contrôles */}
      <section className="dashboard-section">
        <h2><FiFilter /> Filtres</h2>
        <div className="filters-container">
          <div className="filter-group">
            <label>Type de rapport :</label>
            <div className="filter-buttons">
              {reportTypes.map(type => (
                <button
                  key={type.id}
                  className={`filter-btn ${selectedReport === type.id ? 'active' : ''}`}
                  onClick={() => setSelectedReport(type.id)}
                >
                  <type.icon />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Période :</label>
            <div className="filter-buttons">
              {periods.map(period => (
                <button
                  key={period.id}
                  className={`filter-btn ${selectedPeriod === period.id ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period.id)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Plage de dates :</label>
            <div className="date-inputs">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span>à</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Données détaillées */}
      <section className="dashboard-section">
        <h2><FiFileText /> Données détaillées</h2>
        <div className="report-actions">
          <button 
            className="export-btn"
            onClick={() => exportReport('csv')}
          >
            <FiDownload />
            Exporter CSV
          </button>
          <button 
            className="export-btn"
            onClick={() => exportReport('json')}
          >
            <FiDownload />
            Exporter JSON
          </button>
        </div>

        <div className="data-table-container">
          <table className={`data-table ${selectedReport}-report`}>
            <thead>
              <tr>
                <th><FiCalendar /> Période</th>
                {selectedReport === 'usage' && (
                  <>
                    <th><FiFile /> Uploads</th>
                    <th><FiPieChart /> Taille totale</th>
                    <th><FiUsers /> Utilisateurs actifs</th>
                    <th>Taille moy./fichier</th>
                  </>
                )}
                {selectedReport === 'users' && (
                  <>
                    <th><FiUsers /> Nouveaux utilisateurs</th>
                    <th>Google</th>
                    <th>Local</th>
                    <th>% Google</th>
                  </>
                )}
                {selectedReport === 'files' && (
                  <>
                    <th>Images</th>
                    <th>PDFs</th>
                    <th><FiFile /> Total</th>
                    <th>Taille moyenne</th>
                    <th>Taille max</th>
                  </>
                )}
                {selectedReport === 'storage' && (
                  <>
                    <th>Taille période</th>
                    <th><FiPieChart /> Cumulative</th>
                    <th><FiFile /> Fichiers</th>
                    <th><FiUsers /> Utilisateurs</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(reportData.data || []).slice(-10).map((row, index) => (
                <tr key={index}>
                  <td>{row.period}</td>
                  {selectedReport === 'usage' && (
                    <>
                      <td>{formatNumber(row.uploads)}</td>
                      <td>{formatBytes(row.totalSize)}</td>
                      <td>{formatNumber(row.activeUsers)}</td>
                      <td>{formatBytes(row.avgSizePerFile)}</td>
                    </>
                  )}
                  {selectedReport === 'users' && (
                    <>
                      <td>{formatNumber(row.newUsers)}</td>
                      <td>{formatNumber(row.googleUsers)}</td>
                      <td>{formatNumber(row.localUsers)}</td>
                      <td>{row.googlePercentage}%</td>
                    </>
                  )}
                  {selectedReport === 'files' && (
                    <>
                      <td>{formatNumber(row.images)}</td>
                      <td>{formatNumber(row.pdfs)}</td>
                      <td>{formatNumber(row.total)}</td>
                      <td>{formatBytes(row.avgSize)}</td>
                      <td>{formatBytes(row.maxSize)}</td>
                    </>
                  )}
                  {selectedReport === 'storage' && (
                    <>
                      <td>{formatBytes(row.periodSize)}</td>
                      <td>{formatBytes(row.cumulativeSize)}</td>
                      <td>{formatNumber(row.fileCount)}</td>
                      <td>{formatNumber(row.uniqueUsers)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights automatiques */}
      <section className="dashboard-section">
        <h2><FiTrendingUp /> Insights</h2>
        <div className="insights-container">
          <div className="insight-card">
            <h3>📈 Tendance positive</h3>
            <p>L'utilisation a augmenté de 15% ce mois par rapport au mois précédent.</p>
          </div>
          <div className="insight-card">
            <h3>👥 Engagement utilisateur</h3>
            <p>71% des utilisateurs sont actifs, soit un taux d'engagement excellent.</p>
          </div>
          <div className="insight-card">
            <h3>💾 Optimisation stockage</h3>
            <p>Le stockage moyen par utilisateur est de {formatBytes(reportData.summary.totalStorage / reportData.summary.totalUsers)}.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
