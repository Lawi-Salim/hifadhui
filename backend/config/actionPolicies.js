/**
 * Politiques d'Action Automatique
 * Définit les règles et politiques pour les actions de modération automatique
 */

export const ACTION_POLICIES = {
  
  // ========================================
  // POLITIQUES GÉNÉRALES
  // ========================================
  
  general: {
    // Activation globale du système
    enabled: true,
    
    // Mode de fonctionnement
    mode: 'automatic', // 'automatic', 'semi-automatic', 'manual'
    
    // Délai avant action automatique (secondes)
    actionDelay: 30,
    
    // Confirmation requise pour actions critiques
    requireConfirmation: {
      suspension: false,    // Suspension automatique sans confirmation
      deletion: true,       // Suppression nécessite confirmation
      permanent: true       // Actions permanentes nécessitent confirmation
    },
    
    // Logging des actions
    logging: {
      enabled: true,
      level: 'detailed',    // 'basic', 'detailed', 'verbose'
      retention: 90         // Jours de rétention des logs
    }
  },
  
  // ========================================
  // POLITIQUES PAR TYPE D'ACTION
  // ========================================
  
  actions: {
    // Surveillance renforcée
    enhanced_monitoring: {
      enabled: true,
      automatic: true,
      
      triggers: {
        riskScore: 20,
        duration: 60,         // Minutes de surveillance renforcée
        escalateAfter: 120    // Escalader après 2h si score reste élevé
      },
      
      effects: {
        logLevel: 'detailed',
        trackingInterval: 30, // Secondes entre vérifications
        alertThreshold: 0.8   // Seuil pour alertes supplémentaires
      }
    },
    
    // Limitation de débit (Rate Limiting)
    rate_limiting: {
      enabled: true,
      automatic: true,
      
      triggers: {
        riskScore: 40,
        apiAbuse: true,
        uploadAbuse: true
      },
      
      levels: {
        light: {
          requestsPerMinute: 50,
          uploadPerMinute: 3,
          duration: 30          // Minutes
        },
        
        moderate: {
          requestsPerMinute: 20,
          uploadPerMinute: 1,
          duration: 60
        },
        
        strict: {
          requestsPerMinute: 5,
          uploadPerMinute: 0,   // Pas d'upload autorisé
          duration: 120
        }
      },
      
      escalation: {
        enabled: true,
        steps: ['light', 'moderate', 'strict'],
        intervalMinutes: 30
      }
    },
    
    // Avertissement utilisateur
    user_warning: {
      enabled: true,
      automatic: true,
      
      triggers: {
        riskScore: 40,
        firstOffense: true
      },
      
      templates: {
        upload_abuse: {
          title: 'Activité d\'upload suspecte détectée',
          message: 'Nous avons détecté une activité d\'upload inhabituelle sur votre compte. Veuillez respecter nos conditions d\'utilisation.',
          severity: 'warning'
        },
        
        api_abuse: {
          title: 'Utilisation excessive de l\'API',
          message: 'Votre compte effectue trop de requêtes. Veuillez ralentir votre activité pour éviter une suspension.',
          severity: 'warning'
        },
        
        login_abuse: {
          title: 'Tentatives de connexion suspectes',
          message: 'Plusieurs tentatives de connexion échouées ont été détectées. Vérifiez vos identifiants.',
          severity: 'info'
        },
        
        general_suspicious: {
          title: 'Activité suspecte détectée',
          message: 'Votre compte présente une activité inhabituelle. Veuillez respecter nos conditions d\'utilisation.',
          severity: 'warning'
        }
      },
      
      cooldown: {
        sameType: 60,         // Minutes entre avertissements du même type
        anyType: 30           // Minutes entre tout type d'avertissement
      },
      
      escalation: {
        maxWarnings: 3,       // Max avertissements avant escalade
        timeWindow: 1440,     // Fenêtre de 24h
        nextAction: 'temporary_suspension'
      }
    },
    
    // Suspension temporaire
    temporary_suspension: {
      enabled: true,
      automatic: true,
      
      triggers: {
        riskScore: 70,
        repeatedWarnings: 3,
        criticalBehavior: true
      },
      
      durations: {
        first: 60,            // 1 heure pour première suspension
        second: 360,          // 6 heures pour deuxième
        third: 1440,          // 24 heures pour troisième
        subsequent: 4320      // 3 jours pour suivantes
      },
      
      conditions: {
        gracePeriod: 15,      // Minutes avant activation
        appealAllowed: true,  // Possibilité de faire appel
        autoReview: 24        // Révision automatique après 24h
      },
      
      effects: {
        blockLogin: true,
        blockUpload: true,
        blockDownload: false, // Permettre le téléchargement
        blockProfileEdit: true
      }
    },
    
    // Blocage immédiat
    immediate_block: {
      enabled: true,
      automatic: false,     // Nécessite confirmation manuelle
      
      triggers: {
        riskScore: 90,
        securityThreat: true,
        malwareDetected: true
      },
      
      duration: 1440,       // 24 heures par défaut
      
      effects: {
        blockAll: true,      // Bloquer toutes les actions
        freezeAccount: true, // Geler le compte
        alertSecurity: true  // Alerter l'équipe sécurité
      },
      
      review: {
        required: true,
        timeframe: 4,        // Heures pour révision manuelle
        escalateAfter: 8     // Escalader si pas de révision
      }
    },
    
    // Suppression de contenu
    content_removal: {
      enabled: true,
      automatic: false,    // Toujours manuel
      
      triggers: {
        malwareDetected: true,
        copyrightViolation: true,
        illegalContent: true
      },
      
      types: {
        quarantine: {
          duration: 72,      // Heures en quarantaine
          reviewRequired: true
        },
        
        deletion: {
          backupFirst: true,
          confirmationRequired: true,
          logDetails: true
        }
      }
    }
  },
  
  // ========================================
  // POLITIQUES D'ESCALADE
  // ========================================
  
  escalation: {
    enabled: true,
    
    // Règles d'escalade automatique
    rules: [
      {
        name: 'repeated_violations',
        condition: {
          violations: 3,
          timeWindow: 1440,    // 24 heures
          sameType: true
        },
        action: 'temporary_suspension',
        duration: 4320         // 3 jours
      },
      
      {
        name: 'rapid_score_increase',
        condition: {
          scoreIncrease: 50,
          timeWindow: 30       // 30 minutes
        },
        action: 'immediate_review',
        priority: 'high'
      },
      
      {
        name: 'multiple_users_same_ip',
        condition: {
          usersCount: 5,
          sameIP: true,
          timeWindow: 60
        },
        action: 'ip_investigation',
        alertSecurity: true
      },
      
      {
        name: 'system_overload',
        condition: {
          systemLoad: 90,      // % de charge système
          concurrentAlerts: 10
        },
        action: 'emergency_mode',
        restrictNewUsers: true
      }
    ],
    
    // Délais d'escalade
    delays: {
      warning_to_suspension: 60,    // Minutes
      suspension_to_review: 1440,   // Minutes (24h)
      review_to_action: 240         // Minutes (4h)
    }
  },
  
  // ========================================
  // POLITIQUES DE RÉVISION
  // ========================================
  
  review: {
    // Révision automatique
    automatic: {
      enabled: true,
      
      schedules: {
        daily: {
          time: '02:00',       // 2h du matin
          actions: ['cleanup_expired', 'review_pending']
        },
        
        weekly: {
          day: 'sunday',
          time: '03:00',
          actions: ['performance_review', 'threshold_adjustment']
        }
      },
      
      criteria: {
        expiredSuspensions: true,
        lowRiskUsers: true,
        falsePositives: true
      }
    },
    
    // Révision manuelle
    manual: {
      required: [
        'permanent_suspension',
        'account_deletion',
        'ip_ban',
        'security_incident'
      ],
      
      timeframes: {
        critical: 2,         // Heures pour cas critiques
        high: 8,             // Heures pour priorité haute
        medium: 24,          // Heures pour priorité moyenne
        low: 72              // Heures pour priorité basse
      },
      
      escalation: {
        noResponse: 'auto_approve', // ou 'auto_reject'
        conflictResolution: 'senior_admin'
      }
    }
  },
  
  // ========================================
  // POLITIQUES D'EXCEPTION
  // ========================================
  
  exceptions: {
    // Utilisateurs exemptés
    exemptUsers: {
      admins: true,
      moderators: true,
      trustedUsers: false,   // Liste manuelle
      verifiedUsers: false
    },
    
    // Conditions d'exemption
    conditions: {
      accountAge: 365,       // Jours - comptes anciens
      goodStanding: true,    // Pas de violations récentes
      verificationLevel: 'high'
    },
    
    // IPs de confiance
    trustedIPs: {
      enabled: true,
      ranges: [
        // Exemple: bureaux de l'entreprise
        // '192.168.1.0/24',
        // '10.0.0.0/8'
      ],
      autoDetect: false      // Détection automatique des IPs récurrentes
    }
  },
  
  // ========================================
  // POLITIQUES DE NOTIFICATION
  // ========================================
  
  notifications: {
    // Notifications utilisateur
    user: {
      enabled: true,
      
      channels: ['email', 'in_app'],
      
      events: {
        warning_issued: true,
        suspension_applied: true,
        suspension_lifted: true,
        account_reviewed: true
      },
      
      templates: {
        language: 'fr',
        personalized: true,
        includeAppealProcess: true
      }
    },
    
    // Notifications admin
    admin: {
      enabled: true,
      
      channels: ['email', 'dashboard', 'slack'],
      
      events: {
        high_risk_user: true,
        automatic_action: true,
        review_required: true,
        system_alert: true
      },
      
      urgency: {
        immediate: ['security_threat', 'system_overload'],
        high: ['multiple_violations', 'escalation'],
        medium: ['automatic_action', 'review_due'],
        low: ['daily_summary', 'statistics']
      }
    }
  }
};

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Obtenir la politique pour une action spécifique
 */
