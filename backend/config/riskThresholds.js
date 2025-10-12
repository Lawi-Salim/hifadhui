/**
 * Configuration des Seuils d'Alerte
 * Définit les seuils dynamiques pour le système de détection de risques
 */

// Seuils par défaut (ajustables en temps réel)
export const RISK_THRESHOLDS = {
  
  // ========================================
  // SEUILS DE SCORE DE RISQUE
  // ========================================
  
  riskScore: {
    // Niveaux d'alerte basés sur le score total (0-100)
    levels: {
      safe: {
        min: 0,
        max: 20,
        label: 'Sécurisé',
        color: '#28a745',
        actions: ['monitor'],
        description: 'Comportement normal, surveillance standard'
      },
      
      attention: {
        min: 21,
        max: 40,
        label: 'Attention',
        color: '#ffc107',
        actions: ['enhanced_logging', 'light_rate_limit'],
        description: 'Comportement légèrement suspect, surveillance renforcée'
      },
      
      warning: {
        min: 41,
        max: 70,
        label: 'Avertissement',
        color: '#fd7e14',
        actions: ['auto_report', 'moderate_rate_limit', 'user_warning'],
        description: 'Comportement suspect, signalement automatique'
      },
      
      critical: {
        min: 71,
        max: 90,
        label: 'Critique',
        color: '#dc3545',
        actions: ['urgent_report', 'strict_rate_limit', 'temporary_suspension'],
        description: 'Comportement très suspect, action immédiate requise'
      },
      
      emergency: {
        min: 91,
        max: 100,
        label: 'Urgence',
        color: '#6f42c1',
        actions: ['immediate_block', 'admin_alert', 'security_log'],
        description: 'Comportement critique, blocage immédiat'
      }
    },
    
    // Seuils d'escalade automatique
    escalation: {
      rapidIncrease: 30,        // Augmentation rapide du score (+30 en 5min)
      sustainedHigh: 60,        // Score élevé maintenu (>60 pendant 30min)
      peakScore: 85,            // Score de pic critique
      consecutiveAlerts: 3      // Alertes consécutives avant escalade
    }
  },
  
  // ========================================
  // SEUILS PAR ACTIVITÉ
  // ========================================
  
  activities: {
    // Upload de fichiers
    upload: {
      // Seuils normaux
      normal: {
        filesPerMinute: 2,
        filesPerHour: 20,
        totalSizeMB: 100,
        maxFileSizeMB: 50
      },
      
      // Seuils d'alerte
      warning: {
        filesPerMinute: 5,      // >5 fichiers/min = suspect
        filesPerHour: 50,       // >50 fichiers/h = suspect
        totalSizeMB: 500,       // >500MB/session = suspect
        maxFileSizeMB: 200      // >200MB/fichier = suspect
      },
      
      // Seuils critiques
      critical: {
        filesPerMinute: 10,     // >10 fichiers/min = critique
        filesPerHour: 100,      // >100 fichiers/h = critique
        totalSizeMB: 1000,      // >1GB/session = critique
        maxFileSizeMB: 500      // >500MB/fichier = critique
      },
      
      // Types de fichiers suspects
      suspiciousTypes: {
        executable: ['.exe', '.bat', '.cmd', '.scr', '.msi'],
        script: ['.js', '.php', '.py', '.sh', '.vbs'],
        archive: ['.zip', '.rar', '.7z', '.tar'],
        system: ['.dll', '.sys', '.ini', '.reg']
      }
    },
    
    // Connexions
    login: {
      normal: {
        attemptsPerMinute: 1,
        attemptsPerHour: 5,
        differentIPs: 1
      },
      
      warning: {
        failedAttempts: 5,      // >5 échecs = suspect
        attemptsPerMinute: 3,   // >3 tentatives/min = suspect
        differentIPs: 2         // >2 IPs différentes = suspect
      },
      
      critical: {
        failedAttempts: 10,     // >10 échecs = critique
        attemptsPerMinute: 10,  // >10 tentatives/min = critique
        differentIPs: 5         // >5 IPs différentes = critique
      },
      
      // Patterns suspects
      suspiciousPatterns: {
        bruteForce: {
          attempts: 20,
          timeWindowMinutes: 10
        },
        distributedAttack: {
          uniqueIPs: 10,
          timeWindowMinutes: 30
        }
      }
    },
    
    // Requêtes API
    api: {
      normal: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        sameEndpointPerMinute: 10
      },
      
      warning: {
        requestsPerMinute: 100,     // >100 req/min = suspect
        requestsPerHour: 2000,      // >2000 req/h = suspect
        sameEndpointPerMinute: 50   // >50 req même endpoint/min = suspect
      },
      
      critical: {
        requestsPerMinute: 300,     // >300 req/min = critique
        requestsPerHour: 5000,      // >5000 req/h = critique
        sameEndpointPerMinute: 100  // >100 req même endpoint/min = critique
      },
      
      // Endpoints sensibles
      sensitiveEndpoints: {
        admin: ['/admin', '/moderation', '/users'],
        data: ['/export', '/backup', '/download'],
        security: ['/auth', '/password', '/token']
      }
    },
    
    // Modifications de profil
    profile: {
      normal: {
        changesPerHour: 1,
        changesPerDay: 3
      },
      
      warning: {
        changesPerHour: 3,      // >3 modifs/h = suspect
        changesPerDay: 10       // >10 modifs/jour = suspect
      },
      
      critical: {
        changesPerHour: 10,     // >10 modifs/h = critique
        changesPerDay: 50       // >50 modifs/jour = critique
      },
      
      // Types de changements suspects
      suspiciousChanges: {
        rapidEmailChange: 3,    // 3 changements d'email/jour
        randomUsername: true,   // Nom d'utilisateur aléatoire
        massUpdate: 5           // 5+ champs modifiés simultanément
      }
    }
  },
  
  // ========================================
  // SEUILS TEMPORELS
  // ========================================
  
  temporal: {
    // Fenêtres de temps pour l'analyse
    windows: {
      immediate: 1,           // 1 minute - détection immédiate
      short: 5,               // 5 minutes - détection rapide
      medium: 30,             // 30 minutes - analyse de session
      long: 60,               // 1 heure - analyse comportementale
      daily: 1440             // 24 heures - analyse de tendance
    },
    
    // Heures suspectes (activité anormale)
    suspiciousHours: {
      nightTime: {
        start: 2,             // 2h du matin
        end: 6,               // 6h du matin
        riskMultiplier: 1.5   // Augmente le score de 50%
      },
      
      weekends: {
        enabled: false,       // Désactivé par défaut
        riskMultiplier: 1.2   // Augmente le score de 20%
      }
    },
    
    // Durées d'actions automatiques
    actionDurations: {
      temporaryBlock: 15,     // 15 minutes
      rateLimitStrict: 60,    // 1 heure
      userWarning: 1440,      // 24 heures (cooldown)
      suspension: 4320        // 3 jours
    }
  },
  
  // ========================================
  // SEUILS ADAPTATIFS
  // ========================================
  
  adaptive: {
    // Ajustement automatique des seuils
    autoAdjustment: {
      enabled: true,
      
      // Facteurs d'ajustement
      factors: {
        userAge: {
          newUser: 0.8,       // Seuils plus stricts pour nouveaux utilisateurs
          establishedUser: 1.2 // Seuils plus souples pour utilisateurs établis
        },
        
        userRole: {
          admin: 2.0,         // Seuils très souples pour admins
          moderator: 1.5,     // Seuils souples pour modérateurs
          user: 1.0           // Seuils normaux pour utilisateurs
        },
        
        timeOfDay: {
          businessHours: 1.0, // Seuils normaux (9h-17h)
          offHours: 0.8       // Seuils plus stricts hors heures
        },
        
        systemLoad: {
          low: 1.0,           // Seuils normaux
          medium: 0.9,        // Seuils légèrement plus stricts
          high: 0.7           // Seuils plus stricts sous charge
        }
      }
    },
    
    // Machine Learning (futur)
    ml: {
      enabled: false,
      modelConfidence: 0.8,   // Seuil de confiance minimum
      adaptationRate: 0.1     // Vitesse d'adaptation des seuils
    }
  }
};

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Obtenir le niveau de risque basé sur le score
 */
