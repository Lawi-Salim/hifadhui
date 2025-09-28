import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Permet null pour les tentatives d'inscription échouées
    references: {
      model: 'utilisateur',
      key: 'id',
    },
    field: 'user_id',
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'action_type',
  },
  details: {
    type: DataTypes.JSONB,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  modelName: 'ActivityLog',
  tableName: 'activitylogs',
  timestamps: false, // géré par la base de données
});


export default ActivityLog;
