import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString()
    }
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'passwordresettokens',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['token'],
      unique: true
    },
    {
      fields: ['email']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// Méthode pour vérifier si le token est valide
PasswordResetToken.prototype.isValid = function() {
  return !this.used && new Date() < this.expires_at;
};

// Méthode pour marquer le token comme utilisé
PasswordResetToken.prototype.markAsUsed = async function() {
  this.used = true;
  await this.save();
};

export default PasswordResetToken;