export function getRiskLevel(score) {
  const levels = RISK_THRESHOLDS.riskScore.levels;
  
  for (const [levelName, config] of Object.entries(levels)) {
    if (score >= config.min && score <= config.max) {
      return {
        name: levelName,
        ...config,
        score
      };
    }
  }
  
  return {
    name: 'unknown',
    label: 'Inconnu',
    color: '#6c757d',
    actions: [],
    description: 'Score de risque invalide'
  };
}

/**
 * Vérifier si une activité dépasse les seuils
 */
export function checkActivityThreshold(activityType, metric, value, level = 'warning') {
  try {
    const thresholds = RISK_THRESHOLDS.activities[activityType];
    if (!thresholds || !thresholds[level]) {
      return false;
    }
    
    const threshold = thresholds[level][metric];
    return threshold !== undefined && value > threshold;
    
  } catch (error) {
    console.error('❌ Erreur vérification seuil:', error);
    return false;
  }
}

/**
 * Calculer le multiplicateur adaptatif
 */
export function getAdaptiveMultiplier(userContext) {
  try {
    if (!RISK_THRESHOLDS.adaptive.autoAdjustment.enabled) {
      return 1.0;
    }
    
    const factors = RISK_THRESHOLDS.adaptive.autoAdjustment.factors;
    let multiplier = 1.0;
    
    // Facteur âge utilisateur
    if (userContext.isNewUser) {
      multiplier *= factors.userAge.newUser;
    } else {
      multiplier *= factors.userAge.establishedUser;
    }
    
    // Facteur rôle utilisateur
    const roleMultiplier = factors.userRole[userContext.role] || 1.0;
    multiplier *= roleMultiplier;
    
    // Facteur heure de la journée
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      multiplier *= factors.timeOfDay.businessHours;
    } else {
      multiplier *= factors.timeOfDay.offHours;
    }
    
    return Math.max(0.1, Math.min(3.0, multiplier)); // Limiter entre 0.1 et 3.0
    
  } catch (error) {
    console.error('❌ Erreur calcul multiplicateur adaptatif:', error);
    return 1.0;
  }
}

