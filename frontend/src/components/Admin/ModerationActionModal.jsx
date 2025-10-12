import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiAlertTriangle, 
  FiMail, 
  FiPause, 
  FiTrash2,
  FiUser,
  FiClock
} from 'react-icons/fi';
import './AdminDashboard.css';

const ModerationActionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  actionType, 
  userInfo,
  reportInfo 
}) => {
  // Générer un message personnalisé selon l'action et le signalement
  const getDefaultReason = () => {
    if (!reportInfo) return '';
    
    const username = userInfo?.username || 'Utilisateur';
    
    switch (actionType) {
      case 'warn':
        if (reportInfo.originalType === 'failed_login_attempts') {
          return `Bonjour ${username},

Nous avons détecté des tentatives de connexion suspectes sur votre compte. Par mesure de sécurité, nous vous recommandons de :

• Vérifier que personne d'autre n'essaie d'accéder à votre compte
• Changer votre mot de passe si nécessaire
• Activer l'authentification à deux facteurs

Si ces tentatives ne viennent pas de vous, contactez-nous immédiatement.

Cordialement,
L'équipe Hifadhui`;
        } else {
          return `Bonjour ${username},

Nous vous contactons concernant un signalement reçu sur votre compte : ${reportInfo.type || 'Violation des conditions d\'utilisation'}.

Ceci constitue un avertissement. Nous vous rappelons l'importance de respecter nos conditions d'utilisation.

En cas de récidive, des mesures plus strictes pourraient être appliquées.

Cordialement,
L'équipe Hifadhui`;
        }
        
      case 'suspend':
        // Calculer la date de fin de suspension
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);
        const endDateStr = endDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        return `Bonjour ${username},

Votre compte a été temporairement suspendu suite à : ${reportInfo.type || 'Violation des conditions d\'utilisation'}.

Durée de la suspension : ${duration} jour(s)
Date de fin de suspension : ${endDateStr}

Cette suspension prendra effet immédiatement et durera selon la durée spécifiée.

Pour toute question concernant cette décision, vous pouvez nous contacter.

Cordialement,
L'équipe Hifadhui`;
        
      case 'delete':
        return `Bonjour ${username},

Nous vous informons que votre compte sera supprimé suite à : ${reportInfo.type || 'Violation grave des conditions d\'utilisation'}.

Cette décision est définitive. Toutes vos données seront supprimées de nos serveurs.

Si vous pensez qu'il s'agit d'une erreur, contactez-nous dans les plus brefs délais.

Cordialement,
L'équipe Hifadhui`;
        
      default:
        return `Action de modération suite au signalement: ${reportInfo.type || 'Violation des conditions d\'utilisation'}`;
    }
  };

  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(14); // Pour les suspensions
  const [confirmationText, setConfirmationText] = useState(''); // Pour la confirmation de suppression
  const [isLoading, setIsLoading] = useState(false);

  // Mettre à jour le message quand la durée change
  useEffect(() => {
    setReason(getDefaultReason());
  }, [duration]);

  // Mettre à jour la raison par défaut quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      console.log('📋 [MODERATION-MODAL] Modal ouvert:', {
        actionType,
        reportInfo,
        userInfo
      });
      if (reportInfo) {
        setReason(getDefaultReason());
      }
      setConfirmationText(''); // Réinitialiser la confirmation
    }
  }, [isOpen, reportInfo, actionType]);

  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'warn':
        return {
          title: 'Avertir l\'utilisateur',
          icon: <FiMail />,
          color: '#f59e0b',
          description: 'Envoyer un avertissement à cet utilisateur',
          requiresReason: true,
          showDuration: false
        };
      case 'suspend':
        return {
          title: 'Suspendre l\'utilisateur',
          icon: <FiPause />,
          color: '#ef4444',
          description: 'Suspendre temporairement ce compte utilisateur',
          requiresReason: true,
          showDuration: true
        };
      case 'delete':
        return {
          title: 'Supprimer définitivement',
          icon: <FiTrash2 />,
          color: '#dc2626',
          description: 'Supprimer définitivement ce compte et toutes ses données',
          requiresReason: true,
          showDuration: false
        };
      case 'hide':
        return {
          title: 'Masquer le contenu',
          icon: <FiAlertTriangle />,
          color: '#f59e0b',
          description: 'Masquer ce contenu sans sanctionner l\'utilisateur',
          requiresReason: true,
          showDuration: false
        };
      default:
        return {
          title: 'Action de modération',
          icon: <FiAlertTriangle />,
          color: '#6b7280',
          description: 'Effectuer une action de modération',
          requiresReason: true,
          showDuration: false
        };
    }
  };

  const config = getActionConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (config.requiresReason && !reason.trim()) {
      alert('Veuillez spécifier une raison pour cette action.');
      return;
    }

    // Vérification spéciale pour la suppression
    if (actionType === 'delete' && confirmationText !== 'SUPPRIMER') {
      alert('Veuillez taper "SUPPRIMER" pour confirmer la suppression définitive.');
      return;
    }

    setIsLoading(true);
    
    try {
      const actionData = {
        userId: userInfo?.userId,
        reportId: reportInfo?.id,
        reason: reason.trim(),
        ...(config.showDuration && { duration })
      };

      await onConfirm(actionData);
      onClose();
      setReason('');
      setDuration(14);
    } catch (error) {
      console.error('Erreur lors de l\'action de modération:', error);
      alert('Une erreur est survenue lors de l\'exécution de l\'action.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setReason('');
      setDuration(14);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content moderation-action-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <div 
              className="action-icon"
              style={{ color: config.color }}
            >
              {config.icon}
            </div>
            <div>
              <h2>{config.title}</h2>
              <p className="modal-description">{config.description}</p>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Informations utilisateur */}
          {userInfo && (
            <div className="user-info-section">
              <h3><FiUser /> Utilisateur concerné</h3>
              <div className="user-details">
                <div className="user-detail-item">
                  <strong>Nom :</strong> {userInfo.username || 'Non spécifié'}
                </div>
                <div className="user-detail-item">
                  <strong>Email :</strong> {userInfo.email || 'Non spécifié'}
                </div>
                <div className="user-detail-item">
                  <strong>Inscrit le :</strong> {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('fr-FR') : 'Non spécifié'}
                </div>
              </div>
            </div>
          )}

          {/* Informations du signalement */}
          {reportInfo && (
            <div className="report-info-section">
              <h3><FiAlertTriangle /> Signalement</h3>
              <div className="report-details">
                <div className="report-detail-item">
                  <strong>Type :</strong> 
                  <span className={`report-type ${reportInfo.type ? 'specified' : 'unspecified'}`}>
                    {reportInfo.type || 'Non spécifié'}
                  </span>
                </div>
                
                {/* Afficher le fichier seulement pour les signalements liés aux fichiers */}
                {reportInfo.fileName && (
                  <div className="report-detail-item">
                    <strong>Fichier :</strong> 
                    <span className={`report-file ${reportInfo.fileName !== 'Non spécifié' ? 'specified' : 'unspecified'}`}>
                      {reportInfo.fileName}
                    </span>
                  </div>
                )}
                
                <div className="report-detail-item">
                  <strong>Source :</strong> 
                  <span className="report-source">
                    {reportInfo.source || 'Non spécifiée'}
                  </span>
                </div>
                <div className="report-detail-item">
                  <strong>Motif :</strong> 
                  <span className="report-reason">
                    {reportInfo.reason || 'Non spécifié'}
                  </span>
                </div>
                
                
                {/* Informations techniques supplémentaires si pertinentes */}
                {reportInfo.evidence && (reportInfo.evidence.userAgent || reportInfo.evidence.riskScore) && (
                  <div className="report-detail-item">
                    <strong>Informations techniques :</strong>
                    <div className="evidence-details">
                      {reportInfo.evidence.userAgent && (
                        <span className="evidence-item">User-Agent: {reportInfo.evidence.userAgent.substring(0, 50)}...</span>
                      )}
                      {reportInfo.evidence.riskScore && (
                        <span className="evidence-item">Score de risque: {reportInfo.evidence.riskScore}/100</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Durée de suspension */}
            {config.showDuration && (
              <div className="form-group">
                <label htmlFor="duration">
                  <FiClock />
                  Durée de suspension (jours)
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                >
                  <option value={1}>1 jour</option>
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={365}>1 an</option>
                </select>
              </div>
            )}

            {/* Raison */}
            {config.requiresReason && (
              <div className="form-group">
                <label htmlFor="reason">
                  <FiAlertTriangle />
                  Raison de l'action *
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez la raison de cette action de modération..."
                  rows={4}
                  required
                  className="reason-textarea"
                />
              </div>
            )}

            {/* Champ de confirmation pour la suppression */}
            {actionType === 'delete' && (
              <div className="form-group">
                <label htmlFor="confirmation">
                  <FiAlertTriangle />
                  Confirmation de suppression *
                </label>
                <input
                  type="text"
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder='Tapez "SUPPRIMER" pour confirmer'
                  required
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  ⚠️ Cette action est définitive et supprimera toutes les données de l'utilisateur
                </small>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={isLoading || (actionType === 'delete' && confirmationText !== 'SUPPRIMER')}
                style={{ backgroundColor: config.color }}
              >
                {isLoading ? 'En cours...' : config.title}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModerationActionModal;
