import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserSession = sequelize.define('UserSession', {
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
  ipAddress: {
    type: DataTypes.INET,
    allowNull: false,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
  },
  browser: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  browserVersion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'browser_version',
  },
  os: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  device: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  countryCode: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'country_code',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  isp: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  sessionStart: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'session_start',
  },
  sessionEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'session_end',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  isSuspicious: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_suspicious',
  },
  suspiciousReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'suspicious_reason',
  },
}, {
  modelName: 'UserSession',
  tableName: 'usersessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default UserSession;
