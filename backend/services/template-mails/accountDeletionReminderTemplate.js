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
 * Template d'email de rappel avant suppression définitive
 * @param {string} username - Nom d'utilisateur
 * @param {Date} deletionScheduledAt - Date programmée de suppression définitive
 * @param {string} recoveryUrl - URL de récupération du compte
 * @param {number} daysRemaining - Nombre de jours restants
 * @returns {string} HTML template
 */
export const getAccountDeletionReminderTemplate = (username, deletionScheduledAt, recoveryUrl, daysRemaining) => {
  const formattedDate = new Date(deletionScheduledAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rappel urgent - Suppression de compte dans ${daysRemaining} jours - Hifadhui</title>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            ${cssContent}
            
            body { 
                font-family: var(--font-family); 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, var(--error-color) 0%, #dc2626 100%);
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
                background: linear-gradient(135deg, var(--error-color) 0%, #dc2626 100%); 
                color: var(--white-color); 
                padding: 40px 30px; 
                text-align: center; 
                position: relative;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                pointer-events: none;
            }
            
            .header h1 { 
                margin: 0; 
                font-size: 32px; 
                font-weight: 700; 
                letter-spacing: -0.025em;
                position: relative;
                z-index: 1;
            }
            
            .header p {
                margin: 12px 0 0 0; 
                opacity: 0.95; 
                font-size: 16px;
                font-weight: 400;
                position: relative;
                z-index: 1;
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
                position: relative;
                z-index: 1;
            }
            
            .urgent-countdown { 
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
                border: 2px solid var(--error-color); 
                border-radius: 12px; 
                padding: 24px; 
                margin: 24px 0; 
                text-align: center;
                box-shadow: var(--shadow-md);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { box-shadow: var(--shadow-md); }
                50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
                100% { box-shadow: var(--shadow-md); }
            }
            
            .urgent-countdown h3 {
                margin-top: 0; 
                margin-bottom: 16px;
                color: #991b1b;
                font-size: 20px;
                font-weight: 600;
            }
            
            .urgent-countdown .days {
                font-size: 56px;
                font-weight: 700;
                color: var(--error-color);
                margin: 16px 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .urgent-countdown .date {
                font-size: 16px;
                color: #991b1b;
                font-weight: 600;
            }
            
            .recovery-button {
                display: inline-block;
                background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
                color: var(--white-color);
                padding: 20px 40px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 700;
                font-size: 18px;
                margin: 32px 0;
                box-shadow: var(--shadow-lg);
                transition: all 0.2s ease;
                animation: glow 2s infinite alternate;
            }
            
            @keyframes glow {
                from { box-shadow: var(--shadow-lg); }
                to { box-shadow: 0 0 25px rgba(16, 185, 129, 0.5); }
            }
            
            .recovery-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
            }
            
            .warning-box { 
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
                border: 2px solid var(--warning-color); 
                border-radius: 12px; 
                padding: 24px; 
                margin: 24px 0; 
                color: #92400e;
                box-shadow: var(--shadow-md);
            }
            
            .footer { 
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                padding: 24px 30px; 
                text-align: center; 
                color: var(--text-muted); 
                font-size: 14px;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer p {
                margin: 8px 0;
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
                .urgent-countdown .days { font-size: 42px; }
                .recovery-button { padding: 16px 32px; font-size: 16px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">🚨</div>
                <h1>Rappel urgent</h1>
                <p>Votre compte <span class="brand">Hifadhui</span> sera supprimé dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}</p>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${username}</strong>,</p>
                
                <p><strong>⚠️ RAPPEL URGENT :</strong> Votre compte <strong>Hifadhui</strong> sera définitivement supprimé dans très peu de temps.</p>
                
                <div class="urgent-countdown">
                    <h3>⏰ Temps restant</h3>
                    <div class="days">${daysRemaining}</div>
                    <div class="date">Suppression le ${formattedDate}</div>
                </div>
                
                <p><strong>🔄 Dernière chance de récupérer votre compte !</strong></p>
                <p>Si vous souhaitez conserver votre compte et vos données, vous devez agir <strong>maintenant</strong> en cliquant sur le bouton ci-dessous :</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${recoveryUrl}" class="recovery-button">
                        🛡️ RÉCUPÉRER MON COMPTE MAINTENANT
                    </a>
                </div>
                
                <div class="warning-box">
                    <strong>⚠️ ATTENTION - SUPPRESSION IMMINENTE</strong>
                    <p style="margin: 12px 0 0 0; font-weight: 600;">
                        Après le ${formattedDate}, il sera <strong>impossible</strong> de récupérer :
                    </p>
                    <ul style="margin: 12px 0; padding-left: 20px; font-weight: 500;">
                        <li>Votre compte utilisateur</li>
                        <li>Tous vos fichiers et documents</li>
                        <li>Vos dossiers et leur organisation</li>
                        <li>Vos liens de partage</li>
                        <li>Votre historique d'activité</li>
                    </ul>
                </div>
                
                <p><strong>🔗 Lien de récupération :</strong></p>
                <p style="word-break: break-all; color: var(--primary-color); font-family: monospace; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px;">
                    ${recoveryUrl}
                </p>
                
                <p style="margin-top: 32px; margin-bottom: 0; color: #991b1b; font-weight: 600;">
                    Si vous ne souhaitez pas récupérer votre compte, vous n'avez rien à faire. La suppression se fera automatiquement.
                </p>
                
                <p style="margin-top: 32px; margin-bottom: 0;">
                    Cordialement,<br>
                    <strong class="brand">L'équipe Hifadhui</strong>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Cet email de rappel a été envoyé automatiquement.</strong></p>
                <p>Si vous n'avez pas demandé cette suppression, récupérez votre compte immédiatement.</p>
                <p style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
                    © ${new Date().getFullYear()} Hifadhui - Plateforme sécurisée de gestion de fichiers
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
