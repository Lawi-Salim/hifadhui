import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/adminService';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import Pagination from '../Pagination';
import LoadingSpinner from '../Common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FiUsers, FiRefreshCw, FiEye, FiAlertTriangle, FiPause, FiTrash2 } from 'react-icons/fi';
import UserDetailsModal from './UserDetailsModal';
import './StyleAdmin.css';
import './AdminDashboard.css';

const ListeUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('warnings');
  const [actionHistory, setActionHistory] = useState({
    warnings: [],
    suspensions: [],
    deletions: []
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const pageToUse = page || currentPage || 1;
      const { users: data, pagination: paginationData } = await getUsers(pageToUse);
      setUsers(data);
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la récupération des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleActionComplete = () => {
    // Recharger les données après une action admin
    fetchUsers(currentPage);
    loadActionHistory();
  };

  // Fonction pour charger l'historique des actions admin
  const loadActionHistory = async () => {
    try {
      // TODO: Remplacer par un vrai appel API
      // const response = await adminService.getActionHistory();
      
      // Données simulées pour la démonstration
      setActionHistory({
        warnings: [
          {
            id: 1,
            user_id: 'user-1',
            username: 'John Doe',
            email: 'john@example.com',
            reason: 'Contenu inapproprié dans les fichiers partagés',
            admin_name: 'Admin',
            created_at: new Date('2024-01-15'),
            notification_sent: true
          },
          {
            id: 2,
            user_id: 'user-2',
            username: 'Jane Smith',
            email: 'jane@example.com',
            reason: 'Utilisation excessive de l\'espace de stockage',
            admin_name: 'Admin',
            created_at: new Date('2024-01-10'),
            notification_sent: true
          }
        ],
        suspensions: [
          {
            id: 1,
            user_id: 'user-3',
            username: 'Bob Wilson',
            email: 'bob@example.com',
            reason: 'Violations répétées des conditions d\'utilisation',
            admin_name: 'Admin',
            created_at: new Date('2024-01-12'),
            recovered_at: null,
            status: 'active'
          }
        ],
        deletions: [
          {
            id: 1,
            user_id: 'user-4',
            username: 'Alice Brown',
            email: 'alice@example.com',
            reason: 'Demande de suppression définitive pour violation grave',
            admin_name: 'Admin',
            created_at: new Date('2024-01-08'),
            details: {
              files_count: 25,
              storage_used: '150MB'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
    loadActionHistory();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="messages-page">
        <LoadingSpinner message="Chargement de la liste des utilisateurs..." />
      </div>
    );
  }

  if (error) {
    return <div className="messages-page error-message">{error}</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-title">
          <h1>
            <FiUsers className="page-icon" />
            Liste des Utilisateurs
          </h1>
          <p>Gérez et surveillez tous les comptes utilisateurs de la plateforme</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={fetchUsers}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} /> 
            Actualiser
          </button>
        </div>
      </div>


      {/* Users Table Container - Style TechnicalPage */}
      <div className="dashboard-section">
        <h3><FiUsers /> Liste des utilisateurs ({users.length})</h3>
        
        <div className="attempts-table-container">
          <table className="attempts-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nom d'utilisateur</th>
                <th>Email</th>
                <th>Provider</th>
                <th>Rôle</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="avatar-cell">
                      <SmartAvatar user={u} size={32} />
                    </td>
                    <td className="username-cell">
                      <span className="username">{u.username}</span>
                      <span className="user-id"> (ID: <UserDisplayName user={u} />)</span>
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td className="provider-cell">
                      <ProviderIcon user={u} />
                    </td>
                    <td className="role-cell">
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td className="date-cell">
                      {format(new Date(u.created_at), 'd MMMM yyyy', { locale: fr })}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn view"
                        title="Voir détails"
                        onClick={() => handleViewUser(u)}
                      >
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <FiUsers style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-secondary)' }} />
                    <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Aucun utilisateur</h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aucun utilisateur trouvé dans la base de données.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Contrôles de pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems || users.length}
            itemsPerPage={pagination.limit || 10}
            hasNextPage={currentPage < pagination.totalPages}
            hasPrevPage={currentPage > 1}
            onPageChange={setCurrentPage}
            itemName="utilisateurs"
          />
        )}
      </div>

      {/* Section Actions Admin */}
      <div className="dashboard-section">
        <h3><FiUsers /> Historique des Actions Admin</h3>
        
        {/* Tabs Navigation */}
        <div className="messages-tabs">
          <button 
            className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            <FiAlertTriangle /> Avertissements ({actionHistory.warnings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'suspensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suspensions')}
          >
            <FiPause /> Suspensions ({actionHistory.suspensions.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'deletions' ? 'active' : ''}`}
            onClick={() => setActiveTab('deletions')}
          >
            <FiTrash2 /> Suppressions ({actionHistory.deletions.length})
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="tab-content">
          {activeTab === 'warnings' && (
            <div className="action-history-container">
              {actionHistory.warnings.length > 0 ? (
                <div className="attempts-table-container">
                  <table className="attempts-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Raison</th>
                        <th>Date</th>
                        <th>Admin</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionHistory.warnings.map((warning) => (
                        <tr key={warning.id}>
                          <td className="username-cell">
                            <span className="username">{warning.username}</span>
                          </td>
                          <td className="email-cell">{warning.email}</td>
                          <td className="reason-cell">{warning.reason}</td>
                          <td className="date-cell">
                            {format(new Date(warning.created_at), 'd MMMM yyyy', { locale: fr })}
                          </td>
                          <td className="admin-cell">{warning.admin_name}</td>
                          <td className="status-cell">
                            <span className={`status-badge ${warning.notification_sent ? 'sent' : 'pending'}`}>
                              {warning.notification_sent ? 'Envoyé' : 'En attente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">
                  <FiAlertTriangle style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-secondary)' }} />
                  <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Aucun avertissement</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aucun avertissement n'a été donné pour le moment.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suspensions' && (
            <div className="action-history-container">
              {actionHistory.suspensions.length > 0 ? (
                <div className="attempts-table-container">
                  <table className="attempts-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Raison</th>
                        <th>Date suspension</th>
                        <th>Admin</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionHistory.suspensions.map((suspension) => (
                        <tr key={suspension.id}>
                          <td className="username-cell">
                            <span className="username">{suspension.username}</span>
                          </td>
                          <td className="email-cell">{suspension.email}</td>
                          <td className="reason-cell">{suspension.reason}</td>
                          <td className="date-cell">
                            {format(new Date(suspension.created_at), 'd MMMM yyyy', { locale: fr })}
                          </td>
                          <td className="admin-cell">{suspension.admin_name}</td>
                          <td className="status-cell">
                            <span className={`status-badge ${suspension.recovered_at ? 'recovered' : 'active'}`}>
                              {suspension.recovered_at ? 'Récupéré' : 'Actif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">
                  <FiPause style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-secondary)' }} />
                  <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Aucune suspension</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aucune suspension n'a été appliquée pour le moment.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deletions' && (
            <div className="action-history-container">
              {actionHistory.deletions.length > 0 ? (
                <div className="attempts-table-container">
                  <table className="attempts-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Raison</th>
                        <th>Date suppression</th>
                        <th>Admin</th>
                        <th>Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionHistory.deletions.map((deletion) => (
                        <tr key={deletion.id}>
                          <td className="username-cell">
                            <span className="username">{deletion.username}</span>
                          </td>
                          <td className="email-cell">{deletion.email}</td>
                          <td className="reason-cell">{deletion.reason}</td>
                          <td className="date-cell">
                            {format(new Date(deletion.created_at), 'd MMMM yyyy', { locale: fr })}
                          </td>
                          <td className="admin-cell">{deletion.admin_name}</td>
                          <td className="details-cell">
                            {deletion.details && (
                              <span className="details-info">
                                {deletion.details.files_count} fichiers, {deletion.details.storage_used}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">
                  <FiTrash2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-secondary)' }} />
                  <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Aucune suppression</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aucune suppression définitive n'a été effectuée pour le moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={handleCloseUserModal}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
};

export default ListeUtilisateurs;
