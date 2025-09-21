import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/adminService';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import Pagination from '../Pagination';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './StyleAdmin.css';

const ListeUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUsers = async (page) => {
      try {
        setLoading(true);
        const { users: data, pagination: paginationData } = await getUsers(page);
        setUsers(data);
        setPagination(paginationData);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Une erreur est survenue lors de la récupération des utilisateurs.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers(currentPage);
  }, [currentPage]);

  if (loading) {
    return <div className="admin-container">Chargement de la liste des utilisateurs...</div>;
  }

  if (error) {
    return <div className="admin-container error-message">{error}</div>;
  }

  return (
    <div className="admin-container">
      <h1 className="admin-title">Liste des Utilisateurs</h1>
      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Nom d'utilisateur</th>
              <th>Email</th>
              <th>Provider</th>
              <th>Rôle</th>
              <th>Date d'inscription</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <SmartAvatar user={u} size={32} />
                </td>
                <td>
                  <div>
                    <div>{u.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ID: <UserDisplayName user={u} />
                    </div>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <ProviderIcon user={u} />
                </td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>{format(new Date(u.createdAt), 'd MMMM yyyy', { locale: fr })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ListeUtilisateurs;
