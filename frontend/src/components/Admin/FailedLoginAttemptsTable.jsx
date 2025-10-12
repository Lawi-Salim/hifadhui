import React, { useState } from 'react';
import { FiAlertTriangle, FiClock, FiGlobe, FiMonitor, FiEye } from 'react-icons/fi';
import ReportedUserModal from './ReportedUserModal';
import './FailedLoginAttemptsTable.css';

const ReportDetailsTable = ({ report, reports }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Utiliser la liste de signalements si fournie, sinon un seul signalement
  const reportsList = reports || [report];
  const mainReport = report;

  if (!mainReport) {
    return null;
  }

  // Extraire les données du champ evidence
  const evidence = report.evidence || {};
  const {
    ip,
    userAgent,
    email,
    attemptCount,
    detectionTime,
    threshold,
    timeWindow
  } = evidence;

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

  // Obtenir le navigateur à partir du User-Agent
  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return 'Inconnu';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Autre';
  };

  // Obtenir le niveau de sévérité
  const getSeverityLevel = (count) => {
    if (count >= 10) return { level: 'critical', label: 'Critique', color: '#dc2626' };
    if (count >= 7) return { level: 'high', label: 'Élevé', color: '#ea580c' };
    if (count >= 5) return { level: 'medium', label: 'Moyen', color: '#d97706' };
    return { level: 'low', label: 'Faible', color: '#65a30d' };
  };

  const severity = getSeverityLevel(attemptCount);

  // Fonction pour ouvrir le modal de détails utilisateur
  const handleViewUser = async () => {
    try {
      let userData = null;

      // Pour les tentatives de connexion, récupérer l'utilisateur par email
      if (report.type === 'failed_login_attempts' && email) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/admin/users/by-email/${encodeURIComponent(email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userFromApi = await response.json();
          userData = {
            id: userFromApi.id,
            username: userFromApi.username,
            email: userFromApi.email,
            created_at: userFromApi.created_at,
            deleted_at: userFromApi.deleted_at,
          };
        } else {
          // Si l'utilisateur n'existe pas, créer un objet avec les infos disponibles
          userData = {
            id: null,
            username: email ? email.split('@')[0] : 'Inconnu',
            email: email || 'Non disponible',
            created_at: null,
            deleted_at: null,
          };
        }
      } else {
        // Pour les autres types de signalements
        userData = {
          id: report.reported_user_id || null,
          username: report.username || 'Inconnu',
          email: report.userEmail || 'Non disponible',
          created_at: report.userCreatedAt || null,
          deleted_at: report.userDeletedAt || null,
        };
      }
      
      setSelectedUser(userData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      // Fallback avec les données disponibles
      const userData = {
        id: null,
        username: email ? email.split('@')[0] : 'Inconnu',
        email: email || 'Non disponible',
        created_at: null,
        deleted_at: null,
      };
      
      setSelectedUser(userData);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedReport(null);
  };

  // Adapter le contenu selon le type de signalement
  const getReportTypeInfo = () => {
    switch (report.type) {
      case 'failed_login_attempts':
        return {
          title: 'Tentatives de connexion suspectes',
          description: 'Détection automatique d\'activité malveillante',
          icon: FiAlertTriangle,
          showSeverity: true
        };
      case 'inappropriate':
        return {
          title: 'Contenu inapproprié signalé',
          description: 'Signalement de contenu non conforme',
          icon: FiAlertTriangle,
          showSeverity: false
        };
      case 'spam':
        return {
          title: 'Contenu spam détecté',
          description: 'Signalement de contenu indésirable',
          icon: FiAlertTriangle,
          showSeverity: false
        };
      case 'copyright':
        return {
          title: 'Violation de droits d\'auteur',
          description: 'Signalement de contenu protégé',
          icon: FiAlertTriangle,
          showSeverity: false
        };
      default:
        return {
          title: 'Signalement',
          description: 'Signalement utilisateur',
          icon: FiAlertTriangle,
          showSeverity: false
        };
    }
  };

  const typeInfo = getReportTypeInfo();
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
        {typeInfo.showSeverity && (
          <div className="severity-badge" style={{ backgroundColor: severity.color }}>
            {severity.label}
          </div>
        )}
        {!typeInfo.showSeverity && (
          <div className="status-badge" style={{ 
            backgroundColor: report.status === 'pending' ? '#f59e0b' : 
                           report.status === 'resolved' ? '#10b981' : '#6b7280',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {report.status === 'pending' ? 'En attente' : 
             report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
          </div>
        )}
      </div>


      {/* Tableau des détails */}
      <div className="attempts-table-container">
        <table className="attempts-table">
          <thead>
            <tr>
              {report.type === 'failed_login_attempts' ? (
                <>
                  <th>Utilisateur ciblé</th>
                  <th>Email ciblé</th>
                  <th>Date de détection</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </>
              ) : (
                <>
                  <th>Utilisateur signalé</th>
                  <th>Date de signalement</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {reportsList.map((currentReport, index) => {
              const currentEvidence = currentReport.evidence || {};
              const {
                ip: currentIp,
                email: currentEmail,
                attemptCount: currentAttemptCount,
                detectionTime: currentDetectionTime,
                threshold: currentThreshold
              } = currentEvidence;

              // Fonction pour gérer l'ouverture du modal pour ce signalement spécifique
              const handleViewCurrentUser = async () => {
                try {
                  let userData = null;

                  // Pour les tentatives de connexion, récupérer l'utilisateur par email
                  if (currentReport.type === 'failed_login_attempts' && currentEmail) {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/v1/admin/users/by-email/${encodeURIComponent(currentEmail)}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });

                    if (response.ok) {
                      const userFromApi = await response.json();
                      userData = {
                        id: userFromApi.id,
                        username: userFromApi.username,
                        email: userFromApi.email,
                        created_at: userFromApi.created_at,
                        deleted_at: userFromApi.deleted_at,
                      };
                    } else {
                      // Si l'utilisateur n'existe pas, créer un objet avec les infos disponibles
                      userData = {
                        id: null,
                        username: currentEmail ? currentEmail.split('@')[0] : 'Inconnu',
                        email: currentEmail || 'Non disponible',
                        created_at: null,
                        deleted_at: null,
                      };
                    }
                  } else {
                    // Pour les autres types de signalements
                    userData = {
                      id: currentReport.reported_user_id || null,
                      username: currentReport.username || 'Inconnu',
                      email: currentReport.userEmail || 'Non disponible',
                      created_at: currentReport.userCreatedAt || null,
                      deleted_at: currentReport.userDeletedAt || null,
                    };
                  }
                  
                  setSelectedUser(userData);
                  setSelectedReport(currentReport);
                  setIsModalOpen(true);
                } catch (error) {
                  console.error('Erreur lors de la récupération de l\'utilisateur:', error);
                  // Fallback avec les données disponibles
                  const userData = {
                    id: null,
                    username: currentEmail ? currentEmail.split('@')[0] : 'Inconnu',
                    email: currentEmail || 'Non disponible',
                    created_at: null,
                    deleted_at: null,
                  };
                  
                  setSelectedUser(userData);
                  setSelectedReport(currentReport);
                  setIsModalOpen(true);
                }
              };

              return (
                <tr key={currentReport.id || index}>
                  {currentReport.type === 'failed_login_attempts' ? (
                    <>
                      <td>
                        <div className="email-cell">
                          <span className="email-address">{currentEmail ? currentEmail.split('@')[0] : 'Inconnu'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="email-cell">
                          <span className="email-address">{currentEmail || 'Non spécifié'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span className="date-primary">{formatDate(currentDetectionTime)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          <span className="status-badge blocked">
                            IP Bloquée ({currentAttemptCount || 0}/{currentThreshold || 5})
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
                    </>
                  ) : (
                    <>
                      <td>
                        <div className="email-cell">
                          <span className="email-address">{currentReport.username || 'Non défini'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span className="date-primary">{formatDate(currentReport.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="ip-cell">
                          <span className="ip-address">{typeInfo.title}</span>
                        </div>
                      </td>
                      <td>
                        <div className="attempts-cell">
                          <span className="attempts-count">
                            {currentReport.source === 'automatic' ? 'Auto' : 'Manuel'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          <span className={`status-badge ${currentReport.status}`}>
                            {currentReport.status === 'pending' ? 'En attente' : 
                             currentReport.status === 'resolved' ? 'Résolu' : 'Rejeté'}
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
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de détails utilisateur signalé */}
      <ReportedUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        report={selectedReport || report}
        context="report" // Contexte pour l'onglet signalements
        onActionComplete={() => {
          // Callback pour rafraîchir les données après une action de modération
          console.log('Action de modération effectuée, rafraîchissement des données...');
          // TODO: Ajouter la logique de rafraîchissement si nécessaire
        }}
      />
    </div>
  );
};

export default ReportDetailsTable;
