import React, { useState, useEffect } from 'react';
import './ActivityList.css';
import { getActivitySummary } from '../../services/adminService';
import Modal from '../Modal';
import UserActivityDetails from './UserActivityDetails';
import Pagination from '../Pagination';
import UserAvatar from '../Layout/UserAvatar';

const ActivityList = () => {
  const [summary, setSummary] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSummary = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getActivitySummary(page);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Erreur lors de la récupération des activités.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary(currentPage);
  }, [currentPage]);

  const formatActionType = (actionType) => {
    if (!actionType) return 'N/A';
    return actionType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="activity-list">
      <Pagination 
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
      <table>
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Dernière activité</th>
            <th>Total Activités</th>
          </tr>
        </thead>
        <tbody>
          {summary.length > 0 ? (
            summary.map(item => (
              <tr key={item.id} onClick={() => setSelectedUser(item.user)} style={{ cursor: 'pointer' }}>
                <td><UserAvatar name={item.user?.username} size={32} /></td>
                <td>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                <td>{item.user?.username || 'N/A'}</td>
                <td>{item.user?.email || 'N/A'}</td>
                                <td>{formatActionType(item.actionType)}</td>
                <td>{item.totalUserActivities}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                Aucune activité à afficher pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination pagination={pagination} onPageChange={fetchSummary} />
      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={`Détails pour ${selectedUser.username}`}>
          <UserActivityDetails userId={selectedUser.id} />
        </Modal>
      )}
    </div>
  );
};

export default ActivityList;
