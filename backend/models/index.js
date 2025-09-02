const { sequelize } = require('../config/database');
const Utilisateur = require('./Utilisateur');
const File = require('./File');
const Certificate = require('./Certificate');
const Dossier = require('./Dossier');
const ActivityLog = require('./ActivityLog');
const FileShare = require('./FileShare');

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

File.hasMany(Certificate, {
  foreignKey: 'root_file_id',
  as: 'fileCertificates'  // Tous les certificats pour ce fichier
});

// 4. Relations Certificat
Certificate.belongsTo(File, {
  foreignKey: 'root_file_id',
  as: 'certificateFile'  // Le fichier associé à ce certificat
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

module.exports = {
  sequelize,
  Utilisateur,
  File,
  Certificate,
  Dossier,
  ActivityLog,
  FileShare
};
