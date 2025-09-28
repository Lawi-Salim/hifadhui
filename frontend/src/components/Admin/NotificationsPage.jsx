import React, { useState, useEffect } from 'react';
import { 
  FiBell, 
  FiAlertCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiCheckCircle, 
  FiSearch, 
  FiFilter, 
  FiMoreVertical, 
  FiStar, 
  FiServer, 
  FiShield, 
  FiUser, 
  FiActivity, 
  FiMail, 
  FiSettings, 
  FiHardDrive,
  FiX,
  FiTrash2
} from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import AdminDeleteModal from './AdminDeleteModal';
import Pagination from '../Common/Pagination';
import notificationsService from '../../services/notificationsService';
import './AdminDashboard.css';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    unread: 0,
    alerts: 0,
    info: 0,
    total: 0
  });
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'single',
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false
  });


  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  // Actualisation automatique toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications(pagination.currentPage);
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [pagination.currentPage]);

  // Fermer le menu d'actions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu-container')) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsMenu]);

  // Fonction pour gérer le changement de page
  const handlePageChange = (newPage) => {
    loadNotifications(newPage);
  };

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      
      // Préparer les paramètres de filtrage selon l'onglet actif
      const params = {
        page: parseInt(page) || 1,
        limit: 50
      };

      // Utiliser le nouveau paramètre 'category' pour un filtrage plus précis
      if (activeTab !== 'all') {
        params.category = activeTab;
      }

      // Log supprimé pour performance

      // Charger les notifications avec pagination
      const notificationsResponse = await notificationsService.getNotifications(params);
      
      setNotifications(notificationsResponse.notifications || []);
      
      // Mettre à jour la pagination
      if (notificationsResponse.pagination) {
        setPagination({
          currentPage: notificationsResponse.pagination.currentPage || 1,
          totalPages: notificationsResponse.pagination.totalPages || 1,
          totalItems: notificationsResponse.pagination.totalItems || 0,
          itemsPerPage: notificationsResponse.pagination.itemsPerPage || 50,
          hasNextPage: notificationsResponse.pagination.hasNextPage || false,
          hasPrevPage: notificationsResponse.pagination.hasPrevPage || false
        });
      }
      
      // Utiliser les statistiques retournées par l'API
      if (notificationsResponse.stats) {
        setStats({
          unread: notificationsResponse.stats.unread || 0,
          alerts: notificationsResponse.stats.alerts || 0,  // Maintenant directement fourni par le backend
          info: notificationsResponse.stats.info || 0,      // Maintenant directement fourni par le backend
          total: notificationsResponse.stats.total || 0
        });
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      
      // En cas d'erreur, afficher des données vides
      setNotifications([]);
      
      setStats({
        unread: 0,
        alerts: 0,
        info: 0,
        total: 0
      });
      
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 50,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le clic sur une notification (afficher les détails)
  const handleNotificationClick = async (notificationId) => {
    try {
      console.log(`🔍 [FRONTEND] Clic sur notification ID: ${notificationId}`);
      
      // Récupérer les détails de la notification
      const response = await notificationsService.getNotification(notificationId);
      console.log(`✅ [FRONTEND] Détails récupérés:`, response);
      
      // Gérer les deux formats de réponse possibles
      const notificationData = response.notification || response;
      console.log(`🔍 [FRONTEND] Données notification:`, notificationData);
      
      setSelectedNotification(notificationData);
      setShowModal(true);
      
      // Marquer comme lue si pas déjà lu
      if (notificationData.status === 'unread') {
        await handleMarkAsRead(notificationId);
      }
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erreur lors de la récupération des détails:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Appel API réel
      await notificationsService.markAsRead(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'read', readAt: new Date() }
          : notif
      ));
      
      // Recharger les stats
      const statsResponse = await notificationsService.getStats();
      setStats({
        unread: statsResponse.unread || 0,
        alerts: (statsResponse.byType?.security || 0) + (statsResponse.byPriority?.urgent || 0),
        info: (statsResponse.byType?.system || 0) + (statsResponse.byType?.success || 0),
        total: statsResponse.total || 0
      });
      
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      
      // Fallback : mise à jour locale seulement
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'read', readAt: new Date() }
          : notif
      ));
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    // Utiliser le modal de suppression au lieu de window.confirm
    setDeleteModal({
      isOpen: true,
      type: 'single',
      title: 'Supprimer la notification',
      message: 'Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.',
      onConfirm: async () => {
        try {
          // Appel API réel
          await notificationsService.deleteNotification(notificationId);
          
          // Supprimer de l'état local
          setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
          
          // Recharger les stats
          const statsResponse = await notificationsService.getStats();
          setStats({
            unread: statsResponse.unread || 0,
            alerts: (statsResponse.byType?.security || 0) + (statsResponse.byPriority?.urgent || 0),
            info: (statsResponse.byType?.system || 0) + (statsResponse.byType?.success || 0),
            total: statsResponse.total || 0
          });
          
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          throw error; // Le modal gèrera l'erreur
        }
      }
    });
  };

  // Gestion de la sélection individuelle
  const handleNotificationSelect = (notificationId, isChecked) => {
    setSelectedNotifications(prev => {
      const newSelected = new Set(prev);
      if (isChecked) {
        newSelected.add(notificationId);
      } else {
        newSelected.delete(notificationId);
      }
      
      // Mettre à jour l'état "Sélectionner tout"
      const filteredNotifications = notifications.filter(notif => 
        !searchTerm || 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectAll(newSelected.size === filteredNotifications.length && filteredNotifications.length > 0);
      
      return newSelected;
    });
  };

  // Gestion de "Sélectionner tout"
  const handleSelectAll = (isChecked) => {
    const filteredNotifications = notifications.filter(notif => 
      !searchTerm || 
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isChecked) {
      setSelectedNotifications(new Set(filteredNotifications.map(notif => notif.id)));
    } else {
      setSelectedNotifications(new Set());
    }
    setSelectAll(isChecked);
  };

  // Ouvrir le modal de suppression en lot
  const handleBulkDelete = () => {
    if (selectedNotifications.size === 0) return;
    setShowDeleteModal(true);
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      // Récupérer toutes les notifications non lues
      const unreadNotifications = notifications.filter(notif => notif.status === 'unread');
      
      if (unreadNotifications.length === 0) {
        return; // Rien à faire
      }

      const unreadIds = unreadNotifications.map(notif => notif.id);
      
      // Marquer comme lues via l'API
      await notificationsService.markMultipleAsRead(unreadIds);
      
      // Recharger les notifications pour mettre à jour l'affichage
      await loadNotifications(pagination.currentPage);
      
      // Fermer le menu
      setShowActionsMenu(false);
      
    } catch (error) {
      console.error('Erreur lors du marquage en lot:', error);
    }
  };

  // Confirmer la suppression en lot
  const confirmBulkDelete = async () => {
    try {
      // Sauvegarder les IDs avant de les réinitialiser
      const idsToDelete = Array.from(selectedNotifications);
      
      // Réinitialiser immédiatement la sélection pour éviter les doubles appels
      setSelectedNotifications(new Set());
      setSelectAll(false);
      
      // Supprimer chaque notification sélectionnée
      const deletePromises = idsToDelete.map(id => 
        notificationsService.deleteNotification(id)
      );
      
      await Promise.all(deletePromises);

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.filter(notif => !idsToDelete.includes(notif.id))
      );

      // Recharger les données pour avoir les stats à jour
      await loadNotifications(pagination.currentPage);
      
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
      throw error; // Le modal gèrera l'erreur
    }
  };

  const formatDate = (date) => {
    // Vérifier si la date est valide
    if (!date || date === null || date === undefined) {
      return "Date inconnue";
    }

    const notifDate = new Date(date);
    
    // Vérifier si la date est valide après conversion
    if (isNaN(notifDate.getTime())) {
      return "Date invalide";
    }

    const now = new Date();
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return notifDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'alert': return <FiAlertCircle className="notification-type-icon alert" />;
      case 'warning': return <FiAlertTriangle className="notification-type-icon warning" />;
      case 'info': return <FiInfo className="notification-type-icon info" />;
      case 'success': return <FiCheckCircle className="notification-type-icon success" />;
      case 'security': return <FiShield className="notification-type-icon security" />;
      case 'system': return <FiServer className="notification-type-icon system" />;
      case 'user_activity': return <FiUser className="notification-type-icon user_activity" />;
      default: return <FiBell className="notification-type-icon" />;
    }
  };

  const formatMetadataValue = (key, value) => {
    const labels = {
      email: 'Email',
      domain: 'Domaine',
      ipAddress: 'Adresse IP',
      userAgent: 'Navigateur',
      action: 'Action',
      timestamp: 'Horodatage',
      type: 'Type d\'événement',
      newUserId: 'ID utilisateur',
      username: 'Nom d\'utilisateur',
      provider: 'Fournisseur',
      registrationDate: 'Date d\'inscription',
      inactiveCount: 'Nombre d\'inactifs',
      inactiveDays: 'Période d\'inactivité',
      inactiveUsers: 'Utilisateurs inactifs'
    };

    const label = labels[key] || key;
    
    if (key === 'timestamp' || key === 'registrationDate') {
      return { label, value: formatDate(value) };
    }
    if (key === 'userAgent') {
      return { label, value: value.length > 100 ? value.substring(0, 100) + '...' : value };
    }
    if (key === 'inactiveUsers' && Array.isArray(value)) {
      const usersList = value.map(user => 
        `• ${user.username} (${user.email}) - Dernière activité: ${formatDate(user.lastActivity)}`
      ).join('\n');
      return { label, value: usersList, isMultiline: true };
    }
    if (key === 'inactiveDays' && value < 1) {
      return { label, value: `${Math.round(value * 24 * 60)} minutes (TEST)` };
    }
    if (typeof value === 'object' && value !== null) {
      return { label, value: JSON.stringify(value, null, 2), isJson: true };
    }
    
    return { label, value: String(value) };
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'system': return <FiServer className="source-icon" />;
      case 'security': return <FiShield className="source-icon" />;
      case 'user_activity': return <FiUser className="source-icon" />;
      case 'file_activity': return <FiActivity className="source-icon" />;
      case 'email': return <FiMail className="source-icon" />;
      case 'maintenance': return <FiSettings className="source-icon" />;
      case 'backup': return <FiHardDrive className="source-icon" />;
      case 'storage': return <FiHardDrive className="source-icon" />;
      case 'error': return <FiAlertCircle className="source-icon" />;
      case 'success': return <FiCheckCircle className="source-icon" />;
      default: return <FiBell className="source-icon" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      case 'low': return 'priority-low';
      default: return 'priority-normal';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des notifications..." />;
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-title">
          <h1>
            <FiBell className="page-icon" />
            Notifications Système
          </h1>
          <p>Surveillez les alertes et notifications du système</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={loadNotifications}
          >
            <FiActivity /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon unread">
            <FiBell />
          </div>
          <div className="metric-content">
            <h3>Non lues</h3>
            <div className="metric-value">{stats.unread}</div>
            <div className="metric-subtitle">Notifications à traiter</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon alerts">
            <FiAlertTriangle />
          </div>
          <div className="metric-content">
            <h3>Alertes</h3>
            <div className="metric-value">{stats.alerts}</div>
            <div className="metric-subtitle">Alertes & avertissements</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon info">
            <FiInfo />
          </div>
          <div className="metric-content">
            <h3>Informations</h3>
            <div className="metric-value">{stats.info}</div>
            <div className="metric-subtitle">Infos & confirmations</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon total">
            <FiActivity />
          </div>
          <div className="metric-content">
            <h3>Total</h3>
            <div className="metric-value">{stats.total}</div>
            <div className="metric-subtitle">Toutes les notifications</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="messages-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <FiBell /> Toutes ({stats.total})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          <FiBell /> Non lues ({stats.unread})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <FiAlertTriangle /> Alertes ({stats.alerts})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <FiInfo /> Informations ({stats.info})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="messages-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher dans les notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-outline">
          <FiFilter /> Filtres
        </button>
      </div>

      {/* Notifications List - Gmail Style */}
      <div className="gmail-messages-container">
        <div className="gmail-messages-header">
          <div className="gmail-toolbar">
            <input 
              type="checkbox" 
              className="gmail-select-all"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            {selectedNotifications.size > 0 ? (
              <button 
                className="gmail-action-btn delete-btn" 
                title={`Supprimer ${selectedNotifications.size} notification(s)`}
                onClick={handleBulkDelete}
              >
                <FiTrash2 /> Supprimer ({selectedNotifications.size})
              </button>
            ) : (
              <div className="actions-menu-container">
                <button 
                  className="gmail-action-btn" 
                  title="Plus d'actions"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                >
                  <FiMoreVertical />
                </button>
                
                {showActionsMenu && (
                  <div className="actions-dropdown">
                    <button 
                      className="dropdown-item"
                      onClick={markAllAsRead}
                    >
                      <FiCheckCircle />
                      Tout marquer comme lu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="gmail-pagination-info">
            {notifications.length > 0 && (
              <span>
                {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur {pagination.totalItems}
              </span>
            )}
          </div>
        </div>

        <div className="gmail-messages-list">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <FiBell className="empty-icon" />
              <h3>Aucune notification</h3>
              <p>
                {activeTab === 'unread' && 'Toutes vos notifications sont lues !'}
                {activeTab === 'alerts' && 'Aucune alerte pour le moment.'}
                {activeTab === 'info' && 'Aucune information pour le moment.'}
                {activeTab === 'all' && 'Aucune notification disponible.'}
              </p>
            </div>
          ) : (
          notifications
            .filter(notif => 
              !searchTerm || 
              notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              notif.message.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(notification => (
              <div 
                key={notification.id} 
                className={`gmail-message-row ${notification.status}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="gmail-message-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedNotifications.has(notification.id)}
                    onChange={(e) => handleNotificationSelect(notification.id, e.target.checked)}
                  />
                </div>
                
                <div className="gmail-message-star" onClick={(e) => e.stopPropagation()}>
                  <button className="star-btn">
                    <FiStar />
                  </button>
                </div>
                
                <div className="gmail-message-sender">
                  {getSourceIcon(notification.type)}
                  Système Hifadhui - {notification.type}
                </div>
                
                <div className="gmail-message-content">
                  <div className="gmail-message-subject-line">
                    <span className="gmail-subject">{notification.title}</span>
                    <span className="gmail-preview">
                      - {notification.message.substring(0, 100)}
                      {notification.message.length > 100 && '...'}
                    </span>
                  </div>
                </div>
                
                <div className="gmail-message-date">
                  {formatDate(notification.createdAt)}
                </div>
                
                <div className="gmail-message-actions" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="gmail-action-btn"
                    onClick={() => handleDeleteNotification(notification.id)}
                    title="Supprimer"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination-container">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </div>
        )}
      </div>

      {/* Modal des détails de notification */}
      {showModal && selectedNotification && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails de la notification</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="notification-detail">
                <div className="notification-detail-header">
                  <div className="notification-type-badge">
                    <span className={`type-label ${selectedNotification.type}`}>
                      {selectedNotification.type}
                    </span>
                  </div>
                  <div className="notification-priority">
                    <span className={`priority-badge ${selectedNotification.priority}`}>
                      {selectedNotification.priority}
                    </span>
                  </div>
                </div>
                
                <h4 className="notification-title">{selectedNotification.title}</h4>
                <p className="notification-message">{selectedNotification.message}</p>
                
                <div className="notification-metadata">
                  <dl className="notification-details">
                    <dt>Date:</dt>
                    <dd>{formatDate(selectedNotification.createdAt)}</dd>
                    
                    <dt>Statut:</dt>
                    <dd>{selectedNotification.status === 'read' ? 'Lu' : 'Non lu'}</dd>
                    
                    {selectedNotification.readAt && (
                      <>
                        <dt>Lu le:</dt>
                        <dd>{formatDate(selectedNotification.readAt)}</dd>
                      </>
                    )}
                    
                    {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && 
                      Object.entries(selectedNotification.metadata).map(([key, value]) => {
                        const { label, value: formattedValue } = formatMetadataValue(key, value);
                        
                        if (key === 'inactiveUsers' && Array.isArray(value)) {
                          return (
                            <React.Fragment key={key}>
                              <dt>{label}:</dt>
                              <dd>
                                <ul className="users-list">
                                  {value.map((user, index) => (
                                    <li key={index}>
                                      {user.username} ({user.email}) - Dernière activité: {formatDate(user.lastActivity)}
                                    </li>
                                  ))}
                                </ul>
                              </dd>
                            </React.Fragment>
                          );
                        }
                        
                        return (
                          <React.Fragment key={key}>
                            <dt>{label}:</dt>
                            <dd>{formattedValue}</dd>
                          </React.Fragment>
                        );
                      })
                    }
                  </dl>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Modal de suppression en lot */}
      <AdminDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        itemCount={selectedNotifications.size}
        itemType="notification"
      />

      {/* Modal de suppression individuelle */}
      <AdminDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        title={deleteModal.title}
        message={deleteModal.message}
        itemCount={1}
        itemType="notification"
      />
    </div>
  );
};

export default NotificationsPage;
