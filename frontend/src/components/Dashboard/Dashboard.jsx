import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiFolder, FiFileText, FiLock, FiUpload, FiFile, FiBarChart2, FiMenu, FiImage } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { loginWithToken } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalImages: 0,
    totalPdfs: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Gérer l'authentification OAuth depuis les paramètres URL
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const oauthSuccess = searchParams.get('oauth_success');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const isNewAccount = searchParams.get('isNewAccount') === 'true';
      const wasLinked = searchParams.get('wasLinked') === 'true';

      if (oauthSuccess === 'true' && token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          
          console.log('✅ [DASHBOARD] Traitement OAuth callback:', {
            user: user.email,
            isNewAccount,
            wasLinked
          });

          // Authentifier l'utilisateur
          const result = loginWithToken(user, token);
          
          if (result.success) {
            // Générer le message de bienvenue
            let message = '';
            if (isNewAccount) {
              message = `Bienvenue ${user.username || user.email} ! Votre compte Google a été créé avec succès.`;
            } else if (wasLinked) {
              message = `Compte Google lié avec succès ! Bienvenue ${user.username || user.email}.`;
            } else {
              message = `Bon retour ${user.username || user.email} !`;
            }
            
            setWelcomeMessage(message);
            
            // Effacer le message après 5 secondes
            const timer = setTimeout(() => {
              setWelcomeMessage('');
            }, 5000);
            
            // Nettoyer l'URL des paramètres OAuth
            navigate('/dashboard', { replace: true });
            
            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error('❌ [DASHBOARD] Erreur OAuth callback:', error);
          navigate('/login?error=Erreur lors de l\'authentification', { replace: true });
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams, loginWithToken, navigate]);

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
    return (
      <div className="flex justify-center items-center" style={{ height: '400px' }}>
        <div className="loading"></div>
      </div>
    );
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
              <div className="stat-title">Images</div>
              <div className="stat-icon success"><FiImage /></div>
            </div>
            <div className="stat-value">{stats.totalImages}</div>
            <div className="stat-change positive">
              Photos et illustrations
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-title">Documents PDF</div>
              <div className="stat-icon info"><FiFileText /></div>
            </div>
            <div className="stat-value">{stats.totalPdfs}</div>
            <div className="stat-change positive">
              Documents et rapports
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
