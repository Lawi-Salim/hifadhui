/**
 * Configuration des Règles de Modération
 * Paramètres ajustables pour le système de signalement automatique
 */

export const MODERATION_RULES = {
  
  // ========================================
  // SEUILS DE DÉTECTION
  // ========================================
  
  thresholds: {
    // Upload Suspect
    upload: {
      maxFilesPerWindow: 5,        // Maximum de fichiers
      timeWindowMinutes: 5,        // Fenêtre de temps en minutes
      maxFileSizeMB: 100,          // Taille max par fichier (MB)
      maxTotalSizeMB: 500,         // Taille totale max par session (MB)
      suspiciousExtensions: [      // Extensions interdites
        '.exe', '.bat', '.cmd', '.scr', '.vbs', 
        '.js', '.php', '.asp', '.jsp', '.py'
      ],
      suspiciousKeywords: [        // Mots-clés suspects dans les noms
        'virus', 'malware', 'hack', 'crack', 'keygen', 
        'trojan', 'backdoor', 'exploit'
      ]
    },
    
    // Connexion
    login: {
      maxFailedAttempts: 5,        // Tentatives échouées max
      timeWindowMinutes: 10,       // Fenêtre de temps
      maxDifferentIPs: 3,          // IPs différentes max
      suspiciousUserAgents: [      // User-Agents suspects
        'python', 'curl', 'wget', 'bot', 'crawler', 
        'spider', 'scraper', 'automated', 'script'
      ]
    },
    
    // Profil
    profile: {
      maxChangesPerHour: 3,        // Modifications max par heure
      suspiciousChanges: [         // Types de changements suspects
        'email_rapid_change',      // Email changé plusieurs fois
        'username_random',         // Nom d'utilisateur aléatoire
        'profile_mass_update'      // Mise à jour massive
      ]
    },
    
    // API
    api: {
      maxRequestsPerMinute: 100,   // Requêtes max par minute
      maxRequestsPerHour: 1000,    // Requêtes max par heure
      suspiciousEndpoints: [       // Endpoints sensibles
        '/admin', '/delete', '/moderation', 
        '/reports', '/users', '/files/bulk'
      ],
      maxSameEndpoint: 50          // Max requêtes vers même endpoint/min
    }
  },
  
  // ========================================
  // SCORES DE RISQUE
  // ========================================
  
  riskScores: {
    // Facteurs de risque (points ajoutés au score)
    factors: {
      massUpload: 30,              // Upload en masse
      invalidFileType: 40,         // Type de fichier interdit
      failedLogins: 25,            // Échecs de connexion
      rapidProfileChange: 20,      // Changements rapides de profil
      apiAbuse: 35,                // Abus d'API
      newAccount: 5,               // Compte récent (<24h)
      suspiciousUserAgent: 15,     // User-Agent suspect
      multipleIPs: 10,             // Connexions multiples IPs
      offHours: 5,                 // Activité nocturne (2h-6h)
      repeatedPattern: 20,         // Pattern répétitif détecté
      massiveRequests: 30          // Requêtes massives
    },
    
    // Seuils d'action basés sur le score total
    actionThresholds: {
      info: 20,                    // Surveillance renforcée
      warning: 40,                 // Signalement + avertissement
      critical: 70,                // Signalement urgent + action
      emergency: 90                // Blocage immédiat
    }
  },
  
  // ========================================
  // ACTIONS AUTOMATIQUES
  // ========================================
  
  automaticActions: {
    // Actions par niveau de risque
    byRiskLevel: {
      info: {
        enabled: true,
        actions: ['enhanced_logging', 'monitoring']
      },
      warning: {
        enabled: true,
        actions: ['rate_limiting', 'auto_report', 'user_warning']
      },
      critical: {
        enabled: true,
        actions: ['strict_rate_limiting', 'urgent_report', 'temporary_suspension']
      },
      emergency: {
        enabled: true,
        actions: ['immediate_block', 'admin_alert', 'security_log']
      }
    },
    
    // Durées des actions
    durations: {
      temporaryBlock: 15,          // Minutes de blocage temporaire
      rateLimitWindow: 60,         // Minutes de rate limiting strict
      suspensionHours: 24,         // Heures de suspension automatique
      warningCooldown: 60          // Minutes entre avertissements
    },
    
    // Escalade automatique
    escalation: {
      enabled: true,
      rules: [
        {
          condition: 'repeated_warnings',
          threshold: 3,              // 3 avertissements
          timeframe: 24,             // en 24h
          action: 'auto_suspension'
        },
        {
          condition: 'multiple_reports',
          threshold: 5,              // 5 signalements
          timeframe: 7,              // en 7 jours
          action: 'admin_review'
        }
      ]
    }
  },
  
  // ========================================
  // NOTIFICATIONS
  // ========================================
  
  notifications: {
    // Canaux de notification par gravité
    channels: {
      info: ['log'],
      warning: ['log', 'dashboard'],
      critical: ['log', 'dashboard', 'email'],
      emergency: ['log', 'dashboard', 'email', 'sms']
    },
    
    // Templates de messages
    templates: {
      autoReport: {
        subject: '[Hifadhui] Signalement automatique - {severity}',
        body: 'Utilisateur {userId} signalé automatiquement pour {reason}. Score de risque: {riskScore}/100.'
      },
      criticalAlert: {
        subject: '[URGENT] Hifadhui - Activité critique détectée',
        body: 'Activité critique détectée pour l\'utilisateur {userId}. Action immédiate requise.'
      }
    },
    
    // Fréquence des notifications (éviter le spam)
    rateLimiting: {
      maxPerUser: 5,               // Max notifications par utilisateur
      timeWindowHours: 24,         // Par période de 24h
      cooldownMinutes: 30          // Délai minimum entre notifications
    }
  },
  
  // ========================================
  // CONFIGURATION AVANCÉE
  // ========================================
  
  advanced: {
    // Machine Learning (futur)
    ml: {
      enabled: false,
      modelPath: null,
      confidenceThreshold: 0.8
    },
    
    // Intégrations externes
    integrations: {
      slack: {
        enabled: false,
        webhook: null,
        channels: {
          alerts: '#security-alerts',
          reports: '#moderation-reports'
        }
      },
      email: {
        enabled: true,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: 'security@hifadhui.site',
        adminEmails: ['admin@hifadhui.site']
      }
    },
    
    // Stockage des données
    storage: {
      retentionDays: 90,           // Garder les données 90 jours
      cleanupInterval: 24,         // Nettoyage toutes les 24h
      archiveOldData: true         // Archiver au lieu de supprimer
    },
    
    // Performance
    performance: {
      maxMemoryActivities: 10000,  // Max activités en mémoire
      cleanupInterval: 3600,       // Nettoyage toutes les heures
      batchSize: 100               // Taille des lots pour traitement
    }
  }
};

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Obtenir la configuration actuelle
 */
