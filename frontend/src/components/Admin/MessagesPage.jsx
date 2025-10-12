import React, { useState, useEffect } from 'react';
import { 
  FiMail, 
  FiSend, 
  FiInbox, 
  FiArchive,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPlus,
  FiEye,
  FiTrash2,
  FiClock,
  FiUser,
  FiAlertCircle,
  FiMessageSquare,
  FiCornerUpLeft,
  FiX,
  FiFileText,
  FiStar,
  FiMoreHorizontal,
  FiPrinter,
  FiPaperclip,
  FiDownload,
  FiChevronDown,
  FiCheckCircle
} from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import AdminDeleteModal from './AdminDeleteModal';
import Pagination from '../Common/Pagination';
import messagesService from '../../services/messagesService';
import EmailComposer from './EmailComposer';
import './AdminDashboard.css';

const MessagesPage = () => {
  const [activeTab, setActiveTabState] = useState('unread');
  
  // Wrapper pour setActiveTab
  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
  };
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [messageDetail, setMessageDetail] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [stats, setStats] = useState({
    unread: 0,
    read: 0,
    received: 0,
    sent: 0,
    total: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [selectedMessages, setSelectedMessages] = useState(new Set());
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
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [lastLoadedTab, setLastLoadedTab] = useState(null);
  
  useEffect(() => {
    // Éviter les appels multiples pour le même onglet
    if (lastLoadedTab === activeTab) {
      return;
    }
    
    setLastLoadedTab(activeTab);
    loadMessages();
  }, [activeTab, lastLoadedTab]);

  // Actualisation automatique toutes les 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Ne pas actualiser si un modal est ouvert ou si on est en train d'envoyer
      if (!showComposer && !showMessageDetail && !isSending) {
        loadMessages(pagination.currentPage);
      }
    }, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [pagination.currentPage, showComposer, showMessageDetail, isSending]);

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

  const loadMessages = async (page = 1) => {
    // Protection contre les appels multiples simultanés
    if (loadingMessages) {
      return;
    }
    
    setLoadingMessages(true);
    setLoading(true);
    setError(null);
    try {
      // Charger les statistiques
      const statsData = await messagesService.getStats();
      setStats(statsData);
      
      // Charger les messages
      const params = {
        tab: activeTab,
        page: page || 1,
        limit: pagination.itemsPerPage || 20,
        search: searchTerm || ''
      };
      
      const data = await messagesService.getMessages(params);
      setMessages(data.messages);
      setPagination(data.pagination);
      
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setError(error.message);
      setMessages([]);
    } finally {
      setLoading(false);
      setLoadingMessages(false);
    }
  };

  // Fonction pour gérer le changement de page
  const handlePageChange = (newPage) => {
    loadMessages(newPage);
  };

  // Gestion de la sélection individuelle
  const handleMessageSelect = (messageId, isChecked) => {
    setSelectedMessages(prev => {
      const newSelected = new Set(prev);
      if (isChecked) {
        newSelected.add(messageId);
      } else {
        newSelected.delete(messageId);
      }
      
      // Mettre à jour l'état "Sélectionner tout"
      const filteredMessages = messages.filter(msg => 
        !searchTerm || 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectAll(newSelected.size === filteredMessages.length && filteredMessages.length > 0);
      
      return newSelected;
    });
  };

  // Gestion de "Sélectionner tout"
  const handleSelectAll = (isChecked) => {
    const filteredMessages = messages.filter(msg => 
      !searchTerm || 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isChecked) {
      setSelectedMessages(new Set(filteredMessages.map(msg => msg.id)));
    } else {
      setSelectedMessages(new Set());
    }
    setSelectAll(isChecked);
  };

  // Ouvrir le modal de suppression en lot
  const handleBulkDelete = () => {
    if (selectedMessages.size === 0) return;
    setShowDeleteModal(true);
  };

  // Confirmer la suppression en lot
  const confirmBulkDelete = async () => {
    try {
      // Sauvegarder les IDs avant de les réinitialiser
      const idsToDelete = Array.from(selectedMessages);
      
      // Réinitialiser immédiatement la sélection pour éviter les doubles appels
      setSelectedMessages(new Set());
      setSelectAll(false);
      
      // Supprimer chaque message sélectionné
      const deletePromises = idsToDelete.map(id => 
        messagesService.deleteMessage(id)
      );
      
      await Promise.all(deletePromises);

      // Mettre à jour l'état local
      setMessages(prev => 
        prev.filter(msg => !idsToDelete.includes(msg.id))
      );

      // Recharger les données pour avoir les stats à jour
      await loadMessages(pagination.currentPage);
      
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
      throw error; // Le modal gèrera l'erreur
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await messagesService.markAsRead(messageId);
      
      // Mettre à jour l'état local
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'read', readAt: new Date() }
          : msg
      ));
      
      // Recharger les stats
      const statsData = await messagesService.getStats();
      setStats(statsData);
      
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleCompose = () => {
    setSelectedMessage(null);
    setShowComposer(true);
  };

  const handleReply = (message) => {
    setSelectedMessage(message);
    setShowComposer(true);
  };

  // Fonction de test pour simuler la réception d'un email (développement uniquement)
  const handleTestReceiveEmail = async () => {
    try {
      const testEmailData = {
        from: 'test.sender@example.com <Test Sender>',
        to: 'mavuna@hifadhui.site',
        subject: `Test Email Reçu - ${new Date().toLocaleString()}`,
        text: 'Ceci est un email de test pour vérifier que la réception fonctionne correctement dans l\'interface admin.',
        html: '<p>Ceci est un <strong>email de test</strong> pour vérifier que la réception fonctionne correctement dans l\'interface admin.</p><p>Timestamp: ' + new Date().toISOString() + '</p>'
      };

      const response = await fetch('/api/v1/webhooks/test/receive-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEmailData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Recharger les messages pour voir le nouveau message reçu
        await loadMessages();
        
        // Basculer vers l'onglet "Reçus" pour voir le message
        setActiveTab('received');
        
        alert(`✅ Email de test reçu avec succès!\nID: ${result.messageId}\nSujet: ${result.data.subject}`);
      } else {
        alert(`❌ Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors du test de réception:', error);
      alert(`❌ Erreur lors du test: ${error.message}`);
    }
  };

  // Fonction appelée après envoi d'un message
  const handleMessageSent = async () => {
    try {
      setIsSending(true);
      
      // Attendre un court délai pour s'assurer que le message est bien créé côté serveur
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recharger seulement les stats et la page courante
      const statsData = await messagesService.getStats();
      setStats(statsData);
      
      // Basculer vers l'onglet "Envoyés" pour voir le message envoyé
      setActiveTab('sent');
      
    } catch (error) {
      console.error('Erreur lors du rechargement après envoi:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Marquer tous les messages comme lus
  const markAllAsRead = async () => {
    try {
      // Récupérer tous les messages non lus
      const unreadMessages = messages.filter(msg => msg.status === 'unread');
      
      if (unreadMessages.length === 0) {
        return; // Rien à faire
      }

      const unreadIds = unreadMessages.map(msg => msg.id);
      
      // Marquer comme lus via l'API
      await messagesService.markMultipleAsRead(unreadIds);
      
      // Recharger les messages pour mettre à jour l'affichage
      await loadMessages(pagination.currentPage);
      
      // Fermer le menu
      setShowActionsMenu(false);
      
    } catch (error) {
      console.error('Erreur lors du marquage en lot:', error);
    }
  };

  const handleDelete = async (messageId) => {
    // Utiliser le modal de suppression au lieu de window.confirm
    setDeleteModal({
      isOpen: true,
      type: 'single',
      title: 'Supprimer le message',
      message: 'Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.',
      onConfirm: async () => {
        try {
          await messagesService.deleteMessage(messageId);
          
          // Supprimer de l'état local
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          
          // Recharger les stats
          const statsData = await messagesService.getStats();
          setStats(statsData);
          
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          throw error; // Le modal gèrera l'erreur
        }
      }
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadMessages(1);
  };


  const handleViewMessage = async (message) => {
    try {
      setMessageDetail(null);
      setShowMessageDetail(true);
      
      // Si le message n'est pas lu, le marquer comme lu
      if (message.status === 'unread') {
        await handleMarkAsRead(message.id);
      }
      
      // Récupérer les détails complets du message
      const fullMessage = await messagesService.getMessage(message.id);
      setMessageDetail(fullMessage);
      
    } catch (error) {
      console.error('Erreur lors de l\'affichage du message:', error);
      setError(error.message);
      setShowMessageDetail(false);
    }
  };

  const handleCloseMessageDetail = () => {
    setShowMessageDetail(false);
    setMessageDetail(null);
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatGmailDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    // Si c'est aujourd'hui, afficher l'heure
    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Si c'est cette année, afficher jour/mois
    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
    // Sinon afficher jour/mois/année
    return messageDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getMessageIcon = (message) => {
    switch (message.type) {
      case 'contact_received':
      case 'email_received': return <FiMail className="message-type-icon contact" />;
      case 'email_sent': return <FiSend className="message-type-icon sent" />;
      case 'notification': return <FiAlertCircle className="message-type-icon notification" />;
      case 'alert': return <FiAlertCircle className="message-type-icon alert" />;
      default: return <FiMail className="message-type-icon" />;
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
    return <LoadingSpinner message="Chargement des messages..." />;
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-title">
          <h1>
            <FiMail className="page-icon" />
            Messages
          </h1>
          <p>Gérez vos emails et communications</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={handleCompose}
          >
            <FiPlus /> Nouveau message
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <button 
              className="btn btn-secondary"
              onClick={handleTestReceiveEmail}
              style={{ marginLeft: '10px' }}
              title="Simuler la réception d'un email"
            >
              <FiInbox /> Test Réception
            </button>
          )}
          <button 
            className="btn btn-secondary"
            onClick={loadMessages}
          >
            <FiRefreshCw /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon unread">
            <FiMail />
          </div>
          <div className="metric-content">
            <h3>Non lus</h3>
            <div className="metric-value">{stats.unread}</div>
            <div className="metric-subtitle">Messages à traiter</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon read">
            <FiMessageSquare />
          </div>
          <div className="metric-content">
            <h3>Lus</h3>
            <div className="metric-value">{stats.read}</div>
            <div className="metric-subtitle">Messages traités</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon received">
            <FiInbox />
          </div>
          <div className="metric-content">
            <h3>Reçus</h3>
            <div className="metric-value">{stats.received || 0}</div>
            <div className="metric-subtitle">Messages reçus</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon sent">
            <FiSend />
          </div>
          <div className="metric-content">
            <h3>Envoyés</h3>
            <div className="metric-value">{stats.sent}</div>
            <div className="metric-subtitle">Emails expédiés</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon total">
            <FiInbox />
          </div>
          <div className="metric-content">
            <h3>Total</h3>
            <div className="metric-value">{stats.total}</div>
            <div className="metric-subtitle">Tous les messages</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="messages-tabs">
        <button 
          className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          <FiMail /> Non lus ({stats.unread})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}
        >
          <FiMessageSquare /> Lus ({stats.read})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          <FiInbox /> Reçus ({stats.received || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <FiSend /> Envoyés ({stats.sent})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="messages-toolbar">
        <form onSubmit={handleSearch} className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher dans les messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        <button className="btn btn-outline">
          <FiFilter /> Filtres
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Messages List - Gmail Style */}
      <div className="gmail-messages-container">
        <div className="gmail-messages-header">
          <div className="gmail-toolbar">
            <input 
              type="checkbox" 
              className="gmail-select-all"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            {selectedMessages.size > 0 ? (
              <button 
                className="gmail-action-btn delete-btn" 
                title={`Supprimer ${selectedMessages.size} message(s)`}
                onClick={handleBulkDelete}
              >
                <FiTrash2 /> Supprimer ({selectedMessages.size})
              </button>
            ) : (
              <div className="actions-menu-container">
                <button 
                  className="gmail-action-btn" 
                  title="Plus d'actions"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                >
                  <FiMoreHorizontal />
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
            {pagination.totalItems > 0 && (
              <span>
                {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur {pagination.totalItems}
              </span>
            )}
          </div>
        </div>

        <div className="gmail-messages-list">
          {messages.length === 0 ? (
            <div className="gmail-empty-state">
              <FiInbox className="empty-icon" />
              <h3>Aucun message</h3>
              <p>
                {activeTab === 'unread' && 'Tous vos messages sont lus !'}
                {activeTab === 'read' && 'Aucun message lu pour le moment.'}
                {activeTab === 'received' && 'Aucun message reçu pour le moment.'}
                {activeTab === 'sent' && 'Aucun email envoyé pour le moment.'}
              </p>
            </div>
          ) : (
            (() => {
              const filteredMessages = messages.filter(msg => 
                !searchTerm || 
                msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (msg.senderEmail && msg.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()))
              );
              
              // Vérifier s'il y a des doublons dans l'état React
              const messageIds = filteredMessages.map(msg => msg.id);
              const uniqueIds = [...new Set(messageIds)];
              if (messageIds.length !== uniqueIds.length) {
                console.warn('Doublons détectés dans l\'état React!');
              }
              
              return filteredMessages.map(message => (
                <div 
                  key={message.id} 
                  className={`gmail-message-row ${message.status}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="gmail-message-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedMessages.has(message.id)}
                      onChange={(e) => handleMessageSelect(message.id, e.target.checked)}
                    />
                  </div>
                  
                  <div className="gmail-message-star" onClick={(e) => e.stopPropagation()}>
                    <button className="star-btn">
                      <FiStar />
                    </button>
                  </div>
                  
                  <div className="gmail-message-sender">
                    {(message.type === 'contact_received' || message.type === 'email_received') && message.senderName}
                    {message.type === 'email_sent' && `À: ${message.recipientEmail?.split('@')[0]}`}
                    {(message.type === 'notification' || message.type === 'alert') && 'Système Hifadhui'}
                  </div>
                  
                  <div className="gmail-message-content">
                    <div className="gmail-message-subject-line">
                      <span className="gmail-subject">{message.subject}</span>
                      <span className="gmail-preview">
                        - {message.content.substring(0, 100)}
                        {message.content.length > 100 && '...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="gmail-message-date">
                    {formatGmailDate(message.createdAt)}
                  </div>
                  
                  <div className="gmail-message-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="gmail-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMessage(message);
                      }}
                      title="Ouvrir"
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="gmail-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(message.id);
                      }}
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  
                  {message.status === 'unread' && (
                    <div className="gmail-unread-indicator"></div>
                  )}
                </div>
              ));
            })()
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Page {pagination.currentPage} sur {pagination.totalPages} 
            ({pagination.totalItems} messages au total)
          </div>
          <div className="pagination-controls">
            <button 
              className="btn btn-outline"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Précédent
            </button>
            
            {/* Pages numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`btn ${pageNum === pagination.currentPage ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className="btn btn-outline"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Gmail Style Message Detail Modal */}
      {showMessageDetail && (
        <div className="modal-overlay" onClick={handleCloseMessageDetail}>
          <div className="gmail-message-modal" onClick={e => e.stopPropagation()}>
            {!messageDetail ? (
              <div className="gmail-modal-loading">
                <LoadingSpinner message="Chargement du message..." />
              </div>
            ) : (
              <>
                {/* Gmail Header */}
                <div className="gmail-modal-header">
                  <div className="gmail-modal-subject">
                    <h1>{messageDetail.subject}</h1>
                    <div className="gmail-modal-labels">
                      <span className={`gmail-label ${messageDetail.type}`}>
                        {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && 'Email reçu'}
                        {messageDetail.type === 'email_sent' && 'Envoyé'}
                        {messageDetail.type === 'notification' && 'Notification'}
                        {messageDetail.type === 'alert' && 'Alerte'}
                      </span>
                    </div>
                  </div>
                  <div className="gmail-modal-actions">
                    <button className="gmail-header-btn" title="Imprimer">
                      <FiPrinter />
                    </button>
                    <button className="gmail-header-btn" title="Plus d'actions">
                      <FiMoreHorizontal />
                    </button>
                    <button 
                      className="gmail-header-btn gmail-close-btn"
                      onClick={handleCloseMessageDetail}
                      title="Fermer"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                {/* Gmail Message Content */}
                <div className="gmail-modal-content">
                  <div className="gmail-message-header-info">
                    <div className="gmail-sender-info">
                      <div className="gmail-sender-avatar">
                        {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && messageDetail.senderName?.charAt(0)?.toUpperCase()}
                        {messageDetail.type === 'email_sent' && 'H'}
                        {(messageDetail.type === 'notification' || messageDetail.type === 'alert') && 'S'}
                      </div>
                      <div className="gmail-sender-details">
                        <div className="gmail-sender-name-line">
                          <span className="gmail-sender-name">
                            {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && (
                              <>
                                {messageDetail.senderName} <span className="gmail-sender-email">&lt;{messageDetail.senderEmail}&gt;</span>
                              </>
                            )}
                            {messageDetail.type === 'email_sent' && (
                              <>
                                Hifadhui <span className="gmail-sender-email">&lt;mavuna@hifadhui.site&gt;</span>
                              </>
                            )}
                            {(messageDetail.type === 'notification' || messageDetail.type === 'alert') && 'Système Hifadhui'}
                          </span>
                        </div>
                        <div className="gmail-sender-name-line">
                          <div className="gmail-recipient-info">
                            <span className="gmail-to-me">
                              {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && 'À moi'}
                              {messageDetail.type === 'email_sent' && `À ${messageDetail.recipientEmail?.split('@')[0]}`}
                              {(messageDetail.type === 'notification' || messageDetail.type === 'alert') && 'À moi'}
                            </span>
                            <button 
                              className="gmail-dropdown-arrow"
                              onClick={() => setShowTooltip(!showTooltip)}
                              onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
                            >
                              <FiChevronDown />
                            </button>
                            {showTooltip && (
                              <div className="gmail-tooltip">
                                <div className="gmail-tooltip-header">
                                  <strong>De:</strong> 
                                  {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && ` ${messageDetail.senderName} <${messageDetail.senderEmail}>`}
                                  {messageDetail.type === 'email_sent' && ' Hifadhui <mavuna@hifadhui.site>'}
                                  {(messageDetail.type === 'notification' || messageDetail.type === 'alert') && ' Système Hifadhui <système@hifadhui.site>'}
                                </div>
                                <div className="gmail-tooltip-row">
                                  <strong>répondre à:</strong> 
                                  {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && ` ${messageDetail.senderEmail}`}
                                  {messageDetail.type === 'email_sent' && ' mavuna@hifadhui.site'}
                                  {(messageDetail.type === 'notification' || messageDetail.type === 'alert') && ' système@hifadhui.site'}
                                </div>
                                <div className="gmail-tooltip-row">
                                  <strong>à:</strong> mavuna@hifadhui.site
                                </div>
                                <div className="gmail-tooltip-row">
                                  <strong>Date:</strong> {new Date(messageDetail.createdAt).toLocaleString('fr-FR')}
                                </div>
                                <div className="gmail-tooltip-row">
                                  <strong>Objet:</strong> {messageDetail.subject}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="gmail-message-meta">
                      <div className="gmail-message-date">
                        {new Date(messageDetail.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="gmail-message-actions-dropdown">
                        <button className="gmail-dropdown-btn">
                          <FiMoreHorizontal />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="gmail-message-body">
                    {messageDetail.htmlContent ? (
                      <div 
                        className="gmail-html-content"
                        dangerouslySetInnerHTML={{ __html: messageDetail.htmlContent }}
                      />
                    ) : (
                      <div className="gmail-text-content">
                        {messageDetail.content}
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  {messageDetail.attachments && messageDetail.attachments.length > 0 && (
                    <div className="gmail-attachments">
                      <div className="gmail-attachments-header">
                        <FiPaperclip />
                        <span>{messageDetail.attachments.length} pièce(s) jointe(s)</span>
                      </div>
                      <div className="gmail-attachments-list">
                        {messageDetail.attachments.map(attachment => (
                          <div key={attachment.id} className="gmail-attachment-item">
                            <FiFileText className="attachment-icon" />
                            <div className="attachment-info">
                              <span className="attachment-name">{attachment.filename}</span>
                              <span className="attachment-size">{attachment.size} bytes</span>
                            </div>
                            <button className="attachment-download">
                              <FiDownload />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Gmail Reply Actions */}
                <div className="gmail-modal-footer">
                  {(messageDetail.type === 'contact_received' || messageDetail.type === 'email_received') && (
                    <button 
                      className="gmail-reply-btn gmail-reply-primary"
                      onClick={() => {
                        handleCloseMessageDetail();
                        handleReply(messageDetail);
                      }}
                    >
                      <FiCornerUpLeft />
                      Répondre
                    </button>
                  )}
                  <button 
                    className="gmail-reply-btn gmail-reply-secondary"
                    onClick={async () => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                        await handleDelete(messageDetail.id);
                        handleCloseMessageDetail();
                      }
                    }}
                  >
                    <FiTrash2 />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
      {/* Modal de suppression en lot */}
      <AdminDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        itemCount={selectedMessages.size}
        itemType="message"
      />

      {/* Modal de suppression individuelle */}
      <AdminDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        title={deleteModal.title}
        message={deleteModal.message}
        itemCount={1}
        itemType="message"
      />

      {/* Email Composer */}
      <EmailComposer
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        replyTo={selectedMessage}
        onSent={handleMessageSent} // Utiliser la fonction spécialisée
      />
    </div>
  );
};

export default MessagesPage;
