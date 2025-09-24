import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiFolder, FiFileText, FiLock, FiUpload, FiFile, FiBarChart2, FiMenu, FiImage } from 'react-icons/fi';
import './Dashboard.css';
import '../Admin/AdminDashboard.css';
import LoadingSpinner from '../Common/LoadingSpinner';

const Dashboard = () => {
  const { } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalImages: 0,
    totalPdfs: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Gérer les messages de bienvenue depuis la navigation
  useEffect(() => {
    if (location.state?.welcomeMessage) {
      setWelcomeMessage(location.state.welcomeMessage);
      // Effacer le message après 5 secondes
      const timer = setTimeout(() => {
        setWelcomeMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Appel pour les statistiques globales (total fichiers)
        const statsResponse = await api.get('/files/stats');
        
        // Appel pour les statistiques des images
        const imagesResponse = await api.get('/files?type=image&limit=1');
        
        // Appel pour les statistiques des PDFs
        const pdfsResponse = await api.get('/files?type=pdf&limit=1');
        
        // Appel pour récupérer les fichiers récents (hors images)
        const recentFilesResponse = await api.get('/files?limit=5');

        setStats({
          totalFiles: statsResponse.data.totalFiles || 0,
          totalImages: imagesResponse.data.pagination?.total || 0,
          totalPdfs: pdfsResponse.data.pagination?.total || 0,
          recentFiles: recentFilesResponse.data.files || []
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const getFileIcon = (filename) => {
    return <FiFile />;
  };

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div className='my-space-title'>
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
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
          </div>
        </div>

        {/* Message de bienvenue */}
        {welcomeMessage && (
          <div className="welcome-message mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">{welcomeMessage}</p>
          </div>
        )}

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon files">
              <FiBarChart2 />
            </div>
            <div className="metric-content">
              <h3>Total des fichiers</h3>
              <div className="metric-value">{stats.totalFiles}</div>
              <div className="metric-subtitle">Tous vos documents sécurisés</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon shares">
              <FiImage />
            </div>
            <div className="metric-content">
              <h3>Images</h3>
              <div className="metric-value">{stats.totalImages}</div>
              <div className="metric-subtitle">Photos et illustrations</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon users">
              <FiFileText />
            </div>
            <div className="metric-content">
              <h3>Documents PDF</h3>
              <div className="metric-value">{stats.totalPdfs}</div>
              <div className="metric-subtitle">Documents et rapports</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon storage">
              <FiLock />
            </div>
            <div className="metric-content">
              <h3>Sécurité</h3>
              <div className="metric-value">100%</div>
              <div className="metric-subtitle">Chiffrement SHA-256</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Actions rapides</h2>
            </div>
            <div className="card-body">
              <div className="card-actions">
                <Link to="/upload" className="btn btn-primary">
                  <FiUpload /> Uploader un fichier
                </Link>
                <Link to="/files" className="btn btn-secondary">
                  <FiFolder /> Voir mes fichiers
                </Link>
              </div>
            </div>
          </div>

          {stats.recentFiles.length > 0 && (
            <div className="card mt-6">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Fichiers récents</h2>
              </div>
              <div className="card-body">
                <div className="recent-files-list">
                  {stats.recentFiles.map((file) => (
                    <div key={file.id} className="recent-file-item">
                      <div className="recent-file-info">
                        <div className="recent-file-icon">
                          {getFileIcon(file.filename)}
                        </div>
                        <div className="recent-file-details">
                          <div className="recent-file-name" title={file.filename}>
                            {file.filename && file.filename.length > 30 
                              ? file.filename.substring(0, 27) + '...' 
                              : file.filename}
                          </div>
                          <div className="recent-file-meta">
                            Uploadé le {formatDate(file.date_upload)} • 
                            Version {file.version}
                          </div>
                        </div>
                      </div>
                      <div className="recent-file-actions">
                        <Link 
                          to={`/files`}
                          className="btn btn-sm btn-secondary"
                        >
                          Voir
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-footer" style={{ marginTop: '1rem' }}>
                <Link to="/files" className="btn btn-secondary">
                  Voir tous les fichiers
                </Link>
              </div>
            </div>
          )}

          {stats.totalFiles === 0 && (
            <div className="card mt-6">
              <div className="card-body text-center py-8">
                <div className="text-6xl mb-4"><FiFolder size={64} /></div>
                <h3 className="text-xl font-semibold mb-2">
                  Aucun fichier pour le moment
                </h3>
                <p className="text-secondary mb-4">
                  Commencez par uploader votre premier document pour sécuriser vos fichiers
                </p>
                <Link to="/upload" className="btn btn-primary">
                  <FiUpload /> Uploader mon premier fichier
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
