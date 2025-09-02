const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Utilisateur',
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
  tableName: 'activitylogs',
  timestamps: false, // géré par la base de données
});


module.exports = ActivityLog;
