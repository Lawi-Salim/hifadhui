import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ModerationAction = sequelize.define('ModerationAction', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  report_id: {
    type: DataTypes.UUID,
    allowNull: true, // Peut être null si l'action n'est pas liée à un signalement
    references: {
      model: 'Reports',
      key: 'id'
    }
  },
  action_type: {
    type: DataTypes.ENUM('warning', 'suspension', 'deletion', 'content_removal'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true // En jours, null pour les actions permanentes
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true // Calculé automatiquement pour les suspensions
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true // Données supplémentaires (ex: fichiers supprimés, etc.)
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
  modelName: 'ModerationAction',
  tableName: 'moderationactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true, // Utilise snake_case pour les noms de colonnes
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    }
  ],
  hooks: {
    beforeCreate: (action) => {
      // Calculer la date de fin pour les suspensions
      if (action.action_type === 'suspension' && action.duration) {
        const endDate = new Date(action.start_date);
        endDate.setDate(endDate.getDate() + action.duration);
        action.end_date = endDate;
      }
    },
    beforeUpdate: (action) => {
      // Vérifier si une suspension est expirée
      if (action.action_type === 'suspension' && action.end_date && new Date() > action.end_date) {
        action.is_active = false;
      }
    }
  }
});

export default ModerationAction;
