import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/adminService';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import Pagination from '../Pagination';
import LoadingSpinner from '../Common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FiUsers, FiRefreshCw, FiEye, FiMenu } from 'react-icons/fi';
import UserDetailsModal from './UserDetailsModal';
import './StyleAdmin.css';
import './AdminDashboard.css';

const ListeUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  };

  useEffect(() => {
    fetchUsers(currentPage);
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
            <h1>
              <FiUsers className="page-icon" />
              Liste utilisateur
            </h1>
          </div>
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
