import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Type de message
  type: {
    type: DataTypes.ENUM('contact_received', 'email_sent', 'email_received', 'notification', 'alert'),
    allowNull: false,
    field: 'type',
  },
  // Informations du message
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'subject',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'content',
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'html_content',
  },
  // Expéditeur et destinataire
  senderEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'sender_email',
  },
  senderName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'sender_name',
  },
  recipientEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'recipient_email',
  },
  // Statut et métadonnées
  status: {
    type: DataTypes.ENUM('unread', 'read', 'replied', 'archived', 'deleted'),
    defaultValue: 'unread',
    field: 'status',
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    field: 'priority',
  },
  // Métadonnées techniques
  messageId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'message_id',
  },
  threadId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id',
    },
    field: 'thread_id',
  },
  replyTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id',
    },
    field: 'reply_to',
  },
  // Données supplémentaires
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'metadata',
  },
  // Dates
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  modelName: 'Message',
  tableName: 'messages',
  timestamps: false, // Géré manuellement avec les champs created_at/updated_at
});

// Méthodes d'instance
Message.prototype.markAsRead = async function() {
  this.status = 'read';
  this.readAt = new Date();
  return await this.save();
};

Message.prototype.markAsReplied = async function() {
  this.status = 'replied';
  return await this.save();
};

Message.prototype.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

// Méthodes statiques
Message.getUnreadCount = async function() {
  return await this.count({
    where: {
      status: 'unread'
    }
  });
};

Message.getByType = async function(type, options = {}) {
  return await this.findAll({
    where: {
      type: type,
      ...options.where
    },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Message.getContactMessages = async function(options = {}) {
  return await this.getByType('contact_received', options);
};

Message.getSentEmails = async function(options = {}) {
  return await this.getByType('email_sent', options);
};

Message.getNotifications = async function(options = {}) {
  return await this.findAll({
    where: {
      type: ['notification', 'alert'],
      ...options.where
    },
    order: [['created_at', 'DESC']],
    ...options
  });
};

export default Message;
