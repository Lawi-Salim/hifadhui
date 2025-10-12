import React, { useState } from 'react';
import { FiAlertTriangle, FiClock, FiUser, FiEye, FiUserCheck, FiArchive, FiPause } from 'react-icons/fi';
import ReportedUserModal from './ReportedUserModal';
import './FailedLoginAttemptsTable.css';

const ModerationActionsTable = ({ actions, type }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!actions || actions.length === 0) {
    return null;
  }

  // Utiliser la première action pour les métadonnées du type
  const mainAction = actions[0];

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour ouvrir le modal de détails utilisateur
  const handleViewUser = async (action) => {
    try {
      const userData = {
        id: action.userId || action.user_id,
        username: action.username || 'Utilisateur',
        email: action.email || 'Non disponible',
        created_at: action.userCreatedAt || null,
        deleted_at: action.userDeletedAt || null,
      };
      
      setSelectedUser(userData);
      setSelectedAction(action);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedAction(null);
  };

  // Adapter le contenu selon le type d'action
  const getActionTypeInfo = () => {
    switch (type) {
      case 'warning':
      case 'warn':
        return {
          title: 'Avertissements',
          description: 'Utilisateurs ayant reçu un avertissement',
          icon: FiAlertTriangle,
          showSeverity: false
        };
      case 'suspension':
      case 'suspend':
        return {
          title: 'Suspensions',
          description: 'Utilisateurs suspendus temporairement',
          icon: FiPause,
          showSeverity: false
        };
      case 'deletion':
      case 'delete':
        return {
          title: 'Suppressions',
          description: 'Utilisateurs supprimés définitivement',
          icon: FiArchive,
          showSeverity: false
        };
      default:
        return {
          title: 'Actions de modération',
          description: 'Actions effectuées par les administrateurs',
          icon: FiAlertTriangle,
          showSeverity: false
        };
    }
  };

  const typeInfo = getActionTypeInfo();
  const IconComponent = typeInfo.icon;

  return (
    <div className="failed-login-attempts-container">
      <div className="attempts-header">
        <div className="header-icon">
          <IconComponent />
        </div>
        <div className="header-content">
          <h3>{typeInfo.title}</h3>
          <p>{typeInfo.description}</p>
        </div>
        <div className="status-badge" style={{ 
          backgroundColor: '#10b981',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {actions.length} action{actions.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Tableau des actions */}
      <div className="attempts-table-container">
        <table className="attempts-table">
          <thead>
            <tr>
              <th>Utilisateur ciblé</th>
              <th>Email ciblé</th>
              <th>Date d'action</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action, index) => {
              // Fonction pour gérer l'ouverture du modal pour cette action spécifique
              const handleViewCurrentUser = async () => {
                try {
                  const userData = {
                    id: action.userId || action.user_id,
                    username: action.username || 'Utilisateur',
                    email: action.email || 'Non disponible',
                    created_at: action.userCreatedAt || null,
                    deleted_at: action.userDeletedAt || null,
                  };
                  
                  setSelectedUser(userData);
                  setSelectedAction(action);
                  setIsModalOpen(true);
                } catch (error) {
                  console.error('Erreur lors de l\'ouverture du modal:', error);
                }
              };

              return (
                <tr key={action.id || index}>
                  <td>
                    <div className="email-cell">
                      <span className="email-address">{action.username || 'Utilisateur'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      <span className="email-address">{action.email || 'Non disponible'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <span className="date-primary">{formatDate(action.created_at || action.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className="status-badge-small" style={{
                        backgroundColor: type === 'warning' ? '#f59e0b' : 
                                       type === 'suspension' ? '#ef4444' : 
                                       type === 'deletion' ? '#dc2626' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {type === 'warning' ? 'AVERTI' : 
                         type === 'suspension' ? 'SUSPENDU' : 
                         type === 'deletion' ? 'SUPPRIMÉ' : 'TRAITÉ'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="action-btn view" 
                      title="Voir détails utilisateur"
                      onClick={handleViewCurrentUser}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de détails utilisateur */}
      <ReportedUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        report={selectedAction}
        context={type} // Passer le type d'action comme contexte
        onActionComplete={() => {
          console.log('Action de modération effectuée, rafraîchissement des données...');
        }}
      />
    </div>
  );
};

export default ModerationActionsTable;
