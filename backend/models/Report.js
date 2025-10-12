import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  reporter_id: {
    type: DataTypes.UUID,
    allowNull: true, // Peut être null pour les signalements anonymes
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  reported_user_id: {
    type: DataTypes.UUID,
    allowNull: true, // Permet null pour les signalements système (ex: tentatives de connexion)
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  file_id: {
    type: DataTypes.UUID,
    allowNull: true, // Peut être null si le signalement ne concerne pas un fichier spécifique
    references: {
      model: 'File',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('inappropriate', 'spam', 'copyright', 'harassment', 'failed_login_attempts', 'other'),
    allowNull: false,
    defaultValue: 'inappropriate'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: true, // Null tant qu'aucun admin n'a traité le signalement
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  admin_action: {
    type: DataTypes.TEXT,
    allowNull: true // Description de l'action prise par l'admin
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  source: {
    type: DataTypes.ENUM('manual', 'automatic'),
    allowNull: false,
    defaultValue: 'manual'
  },
  evidence: {
    type: DataTypes.TEXT, // JSON stringifié contenant les preuves du signalement automatique
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  modelName: 'Report',
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true, // Utilise snake_case pour les noms de colonnes
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['source']
    },
    {
      fields: ['reported_user_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['source', 'created_at']
    }
  ]
});

export default Report;