export function getActionPolicy(actionType) {
  return ACTION_POLICIES.actions[actionType] || null;
}

/**
 * Vérifier si une action est autorisée
 */
export function isActionAllowed(actionType, context = {}) {
  try {
    const policy = getActionPolicy(actionType);
    if (!policy || !policy.enabled) {
      return false;
    }
    
    // Vérifier les exemptions
    if (isUserExempt(context.userId, context.userRole)) {
      return false;
    }
    
    // Vérifier les conditions de déclenchement
    if (policy.triggers) {
      return checkTriggers(policy.triggers, context);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur vérification autorisation action:', error);
    return false;
  }
}

/**
 * Vérifier si un utilisateur est exempté
 */
export function isUserExempt(userId, userRole) {
  try {
    const exemptions = ACTION_POLICIES.exceptions.exemptUsers;
    
    // Vérifier par rôle
    if (userRole === 'admin' && exemptions.admins) return true;
    if (userRole === 'moderator' && exemptions.moderators) return true;
    
    // TODO: Vérifier les listes manuelles et conditions
    
    return false;
    
  } catch (error) {
    console.error('❌ Erreur vérification exemption:', error);
    return false;
  }
}

/**
 * Vérifier les conditions de déclenchement
 */
export function checkTriggers(triggers, context) {
  try {
    // Vérifier le score de risque
    if (triggers.riskScore && context.riskScore < triggers.riskScore) {
      return false;
    }
    
    // Vérifier les conditions spécifiques
    if (triggers.apiAbuse && !context.apiAbuse) return false;
    if (triggers.uploadAbuse && !context.uploadAbuse) return false;
    if (triggers.firstOffense && context.previousViolations > 0) return false;
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur vérification déclencheurs:', error);
    return false;
  }
}

/**
 * Obtenir la durée d'une action
 */
export function getActionDuration(actionType, context = {}) {
  try {
    const policy = getActionPolicy(actionType);
    if (!policy) return 0;
    
    // Actions avec durées multiples
    if (policy.durations) {
      const violationCount = context.previousViolations || 0;
      
      if (violationCount === 0) return policy.durations.first || policy.durations.default;
      if (violationCount === 1) return policy.durations.second || policy.durations.default;
      if (violationCount === 2) return policy.durations.third || policy.durations.default;
      
      return policy.durations.subsequent || policy.durations.default;
    }
    
    // Durée simple
    return policy.duration || 0;
    
  } catch (error) {
    console.error('❌ Erreur calcul durée action:', error);
    return 0;
  }
}

/**
 * Obtenir le template de message pour une action
 */
export function getActionTemplate(actionType, subType = 'general_suspicious') {
  try {
    const policy = getActionPolicy(actionType);
    if (!policy || !policy.templates) return null;
    
    return policy.templates[subType] || policy.templates.general_suspicious || null;
    
  } catch (error) {
    console.error('❌ Erreur récupération template:', error);
    return null;
  }
}

/**
 * Vérifier si une escalade est nécessaire
 */
export function shouldEscalate(context) {
  try {
    const rules = ACTION_POLICIES.escalation.rules;
    
    for (const rule of rules) {
      if (checkEscalationRule(rule, context)) {
        return {
          shouldEscalate: true,
          rule: rule.name,
          action: rule.action,
          priority: rule.priority || 'medium'
        };
      }
    }
    
    return { shouldEscalate: false };
    
  } catch (error) {
    console.error('❌ Erreur vérification escalade:', error);
    return { shouldEscalate: false };
  }
}

/**
 * Vérifier une règle d'escalade spécifique
 */
function checkEscalationRule(rule, context) {
  try {
    const condition = rule.condition;
    
    // Vérifier les violations répétées
    if (condition.violations && context.violationsCount >= condition.violations) {
      return true;
    }
    
    // Vérifier l'augmentation rapide du score
    if (condition.scoreIncrease && context.scoreIncrease >= condition.scoreIncrease) {
      return true;
    }
    
    // Vérifier les utilisateurs multiples même IP
    if (condition.usersCount && context.sameIPUsers >= condition.usersCount) {
      return true;
    }
    
    // Vérifier la charge système
    if (condition.systemLoad && context.systemLoad >= condition.systemLoad) {
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erreur vérification règle escalade:', error);
    return false;
  }
}

/**
 * Mettre à jour une politique
 */
export function updatePolicy(path, value) {
  try {
    const keys = path.split('.');
    let current = ACTION_POLICIES;
    
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
    
    console.log(`✅ Politique mise à jour: ${path} = ${value} (ancienne: ${oldValue})`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur mise à jour politique:', error);
    return false;
  }
}

/**
 * Exporter les politiques
 */
export function exportPolicies() {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0',
    policies: ACTION_POLICIES
  };
}

export default ACTION_POLICIES;
