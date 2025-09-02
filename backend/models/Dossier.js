const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Dossier extends Model {}

Dossier.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true, // Les dossiers racine ont un parent_id nul
    references: {
      model: 'dossier',
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Dossier',
  tableName: 'dossier',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: (dossier, options) => {
      // Logique de validation si nécessaire
    }
  }
});


module.exports = Dossier;
