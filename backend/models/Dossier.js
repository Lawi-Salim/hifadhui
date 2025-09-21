import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

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
  name_original: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: true, // NULL pour le dossier système
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true, // Les dossiers racine ont un parent_id nul
    references: {
      model: 'dossier',
      key: 'id',
    },
  },
  is_system_root: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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

// Méthode statique pour récupérer le dossier racine système
Dossier.getSystemRoot = async function() {
  let systemRoot = await Dossier.findOne({
    where: { is_system_root: true }
  });
  
  if (!systemRoot) {
    // Créer le dossier système s'il n'existe pas
    systemRoot = await Dossier.create({
      name: 'Hifadhui',
      name_original: 'Hifadhui',
      owner_id: null,
      parent_id: null,
      is_system_root: true
    });
  }
  
  return systemRoot;
};

// Méthode d'instance pour construire le chemin hiérarchique complet
Dossier.prototype.getFullPath = async function() {
  const path = [];
  let currentDossier = this;
  
  while (currentDossier) {
    // Utiliser name_original pour l'affichage, sinon name
    const displayName = currentDossier.name_original || currentDossier.name;
    path.unshift(displayName);
    
    if (currentDossier.parent_id) {
      currentDossier = await Dossier.findByPk(currentDossier.parent_id);
    } else {
      break;
    }
  }
  
  return path.join('/');
};

export default Dossier;
