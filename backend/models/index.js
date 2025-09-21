import { sequelize } from '../config/database.js';
import Utilisateur from './Utilisateur.js';
import File from './File.js';
import Dossier from './Dossier.js';
import ActivityLog from './ActivityLog.js';
import FileShare from './FileShare.js';
import PasswordResetToken from './PasswordResetToken.js';

// Définition des associations

// 1. Relations Utilisateur
Utilisateur.hasMany(File, {
  foreignKey: 'owner_id',
  as: 'userFiles'  // Tous les fichiers de l'utilisateur
});

Utilisateur.hasMany(Dossier, {
  foreignKey: 'owner_id',
  as: 'userDossiers'  // Tous les dossiers de l'utilisateur
});

Utilisateur.hasMany(ActivityLog, {
  foreignKey: 'userId',
  as: 'userActivities'
});

Utilisateur.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'userPasswordResetTokens'
});

// 2. Relations Dossier
Dossier.belongsTo(Utilisateur, {
  foreignKey: 'owner_id',
  as: 'dossierUser'  // L'utilisateur propriétaire du dossier
});

Dossier.hasMany(File, {
  foreignKey: 'dossier_id',
  as: 'dossierFiles'  // Tous les fichiers dans ce dossier
});

// Associations hiérarchiques pour Dossier (auto-référencement)
Dossier.hasMany(Dossier, { 
  as: 'subDossiers', 
  foreignKey: 'parent_id', 
  onDelete: 'CASCADE' 
});
Dossier.belongsTo(Dossier, { 
  as: 'parentDossier', 
  foreignKey: 'parent_id' 
});

// 3. Relations Fichier
File.belongsTo(Utilisateur, {
  foreignKey: 'owner_id',
  as: 'fileUser'  // L'utilisateur propriétaire du fichier
});

File.belongsTo(Dossier, {
  foreignKey: 'dossier_id',
  as: 'fileDossier'  // Le dossier contenant le fichier
});


// 5. Relations ActivityLog
ActivityLog.belongsTo(Utilisateur, {
  foreignKey: 'userId',
  as: 'user'
});

// 6. Relations FileShare
Utilisateur.hasMany(FileShare, {
  foreignKey: 'created_by',
  as: 'userShares'
});

File.hasMany(FileShare, {
  foreignKey: 'file_id',
  as: 'fileShares'
});

FileShare.belongsTo(Utilisateur, {
  foreignKey: 'created_by',
  as: 'creator'
});

FileShare.belongsTo(File, {
  foreignKey: 'file_id',
  as: 'file'
});

// 7. Relations PasswordResetToken
PasswordResetToken.belongsTo(Utilisateur, {
  foreignKey: 'user_id',
  as: 'user'
});

export {
  sequelize,
  Utilisateur,
  File,
  Dossier,
  ActivityLog,
  FileShare,
  PasswordResetToken
};
