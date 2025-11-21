import React, { useState, useEffect } from 'react';
import { 
  FiHash,
  FiUsers,
  FiBarChart2,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiFile,
  FiMenu,
  FiTrendingUp,
  FiPackage
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa';
import LoadingSpinner from '../Common/LoadingSpinner';
import empreinteAdminService from '../../services/empreinteAdminService';
import './AdminDashboard.css';
import '../../pages/GenerateEmpreintes.css';
import { formatFileSize } from '../../utils/fileSize';

const EmpreintesPage = () => {
  // États pour les onglets
  const [activeTab, setActiveTab] = useState('all'); // all, stats, users
  
  // États pour la liste des empreintes (onglet 1)
  const [empreintes, setEmpreintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  // Filtres
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    userId: ''
  });
  
  // États pour les statistiques (onglet 2)
  const [stats, setStats] = useState({
    global: {
      total: 0,
      disponibles: 0,
      utilisees: 0,
      expirees: 0,
      tauxUtilisation: 0
    },
    topGenerateurs: [],
    topUtilisateurs: [],
    tendances: {
      empreintesParJour: []
    }
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // États pour les utilisateurs (onglet 3)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Modal de détails
  const [selectedEmpreinte, setSelectedEmpreinte] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);

  // Charger les stats et users au montage initial
  useEffect(() => {
    fetchStats();
    fetchUsers(); // Charger les users pour avoir le bon compteur
  }, []);

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    if (activeTab === 'all') {
      fetchEmpreintes();
    } else if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, filters, pagination.page]);

  const fetchEmpreintes = async () => {
    try {
      setLoading(true);
      const data = await empreinteAdminService.getAllEmpreintes({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setEmpreintes(data.data.empreintes);
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Erreur chargement empreintes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await empreinteAdminService.getEmpreintesStats();
      console.log('📊 Stats reçues du backend:', data.data);
      setStats(data.data);
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await empreinteAdminService.getEmpreintesUsers();
      console.log('👥 Users reçus:', data.data);
      setUsers(data.data);
    } catch (error) {
      console.error('Erreur chargement users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleViewDetails = async (empreinte) => {
    try {
      const data = await empreinteAdminService.getEmpreinteDetails(empreinte.id);
      setSelectedEmpreinte(data.data);
      setDetailsModal(true);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à la page 1
  };

  const handleRefresh = () => {
    // Toujours recharger les stats pour les cartes
    fetchStats();
    
    // Recharger aussi l'onglet actif
    if (activeTab === 'all') fetchEmpreintes();
    else if (activeTab === 'users') fetchUsers();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      disponible: { icon: <FiClock />, class: 'status-disponible', text: 'Disponible' },
      utilise: { icon: <FiCheckCircle />, class: 'status-utilise', text: 'Utilisée' },
      expire: { icon: <FiXCircle />, class: 'status-expire', text: 'Expirée' }
    };
    const badge = badges[status] || badges.disponible;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  if (loading && activeTab === 'all' && empreintes.length === 0) {
    return (
      <div className="admin-dashboard">
        <LoadingSpinner message="Chargement des empreintes..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
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
          <h1>
            <FaFingerprint /> Gestion des Empreintes
          </h1>
          <button 
            className="btn btn-primary refresh-btn"
            onClick={handleRefresh}
            disabled={loading || statsLoading || usersLoading}
          >
            <FiRefreshCw className={loading || statsLoading || usersLoading ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <section className="dashboard-section">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon shares">
              <FiPackage />
            </div>
            <div className="metric-content">
              <h3>Total Empreintes</h3>
              <div className="metric-value">{stats.global.total}</div>
              <div className="metric-subtitle">Toutes générations</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon files">
              <FiCheckCircle />
            </div>
            <div className="metric-content">
              <h3>Utilisées</h3>
              <div className="metric-value">{stats.global.utilisees}</div>
              <div className="metric-subtitle">Associées à un fichier</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon storage">
              <FiClock />
            </div>
            <div className="metric-content">
              <h3>Disponibles</h3>
              <div className="metric-value">{stats.global.disponibles}</div>
              <div className="metric-subtitle">Prêtes à l'emploi</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon alerts">
              <FiXCircle />
            </div>
            <div className="metric-content">
              <h3>Expirées</h3>
              <div className="metric-value">{stats.global.expirees}</div>
              <div className="metric-subtitle">Non utilisées</div>
            </div>
          </div>
        </div>
      </section>

      {/* Onglets */}
      <section className="dashboard-section">
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FaFingerprint />
            Toutes les Empreintes ({pagination.total})
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FiBarChart2 />
            Statistiques
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers />
            Par Utilisateur ({users.filter(u => u.role !== 'admin').length})
          </button>
        </div>

        {/* Contenu de l'onglet "Toutes les Empreintes" */}
        {activeTab === 'all' && (
          <div className="tab-content">
            {/* Filtres */}
            <div className="admin-filters-section">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">
                    <FiFilter className="filter-icon" />
                    Statut
                  </label>
                  <select 
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous</option>
                    <option value="disponible">Disponible</option>
                    <option value="utilisee">Utilisée</option>
                    <option value="expiree">Expirée</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    <FiSearch className="filter-icon" />
                    Recherche
                  </label>
                  <input
                    type="text"
                    placeholder="Product ID, Hash, Signature..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="filter-select"
                  />
                </div>
              </div>
            </div>

            {/* Tableau des empreintes */}
            {loading ? (
              <LoadingSpinner message="Chargement..." />
            ) : empreintes.length === 0 ? (
              <div className="empty-state">
                <FaFingerprint size={48} />
                <p>Aucune empreinte trouvée</p>
              </div>
            ) : (
              <>
                <div className="empreintes-table-container">
                  <table className="empreintes-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Propriétaire</th>
                        <th>Statut</th>
                        <th>Fichier Associé</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empreintes.map((emp) => (
                        <tr key={emp.id}>
                          <td className="product-id">
                            <code>{emp.product_id}</code>
                          </td>
                          <td>
                            <div className="user-cell">
                              <div>
                                <FiUser />
                                <strong>{emp.owner?.email || ''}</strong>
                              </div>
                            </div>
                          </td>
                          <td>{getStatusBadge(emp.status)}</td>
                          <td>
                            {emp.file ? (
                              <div className="file-cell">
                                <FiFile />
                                <a 
                                  href={`/share/${emp.hash_pregenere}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                                >
                                  {emp.file.filename}
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted">Non associé</span>
                            )}
                          </td>
                          <td className="actions">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleViewDetails(emp)}
                              title="Voir détails"
                            >
                              <FiEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Précédent
                    </button>
                    <span>
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                    <button
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Contenu de l'onglet "Statistiques" */}
        {activeTab === 'stats' && (
          <div className="tab-content">
            {statsLoading ? (
              <LoadingSpinner message="Chargement des statistiques..." />
            ) : (
              <div className="stats-layout-grid">
                {/* Colonne gauche : Top 10 Utilisateurs */}
                <div className="stats-card">
                  <h3><FiUsers /> Top 10 Utilisateurs (Taux d'Utilisation)</h3>
                  <div className="empreintes-table-container">
                    <table className="empreintes-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Total</th>
                          <th>Utilisées</th>
                          <th>Taux</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topUtilisateurs.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">
                              Aucune donnée disponible (min 5 empreintes)
                            </td>
                          </tr>
                        ) : (
                          stats.topUtilisateurs.map((user, idx) => (
                            <tr key={idx}>
                              <td>{user['owner.username'] || 'N/A'}</td>
                              <td>{user.total}</td>
                              <td>{user.utilisees}</td>
                              <td>
                                <span className={`badge ${user.tauxUtilisation >= 80 ? 'success' : user.tauxUtilisation >= 50 ? 'warning' : 'danger'}`}>
                                  {user.tauxUtilisation}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Colonne droite : 2 sections empilées */}
                <div className="stats-right-column">
                  {/* Taux d'utilisation */}
                  <div className="stats-card">
                    <h3><FiTrendingUp /> Taux d'Utilisation</h3>
                    <div className="empreintes-table-container">
                      <table className="empreintes-table">
                        <thead>
                          <tr>
                            <th>Métrique</th>
                            <th>Valeur</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Taux d'utilisation</td>
                            <td>
                              <span className={`badge ${stats.global.tauxUtilisation >= 80 ? 'success' : stats.global.tauxUtilisation >= 50 ? 'warning' : 'danger'}`}>
                                {stats.global.tauxUtilisation}%
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>Empreintes utilisées</td>
                            <td><strong>{stats.global.utilisees}</strong></td>
                          </tr>
                          <tr>
                            <td>Total empreintes</td>
                            <td><strong>{stats.global.total}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tendances */}
                  <div className="stats-card">
                    <h3><FiBarChart2 /> Empreintes Générées (7 derniers jours)</h3>
                    <div className="empreintes-table-container">
                      <table className="empreintes-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Nombre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.tendances.empreintesParJour.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="text-center text-muted">
                                Aucune donnée disponible
                              </td>
                            </tr>
                          ) : (
                            [...stats.tendances.empreintesParJour].reverse().map((day, idx) => (
                              <tr key={idx}>
                                <td>
                                  {new Date(day.date).toLocaleDateString('fr-FR', { 
                                    weekday: 'short',
                                    day: '2-digit', 
                                    month: 'short' 
                                  })}
                                </td>
                                <td><strong>{day.count}</strong></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contenu de l'onglet "Par Utilisateur" */}
        {activeTab === 'users' && (
          <div className="tab-content">
            {usersLoading ? (
              <LoadingSpinner message="Chargement des utilisateurs..." />
            ) : users.length === 0 ? (
              <div className="empty-state">
                <FiUsers size={48} />
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="empreintes-table-container">
                <table className="empreintes-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Total</th>
                      <th>Disponibles</th>
                      <th>Utilisées</th>
                      <th>Expirées</th>
                      <th>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => user.role !== 'admin') // Exclure les admins
                      .map((user) => (
                        <tr key={user.id}>
                          <td><strong>{user.username}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${user.role === 'admin' ? 'danger' : 'primary'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td><strong>{user.empreintes.total}</strong></td>
                          <td>{user.empreintes.disponibles}</td>
                          <td>{user.empreintes.utilisees}</td>
                          <td>{user.empreintes.expirees}</td>
                          <td>{formatDate(user.created_at)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de détails */}
      {detailsModal && selectedEmpreinte && (
        <div className="modal-overlay modal-detail-empreinte" onClick={() => setDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de l'empreinte</h2>
              <button className="modal-close" onClick={() => setDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Product ID:</strong>
                <code>{selectedEmpreinte.product_id}</code>
              </div>
              <div className="detail-row">
                <strong>Statut:</strong>
                {getStatusBadge(selectedEmpreinte.status)}
              </div>
              <div className="detail-row">
                <strong>Propriétaire:</strong>
                <div>
                  <div><strong>{selectedEmpreinte.owner?.username}</strong></div>
                  <div><small>{selectedEmpreinte.owner?.email}</small></div>
                </div>
              </div>
              <div className="detail-row">
                <strong>Hash Pré-généré:</strong>
                <code className="hash-full">{selectedEmpreinte.hash_pregenere}</code>
              </div>
              <div className="detail-row">
                <strong>Signature Pré-générée:</strong>
                <code className="hash-full">{selectedEmpreinte.signature_pregeneree}</code>
              </div>
              <div className="detail-row">
                <strong>Généré le:</strong>
                <span>{formatDate(selectedEmpreinte.generated_at)}</span>
              </div>
              <div className="detail-row">
                <strong>Utilisé le:</strong>
                <span>
                  {selectedEmpreinte.used_at 
                    ? formatDate(selectedEmpreinte.used_at) 
                    : <span className="text-muted">Empreinte non utilisée</span>
                  }
                </span>
              </div>
              <div className="detail-row">
                <strong>Expire le:</strong>
                <span>{formatDate(selectedEmpreinte.expires_at)}</span>
              </div>
              <div className="detail-row">
                <strong>Fichier associé:</strong>
                {selectedEmpreinte.file ? (
                  <div className="file-info">
                    <FiFile />
                    <div>
                      <a 
                        href={`/share/${selectedEmpreinte.hash_pregenere}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                      >
                        <strong>{selectedEmpreinte.file.filename}</strong>
                      </a>
                      <br />
                      <small>
                        {selectedEmpreinte.file.mimetype} • 
                        {formatFileSize(selectedEmpreinte.file.size)} • 
                        Uploadé le {formatDate(selectedEmpreinte.file.date_upload)}
                      </small>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted">Aucun fichier lié à cette empreinte</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpreintesPage;