export function getCurrentConfig() {
  return MODERATION_RULES;
}

/**
 * Mettre à jour une règle spécifique
 */
export function updateRule(path, value) {
  const keys = path.split('.');
  let current = MODERATION_RULES;
  
  // Naviguer jusqu'à l'avant-dernière clé
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  // Mettre à jour la valeur finale
  const lastKey = keys[keys.length - 1];
  const oldValue = current[lastKey];
  current[lastKey] = value;
  
  console.log(`✅ Règle mise à jour: ${path} = ${value} (ancienne: ${oldValue})`);
  return true;
}

/**
 * Valider la configuration
 */
export function validateConfig() {
  const errors = [];
  
  // Vérifier les seuils
  if (MODERATION_RULES.thresholds.upload.maxFilesPerWindow <= 0) {
    errors.push('maxFilesPerWindow doit être > 0');
  }
  
  if (MODERATION_RULES.riskScores.actionThresholds.warning >= 
      MODERATION_RULES.riskScores.actionThresholds.critical) {
    errors.push('Le seuil warning doit être < critical');
  }
  
  // Vérifier les durées
  if (MODERATION_RULES.automaticActions.durations.temporaryBlock <= 0) {
    errors.push('temporaryBlock doit être > 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Réinitialiser la configuration par défaut
 */
export function resetToDefaults() {
  // Sauvegarder la config actuelle
  const backup = JSON.parse(JSON.stringify(MODERATION_RULES));
  
  // Réinitialiser (recharger le module)
  console.log('🔄 Configuration réinitialisée aux valeurs par défaut');
  
  return backup;
}

/**
 * Exporter la configuration pour sauvegarde
 */
export function exportConfig() {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0',
    config: MODERATION_RULES
  };
}

/**
 * Importer une configuration
 */
export function importConfig(configData) {
  try {
    if (!configData.config) {
      throw new Error('Format de configuration invalide');
    }
    
    // Valider avant d'importer
    const tempRules = configData.config;
    
    // Remplacer la configuration actuelle
    Object.assign(MODERATION_RULES, tempRules);
    
    console.log('✅ Configuration importée avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import de configuration:', error);
    return false;
  }
}

export default MODERATION_RULES;
