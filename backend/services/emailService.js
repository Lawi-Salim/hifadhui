import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { 
  getPasswordResetTemplate, 
  getContactTemplate, 
  getAccountDeletionTemplate,
  getAccountDeletionGraceTemplate,
  getAccountDeletionReminderTemplate
} from './template-mails/index.js';
import Message from '../models/Message.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    // Configuration pour différents environnements
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // En développement, utiliser Ethereal pour les tests
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        emailConfig.host = 'smtp.ethereal.email';
        emailConfig.port = 587;
        emailConfig.secure = false;
        emailConfig.auth = {
          user: testAccount.user,
          pass: testAccount.pass
        };
        console.log('📧 Using Ethereal test account for email development');
      } catch (error) {
        console.error('❌ Failed to create test account:', error.message);
      }
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Vérifier la configuration
    try {
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email, username, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    const htmlTemplate = this.getPasswordResetTemplate(username, resetUrl);
    const textTemplate = this.getPasswordResetTextTemplate(username, resetUrl);

    const mailOptions = {
      from: {
        name: 'Hifadhui',
        address: process.env.SMTP_FROM || process.env.SMTP_USER
      },
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe - Hifadhui',
      text: textTemplate,
      html: htmlTemplate
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // En développement avec Ethereal, afficher l'URL de prévisualisation
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Password reset email sent');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Échec de l\'envoi de l\'email de réinitialisation');
    }
  }

  /**
   * Envoyer un message de contact
   */
  async sendContactMessage({ name, email, subject, message }) {
    const mailOptions = {
      from: `"Hifadhui" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_FROM, // Envoyer à nous-mêmes
      replyTo: email, // Permettre de répondre directement au client
      subject: `[Contact Hifadhui] ${subject}`,
      html: this.getContactTemplate(name, email, subject, message),
      text: `
        Nouveau message de contact - Hifadhui

        De: ${name} (${email})
        Sujet: ${subject}

        Message:
        ${message}

        ---
        Vous pouvez répondre directement à cet email pour contacter ${name}.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Contact message sent successfully:', info.messageId);
      
      if (process.env.NODE_ENV === 'development' && info.messageId && info.messageId.includes('ethereal')) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Failed to send contact message:', error);
      throw new Error('Échec de l\'envoi du message de contact');
    }
  }

  /**
   * Template HTML pour l'email de réinitialisation
   * Utilise le template externe pour une meilleure maintenabilité
   */
  getPasswordResetTemplate(username, resetUrl) {
    return getPasswordResetTemplate(username, resetUrl);
  }

  /**
   * Template texte pour l'email de réinitialisation
   */
  getPasswordResetTextTemplate(username, resetUrl) {
    return `
      Bonjour ${username},

      Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Hifadhui.

      Pour créer un nouveau mot de passe, cliquez sur ce lien :
      ${resetUrl}

      IMPORTANT :
      - Ce lien est valide pendant 15 minutes seulement
      - Il ne peut être utilisé qu'une seule fois
      - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email

      Si vous avez des questions, contactez notre support.

      ---
      Hifadhui - Votre coffre-fort numérique sécurisé
    `;
  }

  /**
   * Nettoie les tokens expirés (à appeler périodiquement)
   */
  async cleanupExpiredTokens() {
    try {
      const { default: PasswordResetToken } = await import('../models/PasswordResetToken.js');
      const deleted = await PasswordResetToken.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date()
          }
        }
      });
      
      if (deleted > 0) {
        console.log(`🧹 Cleaned up ${deleted} expired password reset tokens`);
      }
      
      return deleted;
    } catch (error) {
      console.error('❌ Failed to cleanup expired tokens:', error);
      return 0;
    }
  }

  /**
   * Template HTML pour l'email de contact
   * Utilise le template externe pour une meilleure maintenabilité
   */
  getContactTemplate(name, email, subject, message) {
    return getContactTemplate(name, email, subject, message);
  }

  /**
   * Envoie un email de confirmation de suppression de compte
   * @param {string} email - Email de l'utilisateur
   * @param {Object} userData - Données de l'utilisateur supprimé
   */
  async sendAccountDeletionConfirmation(email, userData) {
    const { username, deletedAt, filesCount } = userData;
    
    const mailOptions = {
      from: `"Hifadhui" <${process.env.SMTP_USER || 'mavuna@hifadhui.site'}>`,
      to: email,
      subject: 'Confirmation de suppression de compte - Hifadhui',
      html: this.getAccountDeletionTemplate(username, deletedAt, filesCount)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [EMAIL] Email de suppression envoyé:', info.messageId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 [EMAIL] Aperçu:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [EMAIL] Erreur envoi email suppression:', error);
      throw error;
    }
  }

  /**
   * Template HTML pour l'email de confirmation de suppression
   * Utilise le template externe pour une meilleure maintenabilité
   */
  getAccountDeletionTemplate(username, deletedAt, filesCount) {
    return getAccountDeletionTemplate(username, deletedAt, filesCount);
  }

  /**
   * Envoie un email de période de grâce pour la suppression de compte
   */
  async sendAccountDeletionGraceEmail(email, username, deletionScheduledAt, recoveryToken, gracePeriodDays = 14) {
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');
    const recoveryUrl = `${frontendUrl}/account-recovery/${recoveryToken}`;
    
    const htmlTemplate = getAccountDeletionGraceTemplate(username, deletionScheduledAt, recoveryUrl, gracePeriodDays);

    const mailOptions = {
      from: {
        name: 'Hifadhui',
        address: process.env.SMTP_FROM || process.env.SMTP_USER
      },
      to: email,
      subject: `⏰ Période de grâce - Votre compte sera supprimé dans ${gracePeriodDays} jours`,
      html: htmlTemplate,
      text: `Bonjour ${username},

      Votre demande de suppression de compte Hifadhui a été prise en compte.

      PÉRIODE DE GRÂCE : ${gracePeriodDays} jours
      Suppression programmée le : ${new Date(deletionScheduledAt).toLocaleDateString('fr-FR')}

      Vous pouvez encore récupérer votre compte en utilisant ce lien :
      ${recoveryUrl}

      Attention : Passé ce délai, votre compte et toutes vos données seront définitivement supprimés.

      Cordialement,
      L'équipe Hifadhui`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de période de grâce envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email période de grâce:', error);
      throw error;
    }
  }

  /**
   * Envoie un email sans l'enregistrer dans la base de données
   * Utilisé pour les emails de modération automatiques
   */
  async sendEmailOnly({ to, cc, bcc, subject, content, htmlContent }) {
    const mailOptions = {
      from: {
        name: 'Hifadhui',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'mavuna@hifadhui.site'
      },
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      text: content,
      html: htmlContent || content.replace(/\n/g, '<br>')
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // En développement avec Ethereal, afficher l'URL de prévisualisation
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent (no DB record)');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }

  /**
   * Envoie un email personnalisé ET l'enregistre dans la base de données
   * Utilisé pour les emails manuels depuis l'interface admin
   */
  async sendCustomEmail({ to, cc, bcc, subject, content, htmlContent }) {
    const mailOptions = {
      from: {
        name: 'Hifadhui',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'mavuna@hifadhui.site'
      },
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      text: content,
      html: htmlContent || content.replace(/\n/g, '<br>')
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Enregistrer l'email envoyé dans la base de données
      try {
        await Message.create({
          type: 'email_sent',
          subject: subject,
          content: content,
          htmlContent: htmlContent || content.replace(/\n/g, '<br>'),
          senderEmail: mailOptions.from.address,
          senderName: mailOptions.from.name,
          recipientEmail: to,
          status: 'read', // Les emails envoyés sont considérés comme "lus"
          messageId: info.messageId,
          metadata: {
            cc: cc || null,
            bcc: bcc || null,
            sentAt: new Date(),
            provider: 'smtp'
          }
        });
        console.log('📧 [DB] Email enregistré dans la base de données');
      } catch (dbError) {
        console.error('❌ [DB] Erreur enregistrement email:', dbError);
        // Ne pas faire échouer l'envoi si l'enregistrement échoue
      }
      
      // En développement avec Ethereal, afficher l'URL de prévisualisation
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Custom email sent');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Failed to send custom email:', error);
      throw new Error('Échec de l\'envoi de l\'email personnalisé');
    }
  }

  /**
   * Envoie un email de rappel avant suppression définitive
   */
  async sendAccountDeletionReminderEmail(email, username, deletionScheduledAt, recoveryToken, daysRemaining) {
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.VERCEL ? 'https://hifadhui.site' : 'http://localhost:3000');
    const recoveryUrl = `${frontendUrl}/account-recovery/${recoveryToken}`;
    
    const htmlTemplate = getAccountDeletionReminderTemplate(username, deletionScheduledAt, recoveryUrl, daysRemaining);

    const mailOptions = {
      from: {
        name: 'Hifadhui',
        address: process.env.SMTP_FROM || process.env.SMTP_USER
      },
      to: email,
      subject: `🚨 RAPPEL URGENT - Suppression de votre compte dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
      html: htmlTemplate,
      text: `RAPPEL URGENT - Bonjour ${username},

      Votre compte Hifadhui sera définitivement supprimé dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}.

      Suppression programmée le : ${new Date(deletionScheduledAt).toLocaleDateString('fr-FR')}

      DERNIÈRE CHANCE pour récupérer votre compte :
      ${recoveryUrl}

      Après cette date, il sera impossible de récupérer vos données.

      Cordialement,
      L'équipe Hifadhui`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de rappel suppression envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email rappel suppression:', error);
      throw error;
    }
  }
}

// Instance singleton
const emailService = new EmailService();

export default emailService;
