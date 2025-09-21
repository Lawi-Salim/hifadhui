// CSS intégré pour compatibilité Vercel (pas d'accès au système de fichiers)
const cssContent = `
/* Variables CSS - Thème sombre uniquement */
:root {
    /* Police principale - Geist */
    --font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    
    /* Couleurs principales */
    --white-color: #fff;
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    --primary-color-light: #1e40af;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    
    /* Couleurs de fond - thème sombre */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --surface-color: #1e293b;
    --background-color: #0f172a;
    
    /* Couleurs de texte - thème sombre */
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --text-gray: #2c3e50;
    
    /* Bordures - thème sombre */
    --border-color: #334155;
    --border-radius: 8px;
    
    /* Ombres adaptées au thème sombre */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
    
    /* Espacement */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* Gradient pour le brand text du sidebar */
    --navbar-brand-gradient: linear-gradient(135deg, #3b82f6, #8b5cf6);
    
    /* Variables pour la barre latérale */
    --navbar-bg: #1e293b;
    --navbar-text-color: #f8fafc;
}
`;

/**
 * Template d'email pour les messages de contact
 * @param {string} name - Nom de l'expéditeur
 * @param {string} email - Email de l'expéditeur
 * @param {string} subject - Sujet du message
 * @param {string} message - Contenu du message
 * @returns {string} HTML template
 */
export const getContactTemplate = (name, email, subject, message) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau message de contact - Hifadhui</title>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            ${cssContent}
            
            body { 
                font-family: var(--font-family); 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
                min-height: 100vh;
                line-height: 1.6;
            }
            
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: var(--white-color); 
                border-radius: 16px; 
                box-shadow: var(--shadow-lg); 
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .header { 
                background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%); 
                color: var(--white-color); 
                padding: 40px 30px; 
                text-align: center; 
                position: relative;
            }
            
            .header h1 { 
                margin: 0; 
                font-size: 32px; 
                font-weight: 700; 
                letter-spacing: -0.025em;
            }
            
            .header p {
                margin: 12px 0 0 0; 
                opacity: 0.95; 
                font-size: 16px;
                font-weight: 400;
            }
            
            .content { 
                padding: 40px 30px; 
                color: #1f2937;
            }
            
            .content p {
                margin: 0 0 16px 0;
                font-size: 16px;
                color: #374151;
            }
            
            .icon { 
                font-size: 64px; 
                margin-bottom: 20px; 
                filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
            }
            
            .contact-info { 
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                border-radius: 12px; 
                padding: 24px; 
                margin: 24px 0; 
                border: 1px solid #e2e8f0;
                box-shadow: var(--shadow-sm);
            }
            
            .contact-info h3 {
                margin-top: 0; 
                margin-bottom: 16px;
                color: #1e293b;
                font-size: 18px;
                font-weight: 600;
            }
            
            .info-item { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                margin: 12px 0; 
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-item .label {
                font-size: 15px;
                color: var(--text-muted);
                font-weight: 500;
                min-width: 80px;
            }
            
            .info-item .value {
                font-weight: 600;
                color: #1e293b;
                font-size: 15px;
                flex: 1;
                text-align: right;
            }
            
            .message-content {
                background: linear-gradient(135deg, #fefefe 0%, #f9fafb 100%);
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
                color: #374151;
                font-size: 16px;
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            
            .footer { 
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                padding: 24px 30px; 
                text-align: center; 
                color: var(--text-muted); 
                font-size: 14px;
                border-top: 1px solid #e2e8f0;
            }
            
            .brand {
                font-weight: 700;
                background: var(--navbar-brand-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 18px;
            }
            
            /* Responsive */
            @media (max-width: 640px) {
                body { padding: 10px; }
                .container { border-radius: 12px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .footer { padding: 20px; }
                .header h1 { font-size: 28px; }
                .icon { font-size: 56px; }
                .info-item { flex-direction: column; }
                .info-item .value { text-align: left; margin-top: 4px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">📧</div>
                <h1>Nouveau message de contact</h1>
                <p>Message reçu via le formulaire de contact <span class="brand">Hifadhui</span></p>
            </div>
            
            <div class="content">
                <p>Vous avez reçu un nouveau message via le formulaire de contact de <strong>Hifadhui</strong>.</p>
                
                <div class="contact-info">
                    <h3>📋 Informations de l'expéditeur</h3>
                    <div class="info-item">
                        <span class="label">👤 Nom :</span>
                        <span class="value">${name}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">📧 Email :</span>
                        <span class="value">${email}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">📝 Sujet :</span>
                        <span class="value">${subject}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">📅 Date :</span>
                        <span class="value">${new Date().toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                    </div>
                </div>
                
                <h3 style="color: #1e293b; margin-top: 32px; margin-bottom: 16px;">💬 Message :</h3>
                <div class="message-content">
                    ${message}
                </div>
                
                <p style="margin-top: 32px; color: var(--text-muted); font-style: italic;">
                    Pour répondre à ce message, utilisez directement l'adresse email : <strong>${email}</strong>
                </p>
                
                <p style="margin-top: 32px; margin-bottom: 0;">
                    Cordialement,<br>
                    <strong class="brand">Système de contact Hifadhui</strong>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Cet email a été généré automatiquement.</strong></p>
                <p>Message envoyé depuis le formulaire de contact de Hifadhui.</p>
                <p style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
                    © ${new Date().getFullYear()} Hifadhui - Plateforme sécurisée de gestion de fichiers
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
