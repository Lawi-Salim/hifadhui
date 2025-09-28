import React, { useState, useRef, useEffect } from 'react';
import {
  FiX,
  FiSend,
  FiPaperclip,
  FiImage,
  FiSmile,
  FiType,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiMinus,
  FiMaximize2,
  FiMinimize2,
  FiAlertCircle
} from 'react-icons/fi';
import messagesService from '../../services/messagesService';
import './EmailComposer.css';

const EmailComposer = ({ 
  isOpen, 
  onClose, 
  replyTo = null, 
  onSent = () => {} 
}) => {
  // Email de l'admin (peut être configuré via les variables d'environnement)
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'mavuna@hifadhui.site';
  const [formData, setFormData] = useState({
    to: replyTo?.senderEmail || '',
    cc: '',
    bcc: '',
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    content: '',
    htmlContent: ''
  });
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (replyTo) {
      setFormData(prev => ({
        ...prev,
        to: replyTo.senderEmail || '',
        subject: replyTo.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`,
        content: `\n\n--- Message original ---\nDe: ${replyTo.senderName} <${replyTo.senderEmail}>\nDate: ${new Date(replyTo.createdAt).toLocaleString('fr-FR')}\nSujet: ${replyTo.subject}\n\n${replyTo.content}`
      }));
    }
  }, [replyTo]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Supprimer l'erreur de validation quand l'utilisateur commence à taper
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.to.trim()) {
      errors.to = 'Le destinataire est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.to.trim())) {
      errors.to = 'Adresse email invalide';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Le sujet est requis';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Le contenu est requis';
    }
    
    return errors;
  };


  const handleFormatCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSending(true);
    try {
      if (replyTo) {
        // Utiliser la route de réponse spécifique
        const replyData = {
          subject: formData.subject,
          content: formData.content,
          htmlContent: formData.content.replace(/\n/g, '<br>'),
          priority: 'normal'
        };
        
        await messagesService.replyToMessage(replyTo.id, replyData);
      } else {
        // Créer un nouveau message
        const messageData = {
          type: 'email_sent',
          subject: formData.subject,
          content: formData.content,
          htmlContent: formData.content.replace(/\n/g, '<br>'),
          recipientEmail: formData.to,
          priority: 'normal',
          metadata: {
            cc: formData.cc || null,
            bcc: formData.bcc || null,
            attachmentsCount: attachments.length
          }
        };

        await messagesService.createMessage(messageData);
      }

      onSent();
      onClose();
      
      // Reset form
      setFormData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        content: '',
        htmlContent: ''
      });
      setAttachments([]);
      setValidationErrors({});
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setValidationErrors({ 
        general: 'Erreur lors de l\'envoi de l\'email: ' + error.message 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`email-composer-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className={`email-composer ${isMinimized ? 'minimized' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}>
        {/* Header */}
        <div className="composer-header">
          <div className="composer-title">
            {replyTo ? 'Répondre' : 'Nouveau message'}
          </div>
          <div className="composer-controls">
            <button 
              className="composer-control-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Agrandir' : 'Réduire'}
            >
              <FiMinus />
            </button>
            <button 
              className="composer-control-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Fenêtre' : 'Plein écran'}
            >
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
            <button 
              className="composer-control-btn composer-close"
              onClick={onClose}
              title="Fermer"
            >
              <FiX />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="composer-body">
            {/* Recipients */}
            <div className="composer-recipients">
              <div className="recipient-row">
                <label>De</label>
                <div className="sender-email">{adminEmail}</div>
              </div>
              
              <div className="recipient-row">
                <label>À</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    value={formData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    placeholder="destinataire@example.com"
                    className={validationErrors.to ? 'error' : ''}
                  />
                  {validationErrors.to && (
                    <div className="error-indicator">
                      <FiAlertCircle />
                      <span className="error-tooltip">{validationErrors.to}</span>
                    </div>
                  )}
                </div>
                <button 
                  className="cc-bcc-toggle"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                >
                  Cc Bcc
                </button>
              </div>
              
              {showCcBcc && (
                <>
                  <div className="recipient-row">
                    <label>Cc</label>
                    <input
                      type="email"
                      value={formData.cc}
                      onChange={(e) => handleInputChange('cc', e.target.value)}
                      placeholder="copie@example.com"
                    />
                  </div>
                  <div className="recipient-row">
                    <label>Bcc</label>
                    <input
                      type="email"
                      value={formData.bcc}
                      onChange={(e) => handleInputChange('bcc', e.target.value)}
                      placeholder="copie.cachee@example.com"
                    />
                  </div>
                </>
              )}
              
              <div className="recipient-row">
                <label>Sujet</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Sujet du message"
                    className={validationErrors.subject ? 'error' : ''}
                  />
                  {validationErrors.subject && (
                    <div className="error-indicator">
                      <FiAlertCircle />
                      <span className="error-tooltip">{validationErrors.subject}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="composer-toolbar">
              <div className="toolbar-row">
                <button 
                  className="toolbar-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                >
                  <FiPaperclip />
                </button>
                <button className="toolbar-btn" title="Insérer une image">
                  <FiImage />
                </button>
                <button className="toolbar-btn" title="Insérer un emoji">
                  <FiSmile />
                </button>
                <button 
                  className="format-btn"
                  onClick={() => handleFormatCommand('bold')}
                  title="Gras"
                >
                  <FiBold />
                </button>
                <button 
                  className="format-btn"
                  onClick={() => handleFormatCommand('italic')}
                  title="Italique"
                >
                  <FiItalic />
                </button>
                <button 
                  className="format-btn"
                  onClick={() => handleFormatCommand('underline')}
                  title="Souligné"
                >
                  <FiUnderline />
                </button>
                <button 
                  className="format-btn"
                  onClick={() => handleFormatCommand('insertUnorderedList')}
                  title="Liste à puces"
                >
                  <FiList />
                </button>
                <button 
                  className="format-btn"
                  onClick={() => {
                    const url = prompt('URL du lien:');
                    if (url) handleFormatCommand('createLink', url);
                  }}
                  title="Insérer un lien"
                >
                  <FiLink />
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="content-wrapper">
              <textarea
                ref={contentRef}
                className={`composer-content ${validationErrors.content ? 'error' : ''}`}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Composez votre message..."
                dir="ltr"
                style={{ 
                  direction: 'ltr', 
                  textAlign: 'left',
                  unicodeBidi: 'normal',
                  writingMode: 'horizontal-tb',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  color: 'inherit',
                  background: 'transparent'
                }}
              />
              {validationErrors.content && (
                <div className="content-error-indicator">
                  <FiAlertCircle />
                  <span className="error-tooltip">{validationErrors.content}</span>
                </div>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="composer-attachments">
                <div className="attachments-header">
                  <FiPaperclip />
                  <span>{attachments.length} pièce(s) jointe(s)</span>
                </div>
                <div className="attachments-list">
                  {attachments.map(attachment => (
                    <div key={attachment.id} className="attachment-item">
                      <span className="attachment-name">{attachment.name}</span>
                      <span className="attachment-size">({formatFileSize(attachment.size)})</span>
                      <button 
                        className="attachment-remove"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="composer-footer">
              <div className="footer-left">
                <button 
                  className="send-btn"
                  onClick={handleSend}
                  disabled={isSending}
                >
                  <FiSend />
                  {isSending ? 'Envoi...' : 'Envoyer'}
                </button>
                {validationErrors.general && (
                  <div className="general-error">
                    <FiAlertCircle />
                    <span>{validationErrors.general}</span>
                  </div>
                )}
              </div>
              <div className="composer-shortcuts">
                Ctrl+Entrée pour envoyer
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileAttachment}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailComposer;
