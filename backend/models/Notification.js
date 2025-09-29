import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'system',
    validate: {
      isIn: [[
        'system', 
        'security', 
        'user_activity', 
        'file_activity', 
        'email', 
        'maintenance', 
        'backup', 
        'storage', 
        'error', 
        'success'
      ]]
    }
  },
  priority: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'normal',
    validate: {
      isIn: [['low', 'normal', 'high', 'urgent']]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'unread',
    validate: {
      isIn: [['unread', 'read', 'archived']]
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // null = notification pour tous les admins
    field: 'userid', // Force le nom de colonne en base
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },
  relatedEntityType: {
    type: DataTypes.STRING(50),
    allowNull: true, // 'file', 'user', 'message', etc.
    field: 'relatedentitytype' // Force le nom de colonne en base
  },
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'relatedentityid' // Force le nom de colonne en base
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true, // URL vers l'action à effectuer
    field: 'actionurl' // Force le nom de colonne en base
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at' // Force le nom de colonne en base
  },
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'archived_at' // Force le nom de colonne en base
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at' // Force le nom de colonne en base
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at' // Force le nom de colonne en base
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at' // Force le nom de colonne en base
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['userid', 'status']
    },
    {
      fields: ['type', 'priority']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['status', 'createdAt']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Méthodes d'instance
Notification.prototype.markAsRead = async function() {
  this.status = 'read';
  this.readAt = new Date();
  return await this.save();
};

Notification.prototype.archive = async function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return await this.save();
};

// Méthodes statiques
Notification.getUnreadCount = async function(userId = null) {
  const where = { status: 'unread' };
  if (userId) {
    where.userId = userId;
  }
  return await this.count({ where });
};

Notification.getByType = async function(type, options = {}) {
  const { limit = 50, offset = 0, userId = null } = options;
  
  const where = { type };
  if (userId) {
    where.userId = userId;
  }
  
  return await this.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Notification.createSystemNotification = async function(data) {
  return await this.create({
    type: 'system',
    title: data.title,
    message: data.message,
    priority: data.priority || 'normal',
    metadata: data.metadata || {},
    actionUrl: data.actionUrl || null,
    userId: data.userId || null
  });
};

Notification.createSecurityAlert = async function(data) {
  return await this.create({
    type: 'security',
    title: data.title,
    message: data.message,
    priority: 'high',
    metadata: {
      ...data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date()
    },
    userId: data.userId || null
  });
};

export default Notification;
