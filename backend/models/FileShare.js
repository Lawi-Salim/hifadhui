import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

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
        model: 'file',
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
        model: 'utilisateur',
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
    tableName: 'FileShares',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

export default FileShare;
