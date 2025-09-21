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
 * Template d'email pour la réinitialisation de mot de passe
 * @param {string} username - Nom d'utilisateur
 * @param {string} resetUrl - URL de réinitialisation
 * @returns {string} HTML template
 */
export const getPasswordResetTemplate = (username, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - Hifadhui</title>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            ${cssContent}
            
            body { 
                font-family: var(--font-family); 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
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
                background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%); 
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
            
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
                color: var(--white-color);
                padding: 16px 32px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                margin: 24px 0;
                box-shadow: var(--shadow-md);
                transition: all 0.2s ease;
            }
            
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }
            
            .warning { 
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
                border: 1px solid var(--warning-color); 
                border-radius: 12px; 
                padding: 20px; 
                margin: 24px 0; 
                color: #92400e;
                box-shadow: 0 1px 3px rgba(245, 158, 11, 0.1);
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
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">🔑</div>
                <h1>Réinitialisation de mot de passe</h1>
                <p>Demande de réinitialisation pour votre compte <span class="brand">Hifadhui</span></p>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${username}</strong>,</p>
                
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>Hifadhui</strong>.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" class="reset-button">
                        🔐 Réinitialiser mon mot de passe
                    </a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important :</strong> Ce lien est valide pendant <strong>1 heure</strong> seulement. 
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; color: var(--primary-color); font-family: monospace; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px;">
                    ${resetUrl}
                </p>
                
                <p style="margin-top: 32px; margin-bottom: 0;">
                    Cordialement,<br>
                    <strong class="brand">L'équipe Hifadhui</strong>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Cet email a été envoyé automatiquement.</strong></p>
                <p>Si vous n'avez pas demandé cette réinitialisation, contactez-nous immédiatement.</p>
                <p style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
                    © ${new Date().getFullYear()} Hifadhui - Plateforme sécurisée de gestion de fichiers
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
