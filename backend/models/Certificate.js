import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  root_file_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'file',
      key: 'id'
    }
  },
  pdf_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  date_generated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'certificate',
  timestamps: true,
  createdAt: 'date_generated',
  updatedAt: 'updated_at'
});

export default Certificate;