/**
 * Mettre à jour un seuil spécifique
 */
export function updateThreshold(path, value) {
  try {
    const keys = path.split('.');
    let current = RISK_THRESHOLDS;
    
    // Naviguer jusqu'à l'avant-dernière clé
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        throw new Error(`Chemin invalide: ${path}`);
      }
      current = current[keys[i]];
    }
    
    // Mettre à jour la valeur finale
    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    console.log(`✅ Seuil mis à jour: ${path} = ${value} (ancien: ${oldValue})`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur mise à jour seuil:', error);
    return false;
  }
}

/**
 * Valider la cohérence des seuils
 */
export function validateThresholds() {
  const errors = [];
  
  try {
    // Vérifier que les seuils sont croissants
    const activities = RISK_THRESHOLDS.activities;
    
    Object.entries(activities).forEach(([activityName, config]) => {
      if (config.normal && config.warning && config.critical) {
        Object.keys(config.normal).forEach(metric => {
          const normal = config.normal[metric];
          const warning = config.warning[metric];
          const critical = config.critical[metric];
          
          if (typeof normal === 'number' && typeof warning === 'number' && typeof critical === 'number') {
            if (!(normal < warning && warning < critical)) {
              errors.push(`${activityName}.${metric}: Les seuils doivent être croissants (normal < warning < critical)`);
            }
          }
        });
      }
    });
    
    // Vérifier les niveaux de risque
    const levels = RISK_THRESHOLDS.riskScore.levels;
    const sortedLevels = Object.values(levels).sort((a, b) => a.min - b.min);
    
    for (let i = 0; i < sortedLevels.length - 1; i++) {
      if (sortedLevels[i].max >= sortedLevels[i + 1].min) {
        errors.push(`Chevauchement des niveaux de risque: ${sortedLevels[i].label} et ${sortedLevels[i + 1].label}`);
      }
    }
    
  } catch (error) {
    errors.push(`Erreur de validation: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Exporter la configuration des seuils
 */
export function exportThresholds() {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0',
    thresholds: RISK_THRESHOLDS
  };
}

/**
 * Importer une configuration de seuils
 */
export function importThresholds(thresholdsData) {
  try {
    if (!thresholdsData.thresholds) {
      throw new Error('Format de seuils invalide');
    }
    
    // Valider avant d'importer
    const backup = JSON.parse(JSON.stringify(RISK_THRESHOLDS));
    Object.assign(RISK_THRESHOLDS, thresholdsData.thresholds);
    
    const validation = validateThresholds();
    if (!validation.isValid) {
      // Restaurer la sauvegarde en cas d'erreur
      Object.assign(RISK_THRESHOLDS, backup);
      throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
    }
    
    console.log('✅ Seuils importés avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import des seuils:', error);
    return false;
  }
}

export default RISK_THRESHOLDS;
