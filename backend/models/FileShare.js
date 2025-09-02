const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FileShare = sequelize.define('FileShare', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    file_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'files',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'app_users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    access_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'fileshares',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

module.exports = FileShare;
