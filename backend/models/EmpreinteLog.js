import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const EmpreinteLog = sequelize.define('EmpreinteLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['view_all', 'view_details', 'view_stats', 'export', 'view_user_empreintes']]
    }
  },
  empreinte_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'empreintes',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  target_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'utilisateur',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Données supplémentaires (filtres, nombre de résultats, etc.)'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'empreintelogs',
  timestamps: false,
  indexes: [
    { fields: ['admin_id'] },
    { fields: ['action'] },
    { fields: ['target_user_id'] },
    { fields: ['created_at'] }
  ]
});

// Méthode statique pour logger une action admin
EmpreinteLog.logAction = async function(adminId, action, options = {}) {
  const {
    empreinteId = null,
    targetUserId = null,
    metadata = null,
    ipAddress = null,
    userAgent = null
  } = options;

  try {
    await this.create({
      admin_id: adminId,
      action,
      empreinte_id: empreinteId,
      target_user_id: targetUserId,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('❌ [ADMIN LOG] Erreur lors du logging:', error);
    // Ne pas bloquer l'action si le log échoue
  }
};

export default EmpreinteLog;
