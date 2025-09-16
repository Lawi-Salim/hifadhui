import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const htmlTemplate = this.getPasswordResetTemplate(username, resetUrl);
    const textTemplate = this.getPasswordResetTextTemplate(username, resetUrl);

    const mailOptions = {
      from: {
        name: 'Hifadhwi',
        address: process.env.SMTP_FROM || process.env.SMTP_USER
      },
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe - Hifadhwi',
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
      subject: `[Contact Hifadhwi] ${subject}`,
      html: this.getContactTemplate(name, email, subject, message),
      text: `
        Nouveau message de contact - Hifadhwi

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
   */
  getPasswordResetTemplate(username, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - Hifadhwi</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 10px;
            }
            .title {
                color: #1e293b;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 30px;
            }
            .btn-reset {
                display: inline-block;
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                color: white !important;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 700;
                font-size: 16px;
                margin: 24px 0;
                box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
                text-align: center;
                min-width: 250px;
                transition: all 0.3s ease;
            }
            .btn-reset:hover {
                background: linear-gradient(135deg, #3730A3 0%, #6B21A8 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
            }
            .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            .link {
                color: #3b82f6;
                word-break: break-all;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔒 Hifadhwi</div>
                <h1 class="title">Réinitialisation de mot de passe</h1>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${username}</strong>,</p>
                
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Hifadhwi.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="btn-reset">🔐 Créer un nouveau mot de passe</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important :</strong>
                    <ul>
                        <li>Ce lien est valide pendant <strong>15 minutes</strong> seulement</li>
                        <li>Il ne peut être utilisé qu'une seule fois</li>
                        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                    </ul>
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
                <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>
            </div>
            
            <div class="footer">
                <p>Cet email a été envoyé par Hifadhwi - Votre coffre-fort numérique sécurisé</p>
                <p>Si vous avez des questions, contactez notre support.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Template texte pour l'email de réinitialisation
   */
  getPasswordResetTextTemplate(username, resetUrl) {
    return `
Bonjour ${username},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Hifadhwi.

Pour créer un nouveau mot de passe, cliquez sur ce lien :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 15 minutes seulement
- Il ne peut être utilisé qu'une seule fois
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email

Si vous avez des questions, contactez notre support.

---
Hifadhwi - Votre coffre-fort numérique sécurisé
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
   */
  getContactTemplate(name, email, subject, message) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau message de contact - Hifadhwi</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 10px;
            }
            .title {
                color: #1e293b;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .contact-info {
                background: #f1f5f9;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .contact-field {
                margin-bottom: 10px;
            }
            .contact-field strong {
                color: #2563eb;
                display: inline-block;
                width: 80px;
            }
            .message-content {
                background: #fefefe;
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 Hifadhwi</div>
                <h1 class="title">Nouveau message de contact</h1>
            </div>
            
            <div class="contact-info">
                <div class="contact-field">
                    <strong>De :</strong> ${name}
                </div>
                <div class="contact-field">
                    <strong>Email :</strong> ${email}
                </div>
                <div class="contact-field">
                    <strong>Sujet :</strong> ${subject}
                </div>
            </div>
            
            <div class="message-content">
                <h3 style="margin-top: 0; color: #1e293b;">Message :</h3>
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div class="footer">
                <p>Message reçu via le formulaire de contact de Hifadhwi</p>
                <p>Vous pouvez répondre directement à cet email pour contacter ${name}.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

// Instance singleton
const emailService = new EmailService();

export default emailService;
