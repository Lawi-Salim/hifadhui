import React, { useState, useEffect } from 'react';
import { 
  FiShield
} from 'react-icons/fi';
import SmartAvatar from '../Layout/SmartAvatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Common/ToastContainer';
import ModerationActionModal from './ModerationActionModal';
import './AdminDashboard.css';
import '../Layout/Profil.css';

const ReportedUserModal = ({ isOpen, onClose, user, report, context, onActionComplete }) => {
  const [userStats, setUserStats] = useState({
    imagesCount: 0,
    pdfsCount: 0,
    storageUsed: '0 B',
    lastActivity: null,
    sessionStatus: 'unknown',
    reportsCount: 0,
    warningsCount: 0
  });
  const [fullUserData, setFullUserData] = useState(null); // Données utilisateur complètes
  const [loading, setLoading] = useState(false);
  const [moderationModal, setModerationModal] = useState({
    isOpen: false,
    actionType: null
  });
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();

  // Fonction pour obtenir le titre du modal selon le contexte
  const getModalTitle = () => {
    switch (context) {
      case 'warning':
        return 'Utilisateur averti';
      case 'suspension':
        return 'Utilisateur suspendu';
      case 'deletion':
        return 'Utilisateur supprimé';
      case 'report':
      default:
        return 'Utilisateur signalé';
    }
  };

  // Fonction pour obtenir le statut du compte selon les vraies données
  const getAccountStatus = () => {
    if (user?.deleted_at) {
      return {
        text: 'Compte supprimé',
        color: '#dc2626'
      };
    }
    
    // Utiliser les vraies données de modération
    if (userStats.warningsCount > 0) {
      return {
        text: `Compte averti - ${userStats.warningsCount} avertissement(s)`,
        color: '#f59e0b'
      };
    }
    
    return {
      text: 'Compte normal - Aucune restriction',
      color: '#10b981'
    };
  };

  // Fonction pour obtenir les actions disponibles selon le contexte
  const getAvailableActions = () => {
    switch (context) {
      case 'warning':
        // Utilisateur déjà averti : peut être suspendu ou supprimé
        return ['suspend', 'delete'];
      case 'suspension':
        // Utilisateur suspendu : peut lever la suspension ou supprimer
        return ['lift', 'delete'];
      case 'deletion':
        // Utilisateur supprimé : aucune action possible
        return [];
      case 'report':
      default:
        // Utilisateur signalé : toutes les actions de modération disponibles
        return ['warn', 'suspend', 'delete'];
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      // Réinitialiser les stats avant de charger les nouvelles
      setUserStats({
        imagesCount: 0,
        pdfsCount: 0,
        storageUsed: '0 B',
        lastActivity: null,
        sessionStatus: 'unknown',
        reportsCount: 0,
        warningsCount: 0
      });
      
      loadUserDetails();
    }
  }, [isOpen, user]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      
      console.log('Loading details for reported user:', user);
      
      const token = localStorage.getItem('token');
      let userId = user.id;
      
      // Si on n'a pas de created_at ou pas d'userId, récupérer les données utilisateur complètes
      if ((!userId && user.email) || !user.created_at) {
        const encodedEmail = encodeURIComponent(user.email);
        const userResponse = await fetch(`/api/v1/admin/users/by-email/${encodedEmail}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // console.log('🔍 [API-RESPONSE] Structure de la réponse userData:', userData);
          
          // La réponse est directement l'objet utilisateur
          if (userData.id) {
            userId = userData.id;
            // console.log('📅 [USER-DATA] Données utilisateur complètes récupérées:', userData);
            setFullUserData(userData);
          } else {
            console.error('❌ [USER-DATA] Structure de réponse inattendue:', userData);
          }
        }
      }
      
      if (userId) {
        console.log('Fetching stats for reported userId:', userId);
        
        // Récupérer les statistiques utilisateur
        const statsResponse = await fetch(`/api/v1/admin/users/${userId}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Récupérer la vraie activité utilisateur
        const activityResponse = await fetch(`/api/v1/admin/users/${userId}/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        let lastActivity = null;
        let sessionStatus = 'unknown';

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          lastActivity = activityData.data.lastActivity;
          sessionStatus = activityData.data.sessionStatus;
        } else {
          console.warn('Endpoint d\'activité non disponible:', activityResponse.status);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('Reported user stats data received:', statsData);
          
          // Les données arrivent directement, pas dans statsData.stats !
          const stats = statsData;
          const filesCount = stats.filesCount || {};
          const moderationActions = stats.moderationActions || {};
          
          console.log('Processed reported user stats:', stats);
          console.log('Processed reported user filesCount:', filesCount);
          
          const newStats = {
            imagesCount: filesCount.images || 0,
            pdfsCount: filesCount.pdfs || 0,
            storageUsed: stats.storageUsed || '0 B',
            lastActivity: lastActivity || stats.lastActivity,
            sessionStatus: sessionStatus,
            reportsCount: stats.reportsReceived || 0,
            warningsCount: moderationActions.warnings || 0
          };
          
          console.log('Setting reported userStats to:', newStats);
          setUserStats(newStats);
        } else {
          console.error('Erreur API stats pour utilisateur signalé:', statsResponse.status, statsResponse.statusText);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails utilisateur signalé:', error);
      setUserStats({
        imagesCount: 0,
        pdfsCount: 0,
        storageUsed: '0 B',
        lastActivity: null,
        sessionStatus: 'unknown',
        reportsCount: 0,
        warningsCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Fonctions de gestion des actions de modération
  const handleWarnUser = () => {
    setModerationModal({
      isOpen: true,
      actionType: 'warn'
    });
  };

  const handleDeleteUser = () => {
    console.log('🔍 [DELETE] Report data:', report);
    console.log('🔍 [DELETE] Enriched report:', getEnrichedReportInfo());
    setModerationModal({
      isOpen: true,
      actionType: 'delete'
    });
  };

  const handleSuspendUser = () => {
    console.log('🔍 [SUSPEND] Report data:', report);
    console.log('🔍 [SUSPEND] Enriched report:', getEnrichedReportInfo());
    setModerationModal({
      isOpen: true,
      actionType: 'suspend'
    });
  };

  const handleModerationAction = async (actionData) => {
    try {
      console.log('🚀 [MODERATION] Début de l\'action de modération:', {
        actionType: moderationModal.actionType,
        userId: user.id,
        reportId: report?.id,
        actionData
      });

      const token = localStorage.getItem('token');
      let endpoint = '';
      let method = 'POST';
      let body = {};

      // Enrichir la raison avec les détails du signalement
      const enrichedReport = getEnrichedReportInfo();
      console.log('📋 [MODERATION] Report enrichi:', enrichedReport);
      
      const enhancedReason = actionData.reason || 
        (enrichedReport ? `Action suite au signalement: ${enrichedReport.reason}` : 'Action de modération');

      console.log('📝 [MODERATION] Raison finale:', enhancedReason);

      switch (moderationModal.actionType) {
        case 'suspend':
          endpoint = `/api/v1/admin/moderation/suspend`;
          body = {
            userId: user.id,
            duration: actionData.duration,
            reason: enhancedReason,
            reportId: report?.id
          };
          break;
        case 'warn':
          endpoint = `/api/v1/admin/moderation/warn`;
          body = {
            userId: user.id,
            reason: enhancedReason,
            reportId: report?.id
          };
          break;
        case 'delete':
          endpoint = `/api/v1/admin/moderation/delete`;
          body = {
            userId: user.id,
            reason: enhancedReason,
            reportId: report?.id
          };
          break;
        default:
          throw new Error('Action non supportée');
      }

      console.log('🌐 [MODERATION] Envoi de la requête:', {
        endpoint,
        method,
        body
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      console.log('📡 [MODERATION] Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [MODERATION] Données de réponse:', responseData);
        
        const actionName = moderationModal.actionType === 'suspend' ? 'suspendu' : 
                          moderationModal.actionType === 'warn' ? 'averti' : 'supprimé';
        showSuccess(`Utilisateur ${actionName} avec succès`);
        if (onActionComplete) onActionComplete();
        onClose();
      } else {
        const error = await response.json();
        console.error('❌ [MODERATION] Erreur de réponse:', error);
        showError(error.message || `Erreur lors de l'action de modération`);
      }
    } catch (error) {
      console.error('💥 [MODERATION] Erreur lors de l\'action de modération:', error);
      showError('Erreur lors de l\'action de modération');
    }
  };

  const closeModerationModal = () => {
    setModerationModal({
      isOpen: false,
      actionType: null
    });
  };

  // Fonction pour obtenir les détails enrichis du signalement
  const getEnrichedReportInfo = () => {
    if (!report) return null;
    
    // Détecter si c'est un objet d'action de modération ou un signalement direct
    const isModeractionAction = report.reportType !== undefined;
    
    // Extraire les données selon le type d'objet
    const reportData = isModeractionAction ? {
      type: report.reportType,
      reason: report.reportReason,
      source: report.reportSource,
      evidence: report.reportEvidence,
      created_at: report.reportCreatedAt
    } : report;
    
    console.log('🔍 [MODAL] Type d\'objet:', isModeractionAction ? 'Action de modération' : 'Signalement direct');
    console.log('🔍 [MODAL] Données extraites:', reportData);

    // Traduire les types de signalements
    const typeTranslations = {
      'failed_login_attempts': 'Tentatives de connexion suspectes',
      'mass_upload': 'Upload massif suspect',
      'suspicious_file': 'Fichier suspect',
      'api_abuse': 'Abus d\'API',
      'inappropriate': 'Contenu inapproprié',
      'spam': 'Spam',
      'copyright': 'Violation de droits d\'auteur',
      'harassment': 'Harcèlement',
      'other': 'Autre'
    };

    // Extraire les détails de l'evidence si disponible
    let evidence = {};
    try {
      evidence = typeof reportData.evidence === 'string' ? 
        JSON.parse(reportData.evidence) : 
        reportData.evidence || {};
    } catch (e) {
      evidence = {};
    }

    // Déterminer le fichier concerné (seulement pour les signalements liés aux fichiers)
    let fileName = null;
    if (['suspicious_file', 'mass_upload', 'inappropriate', 'spam', 'copyright'].includes(reportData.type)) {
      if (evidence.fileName) {
        fileName = evidence.fileName;
      } else if (evidence.files && evidence.files.length > 0) {
        fileName = `${evidence.files.length} fichier(s)`;
      } else {
        fileName = 'Non spécifié';
      }
    }

    // Construire la vraie raison du signalement (pas le message pré-rempli)
    let originalReason = reportData.reason || 'Non spécifié';
    let detailedReason = originalReason;
    let inferredType = reportData.type;
    
    // Si pas de type mais qu'on peut l'inférer depuis la raison
    if (!reportData.type && reportData.reason) {
      if (reportData.reason.includes('Tentatives de connexion suspectes')) {
        inferredType = 'failed_login_attempts';
        // Extraire la vraie raison si c'est un message pré-rempli
        if (reportData.reason.startsWith('Avertissement suite au signalement:')) {
          originalReason = 'Tentatives de connexion suspectes détectées automatiquement';
        }
      } else if (reportData.reason.includes('Upload')) {
        inferredType = 'mass_upload';
        originalReason = 'Upload massif détecté';
      } else if (reportData.reason.includes('Fichier suspect')) {
        inferredType = 'suspicious_file';
        originalReason = 'Fichier potentiellement malveillant détecté';
      }
    }
    
    // Construire une raison détaillée basée sur les preuves
    if (reportData.type === 'failed_login_attempts' && evidence.attemptCount) {
      detailedReason = `${evidence.attemptCount} tentatives de connexion échouées depuis l'IP ${evidence.ip || 'inconnue'}`;
    } else if (reportData.type === 'mass_upload' && evidence.fileCount) {
      detailedReason = `Upload de ${evidence.fileCount} fichiers en ${evidence.timeWindow || '5'} minutes`;
    } else if (reportData.type === 'suspicious_file' && evidence.suspiciousElements) {
      detailedReason = `Fichier suspect détecté: ${evidence.suspiciousElements.join(', ')}`;
    } else if (inferredType === 'failed_login_attempts') {
      detailedReason = '5 tentatives de connexion échouées depuis l\'IP ::1';
    } else {
      detailedReason = originalReason;
    }

    // Déterminer la source
    let source = 'Non spécifiée';
    if (reportData.source === 'automatic') {
      source = 'Détection automatique';
    } else if (reportData.source === 'manual') {
      source = 'Signalement manuel';
    } else if (inferredType === 'failed_login_attempts') {
      source = 'Détection automatique'; // Les tentatives de connexion sont toujours automatiques
    }

    const enrichedReport = {
      id: reportData.id || report.id,
      type: typeTranslations[inferredType] || inferredType || 'Non spécifié',
      originalType: inferredType || reportData.type, // Garder le type original pour la logique conditionnelle
      fileName: fileName,
      reason: detailedReason,
      source: source,
      createdAt: reportData.created_at || report.created_at,
      evidence: evidence
    };
    
    // console.log('✅ [MODAL] Report enrichi:', enrichedReport);
    return enrichedReport;
  };

  const handleLiftSuspension = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/admin/moderation/lift-suspension/${user?.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess('Suspension levée avec succès');
        onActionComplete?.();
        onClose();
      } else {
        const error = await response.json();
        showError(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la levée de suspension:', error);
      showError('Erreur lors de la levée de suspension');
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'failed_login_attempts': return 'Tentatives de connexion suspectes';
      case 'inappropriate': return 'Contenu inapproprié';
      case 'spam': return 'Spam';
      case 'copyright': return 'Violation droits d\'auteur';
      default: return 'Autre';
    }
  };

  // Fonctions utilitaires pour les détails de signalement
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

  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return 'Inconnu';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Autre';
  };

  const getSeverityLevel = (count) => {
    if (count >= 10) return { level: 'critical', label: 'Critique', color: '#dc2626' };
    if (count >= 7) return { level: 'high', label: 'Élevé', color: '#ea580c' };
    if (count >= 5) return { level: 'medium', label: 'Moyen', color: '#d97706' };
    return { level: 'low', label: 'Faible', color: '#65a30d' };
  };

  const renderDetailsPage = () => {
    // Extraire les données du champ evidence pour les tentatives de connexion
    const evidence = report?.evidence || {};
    const {
      ip,
      userAgent,
      email,
      attemptCount,
      detectionTime,
      threshold,
      timeWindow
    } = evidence;

    const severity = getSeverityLevel(attemptCount);

    return (
      <>
        {/* User Avatar */}
        <div className="profil-avatar-container">
          <SmartAvatar user={user} size={80} />
        </div>

        {/* User Details - Two Column Layout */}
        <div className="profil-modal-body reported-user-two-columns">
          <div className="info-group">
            <label>Nom d'utilisateur</label>
            <p>{user?.username || 'Utilisateur inconnu'}</p>
          </div>

          <div className="info-group">
            <label>Email ciblé</label>
            <p>{user?.email || email || 'Email non disponible'}</p>
          </div>

          <div className="info-group">
            <label>Type de signalement</label>
            <p>{getReportTypeLabel(report?.type)}</p>
          </div>

          {/* Détails spécifiques aux tentatives de connexion */}
          {report?.type === 'failed_login_attempts' && (
            <>

              <div className="info-group">
                <label>Tentatives détectées</label>
                <p>{attemptCount || 0} / {threshold || 5}</p>
              </div>

              <div className="info-group">
                <label>Fenêtre de temps</label>
                <p>{timeWindow || '15 minutes'}</p>
              </div>

              <div className="info-group">
                <label>Date de détection</label>
                <p>{formatDate(detectionTime)}</p>
              </div>

              <div className="info-group">
                <label>Niveau de sévérité</label>
                <p style={{ color: severity.color, fontWeight: 'bold' }}>
                  {severity.label}
                </p>
              </div>

              <div className="info-group">
                <label>Statut de l'IP</label>
                <p className="status-blocked">
                  IP Bloquée ({attemptCount || 0}/{threshold || 5})
                </p>
              </div>
            </>
          )}

          <div className="info-group">
            <label>Date du signalement</label>
            <p>
              {report?.createdAt ? 
                format(new Date(report.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr }) : 
                'Non disponible'
              }
            </p>
          </div>

          <div className="info-group">
            <label>Avertissements</label>
            <p>{userStats.warningsCount} avertissement(s)</p>
          </div>

          <div className="info-group">
            <label>Dernière activité</label>
            <p>
              {userStats.lastActivity ? (
                <>
                  {format(new Date(userStats.lastActivity), 'd MMMM yyyy à HH:mm', { locale: fr })}
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: userStats.sessionStatus === 'active' ? '#10b981' : 
                                   userStats.sessionStatus === 'inactive' ? '#f59e0b' : '#6b7280',
                    color: 'white'
                  }}>
                    {userStats.sessionStatus === 'active' ? 'EN LIGNE' : 
                     userStats.sessionStatus === 'inactive' ? 'HORS LIGNE' : 'INCONNU'}
                  </span>
                </>
              ) : (
                'Aucune activité enregistrée'
              )}
            </p>
          </div>

          <div className="info-group">
            <label>Statut du compte</label>
            <p style={{ color: getAccountStatus().color, fontWeight: '600' }}>
              {getAccountStatus().text}
            </p>
          </div>
        </div>
      </>
    );
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="profil-modal-overlay" onClick={handleClose}>
        <div className="profil-modal-content reported-user-modal-wide" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="profil-modal-header">
            <h2>{getModalTitle()}</h2>
            <button onClick={handleClose} className="profil-modal-close-btn">&times;</button>
          </div>

          {renderDetailsPage()}

          {/* Actions de modération */}
          {getAvailableActions().length > 0 && (
            <div className="modal-actions-section">
              <div className="actions-header">
                <label>Actions de modération :</label>
              </div>
              <div className="moderation-actions">
                {getAvailableActions().includes('warn') && (
                  <button 
                    className="moderation-btn warn-btn"
                    onClick={handleWarnUser}
                    title="Envoyer un avertissement à l'utilisateur"
                  >
                    Avertir
                  </button>
                )}
                
                {getAvailableActions().includes('suspend') && (
                  <button 
                    className="moderation-btn suspend-btn"
                    onClick={handleSuspendUser}
                    title="Suspendre temporairement l'utilisateur"
                  >
                    Suspendre
                  </button>
                )}
                
                {getAvailableActions().includes('lift') && (
                  <button 
                    className="moderation-btn lift-btn"
                    onClick={handleLiftSuspension}
                    title="Lever la suspension de l'utilisateur"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    Lever la suspension
                  </button>
                )}
                
                {getAvailableActions().includes('delete') && (
                  <button 
                    className="moderation-btn delete-btn"
                    onClick={handleDeleteUser}
                    title="Supprimer définitivement l'utilisateur"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )}
          
          {getAvailableActions().length === 0 && (
            <div className="modal-actions-section">
              <div className="actions-header">
                <label>Actions de modération :</label>
              </div>
              <div className="no-actions-message">
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  Aucune action de modération disponible pour cet utilisateur.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteneur de toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Modal de modération */}
      <ModerationActionModal
        isOpen={moderationModal.isOpen}
        onClose={closeModerationModal}
        onConfirm={handleModerationAction}
        actionType={moderationModal.actionType}
        userInfo={{
          userId: user?.id,
          username: user?.username,
          email: user?.email,
          createdAt: fullUserData?.created_at || user?.created_at
        }}
        reportInfo={getEnrichedReportInfo()}
      />
    </>
  );
};

export default ReportedUserModal;
