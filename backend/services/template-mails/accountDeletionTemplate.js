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
 * Template d'email pour la confirmation de suppression de compte
 * @param {string} username - Nom d'utilisateur
 * @param {Date} deletedAt - Date de suppression
 * @param {number} filesCount - Nombre de fichiers supprimés
 * @returns {string} HTML template
 */
export const getAccountDeletionTemplate = (username, deletedAt, filesCount) => {
  const formattedDate = new Date(deletedAt).toLocaleDateString('fr-FR', {
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
        <title>Compte supprimé - Hifadhui</title>
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
            
            .stats { 
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                border-radius: 12px; 
                padding: 24px; 
                margin: 24px 0; 
                border: 1px solid #e2e8f0;
                box-shadow: var(--shadow-sm);
            }
            
            .stats h3 {
                margin-top: 0; 
                margin-bottom: 16px;
                color: #1e293b;
                font-size: 18px;
                font-weight: 600;
            }
            
            .stat-item { 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                margin: 12px 0; 
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .stat-item:last-child {
                border-bottom: none;
            }
            
            .stat-item span {
                font-size: 15px;
                color: var(--text-muted);
            }
            
            .stat-item strong {
                font-weight: 600;
                color: #1e293b;
                font-size: 15px;
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
            
            .warning { 
                background: linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%); 
                border: 1px solid #fecaca; 
                border-radius: 12px; 
                padding: 20px; 
                margin: 24px 0; 
                color: #991b1b;
                box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
            }
            
            .warning strong {
                font-weight: 600;
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
                <div class="icon">🗑️</div>
                <h1>Compte supprimé</h1>
                <p>Votre compte <span class="brand">Hifadhui</span> a été supprimé avec succès</p>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${username}</strong>,</p>
                
                <p>Nous vous confirmons que votre compte <strong>Hifadhui</strong> a été supprimé définitivement le <strong>${formattedDate}</strong>.</p>
                
                <div class="stats">
                    <h3>📊 Données supprimées</h3>
                    <div class="stat-item">
                        <span>📁 Fichiers supprimés</span>
                        <strong>${filesCount}</strong>
                    </div>
                    <div class="stat-item">
                        <span>👤 Profil utilisateur</span>
                        <strong>Supprimé</strong>
                    </div>
                    <div class="stat-item">
                        <span>🔒 Données personnelles</span>
                        <strong>Effacées</strong>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important :</strong> Cette suppression est définitive et irréversible. 
                    Toutes vos données ont été supprimées de nos serveurs et ne peuvent pas être récupérées.
                </div>
                
                <p>Si vous souhaitez utiliser <strong>Hifadhui</strong> à nouveau, vous devrez créer un nouveau compte.</p>
                
                <p>Merci d'avoir utilisé <strong>Hifadhui</strong>. Nous espérons que notre service vous a été utile.</p>
                
                <p style="margin-top: 32px; margin-bottom: 0;">
                    Cordialement,<br>
                    <strong class="brand">L'équipe Hifadhui</strong>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Cet email de confirmation a été envoyé automatiquement.</strong></p>
                <p>Si vous n'avez pas demandé cette suppression, contactez-nous immédiatement.</p>
                <p style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
                    © ${new Date().getFullYear()} Hifadhui - Plateforme sécurisée de gestion de fichiers
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
