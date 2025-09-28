import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const MessageAttachment = sequelize.define('MessageAttachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  messageId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Messages',
      key: 'id',
    },
    field: 'message_id',
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'filename',
  },
  fileUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_url',
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mimetype',
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'size',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  modelName: 'MessageAttachment',
  tableName: 'messageattachments',
  timestamps: false, // Pas de updated_at pour les pièces jointes
});

// Méthodes d'instance
MessageAttachment.prototype.getFormattedSize = function() {
  if (!this.size) return 'Taille inconnue';
  
  const bytes = parseInt(this.size);
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Byte';
  
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

MessageAttachment.prototype.isImage = function() {
  return this.mimetype && this.mimetype.startsWith('image/');
};

MessageAttachment.prototype.isPDF = function() {
  return this.mimetype === 'application/pdf';
};

MessageAttachment.prototype.getFileType = function() {
  if (this.isImage()) return 'image';
  if (this.isPDF()) return 'pdf';
  if (this.mimetype && this.mimetype.startsWith('text/')) return 'text';
  if (this.mimetype && this.mimetype.includes('document')) return 'document';
  return 'file';
};

export default MessageAttachment;
