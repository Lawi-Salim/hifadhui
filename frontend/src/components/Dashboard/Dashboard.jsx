import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiFolder, FiFileText, FiLock, FiUpload, FiFile, FiBarChart2 } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { user, forceLogout } = useAuth();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalCertificates: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Appel pour les statistiques globales (total fichiers et certificats)
        const statsResponse = await api.get('/files/stats');
        
        // Appel pour récupérer les fichiers récents (hors images)
        const recentFilesResponse = await api.get('/files?limit=5');

        setStats({
          totalFiles: statsResponse.data.totalFiles || 0,
          totalCertificates: statsResponse.data.totalCertificates || 0,
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
    return (
      <div className="flex justify-center items-center" style={{ height: '400px' }}>
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        
        {/* <div className="dashboard-header">
          <h1 className="dashboard-title">
            Bonjour, {user?.username}
          </h1>
          <p className="dashboard-subtitle">
            Voici un aperçu de votre coffre-fort numérique
          </p>
        </div> */}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-title">Total des fichiers</div>
              <div className="stat-icon primary"><FiBarChart2 /></div>
            </div>
            <div className="stat-value">{stats.totalFiles}</div>
            <div className="stat-change positive">
              Tous vos documents sécurisés
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-title">Certificats générés</div>
              <div className="stat-icon success"><FiFileText /></div>
            </div>
            <div className="stat-value">{stats.totalCertificates}</div>
            <div className="stat-change positive">
              Preuves de propriété
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-title">Sécurité</div>
              <div className="stat-icon warning"><FiLock /></div>
            </div>
            <div className="stat-value">100%</div>
            <div className="stat-change positive">
              Chiffrement SHA-256
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
                <Link to="/certificates" className="btn btn-secondary">
                  <FiFileText /> Mes certificats
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
                          <div className="recent-file-name">{file.filename}</div>
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
