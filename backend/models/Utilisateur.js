import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const Utilisateur = sequelize.define('Utilisateur', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // NULL pour utilisateurs OAuth
    validate: {
      len: [6, 255],
      // Validation conditionnelle : password requis si provider = 'local'
      isValidPassword(value) {
        if (this.provider === 'local' && !value) {
          throw new Error('Le mot de passe est requis pour les comptes locaux');
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  // Colonnes OAuth
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook'),
    defaultValue: 'local',
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  // Colonnes pour la période de grâce (soft delete)
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de demande de suppression'
  },
  deletion_scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date programmée de suppression définitive'
  },
  recovery_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'Token pour récupération du compte'
  },
  recovery_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration du token de récupération'
  },
  // Abonnement et quotas d'upload
  subscription_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'free',
    comment: 'Type d\'abonnement: free, premium, etc.'
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin d\'abonnement premium (optionnel)'
  },
  upload_max_file_size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Taille max par fichier en octets (override du plan)'
  },
  upload_max_files_per_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Nombre max d\'uploads par jour (override du plan)'
  }
}, {
  modelName: 'Utilisateur',
  tableName: 'utilisateur',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Méthode pour vérifier le mot de passe
Utilisateur.prototype.validatePassword = async function(password) {
  if (!this.password) {
    return false; // Utilisateur OAuth sans mot de passe
  }
  return await bcrypt.compare(password, this.password);
};

// Méthode pour vérifier si l'utilisateur peut se connecter avec un mot de passe
Utilisateur.prototype.canLoginWithPassword = function() {
  return this.provider === 'local' && this.password;
};

// Méthode pour obtenir les données publiques de l'utilisateur
Utilisateur.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.google_id; // Ne pas exposer l'ID Google
  // Garder subscription_type pour afficher le plan dans le frontend
  return values;
};

// Méthode pour savoir si l'utilisateur est premium (en tenant compte d'une éventuelle expiration)
Utilisateur.prototype.isPremium = function() {
  if (this.subscription_type !== 'premium') {
    return false;
  }
  if (this.subscription_expires_at && new Date() > this.subscription_expires_at) {
    return false;
  }
  return true;
};

// Méthode statique pour trouver ou créer un utilisateur Google
Utilisateur.findOrCreateGoogleUser = async function(profile, shouldCreate = true) {
  const { id: googleId, displayName, emails, photos } = profile;
  const email = emails[0].value;
  const avatarUrl = photos && photos[0] ? photos[0].value : null;

  // Chercher d'abord par google_id
  let user = await this.findOne({ where: { google_id: googleId } });
  
  if (user) {
    // Vérifier si le compte est marqué pour suppression
    if (user.isMarkedForDeletion()) {
      const daysRemaining = user.getDaysUntilDeletion();
      throw new Error(`ACCOUNT_MARKED_FOR_DELETION:${daysRemaining}:${user.deletion_scheduled_at}`);
    }
    
    // Utilisateur Google existant - mettre à jour les infos si nécessaire
    await user.update({
      avatar_url: avatarUrl,
      is_email_verified: true
    });
    return { user, isNewAccount: false, wasLinked: false };
  }

  // Chercher par email pour lier un compte existant
  user = await this.findOne({ where: { email } });
  
  if (user) {
    // Vérifier si le compte est marqué pour suppression
    if (user.isMarkedForDeletion()) {
      const daysRemaining = user.getDaysUntilDeletion();
      throw new Error(`ACCOUNT_MARKED_FOR_DELETION:${daysRemaining}:${user.deletion_scheduled_at}`);
    }
    
    // Lier le compte Google au compte existant
    await user.update({
      google_id: googleId,
      provider: 'google',
      avatar_url: avatarUrl,
      is_email_verified: true
    });
    return { user, isNewAccount: false, wasLinked: true };
  }

  // Si l'utilisateur n'existe pas et qu'on ne doit pas créer de compte
  if (!shouldCreate) {
    return { user: null, isNewAccount: true, wasLinked: false };
  }

  // Créer un nouveau compte Google
  user = await this.create({
    username: displayName || email.split('@')[0],
    email,
    google_id: googleId,
    provider: 'google',
    avatar_url: avatarUrl,
    is_email_verified: true,
    role: 'user'
  });

  return { user, isNewAccount: true, wasLinked: false };
};

// ===== MÉTHODES POUR LA PÉRIODE DE GRÂCE =====

// Méthode pour marquer un compte pour suppression (soft delete)
Utilisateur.prototype.markForDeletion = async function(gracePeriodDays = 14) {
  const { v4: uuidv4 } = await import('uuid');
  
  const now = new Date();
  const deletionDate = new Date(now.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
  const recoveryTokenExpires = new Date(now.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
  
  await this.update({
    deleted_at: now,
    deletion_scheduled_at: deletionDate,
    recovery_token: uuidv4(),
    recovery_token_expires_at: recoveryTokenExpires
  });
  
  return {
    recoveryToken: this.recovery_token,
    deletionScheduledAt: this.deletion_scheduled_at,
    gracePeriodDays
  };
};

// Méthode pour récupérer un compte marqué pour suppression
Utilisateur.prototype.recoverAccount = async function() {
  if (!this.deleted_at) {
    throw new Error('Ce compte n\'est pas marqué pour suppression');
  }
  
  if (this.recovery_token_expires_at && new Date() > this.recovery_token_expires_at) {
    throw new Error('Le délai de récupération a expiré');
  }
  
  await this.update({
    deleted_at: null,
    deletion_scheduled_at: null,
    recovery_token: null,
    recovery_token_expires_at: null
  });
  
  return true;
};

// Méthode statique pour trouver un compte par token de récupération
Utilisateur.findByRecoveryToken = async function(token) {
  return await this.findOne({
    where: {
      recovery_token: token,
      deleted_at: { [Op.ne]: null }, // Compte marqué pour suppression
      recovery_token_expires_at: { [Op.gt]: new Date() } // Token non expiré
    }
  });
};

// Méthode pour vérifier si le compte est marqué pour suppression
Utilisateur.prototype.isMarkedForDeletion = function() {
  return this.deleted_at !== null;
};

// Méthode pour obtenir le nombre de jours restants avant suppression définitive
Utilisateur.prototype.getDaysUntilDeletion = function() {
  if (!this.deletion_scheduled_at) return null;
  
  const now = new Date();
  const deletionDate = new Date(this.deletion_scheduled_at);
  const diffTime = deletionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Méthode statique pour obtenir les comptes à supprimer définitivement
Utilisateur.getAccountsToDelete = async function() {
  return await this.findAll({
    where: {
      deleted_at: { [Op.ne]: null },
      deletion_scheduled_at: { [Op.lte]: new Date() }
    }
  });
};

export default Utilisateur;
