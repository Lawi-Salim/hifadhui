import { sequelize } from '../config/database.js';
import Utilisateur from './Utilisateur.js';
import File from './File.js';
import Dossier from './Dossier.js';
import ActivityLog from './ActivityLog.js';
import PasswordResetToken from './PasswordResetToken.js';
import UserSession from './UserSession.js';
import Message from './Message.js';
import MessageAttachment from './MessageAttachment.js';
import Notification from './Notification.js';
import Report from './Report.js';
import ModerationAction from './ModerationAction.js';
import Empreinte from './Empreinte.js';
import EmpreinteLog from './EmpreinteLog.js';

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

Utilisateur.hasMany(UserSession, {
  foreignKey: 'userId',
  as: 'userSessions'
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

// Relations File <-> Empreinte
File.hasOne(Empreinte, {
  foreignKey: 'file_id',
  as: 'empreinte',
  onDelete: 'CASCADE'
});

Empreinte.belongsTo(File, {
  foreignKey: 'file_id',
  as: 'file'
});

Empreinte.belongsTo(Utilisateur, {
  foreignKey: 'owner_id',
  as: 'owner'
});

Utilisateur.hasMany(Empreinte, {
  foreignKey: 'owner_id',
  as: 'empreintes'
});

// Relations EmpreinteLog
EmpreinteLog.belongsTo(Utilisateur, {
  foreignKey: 'admin_id',
  as: 'admin'
});

EmpreinteLog.belongsTo(Utilisateur, {
  foreignKey: 'target_user_id',
  as: 'targetUser'
});

EmpreinteLog.belongsTo(Empreinte, {
  foreignKey: 'empreinte_id',
  as: 'empreinte'
});

// 5. Relations ActivityLog
ActivityLog.belongsTo(Utilisateur, {
  foreignKey: 'userId',
  as: 'user'
});

// 6. Relations PasswordResetToken
PasswordResetToken.belongsTo(Utilisateur, {
  foreignKey: 'user_id',
  as: 'user'
});

// 7. Relations UserSession
UserSession.belongsTo(Utilisateur, {
  foreignKey: 'userId',
  as: 'user'
});

// 8. Relations Messages
Message.hasMany(MessageAttachment, {
  foreignKey: 'messageId',
  as: 'attachments'
});

MessageAttachment.belongsTo(Message, {
  foreignKey: 'messageId',
  as: 'message'
});

// Relations auto-référentielles pour les threads et réponses
Message.hasMany(Message, {
  foreignKey: 'threadId',
  as: 'threadMessages'
});

Message.belongsTo(Message, {
  foreignKey: 'threadId',
  as: 'thread'
});

Message.hasMany(Message, {
  foreignKey: 'replyTo',
  as: 'replies'
});

Message.belongsTo(Message, {
  foreignKey: 'replyTo',
  as: 'originalMessage'
});

// 8. Relations Notification
Notification.belongsTo(Utilisateur, {
  foreignKey: 'userId',
  as: 'user'
});

Utilisateur.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

// 9. Relations Report
Report.belongsTo(Utilisateur, {
  foreignKey: 'reporter_id',
  as: 'reporter'
});

Report.belongsTo(Utilisateur, {
  foreignKey: 'reported_user_id',
  as: 'reportedUser'
});
Report.belongsTo(File, {
  foreignKey: 'file_id',
  as: 'reportedFile'
});

Report.belongsTo(Utilisateur, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Utilisateur.hasMany(Report, {
  foreignKey: 'reporter_id',
  as: 'reportsMade'
});

Utilisateur.hasMany(Report, {
  foreignKey: 'reported_user_id',
  as: 'reportsReceived'
});

File.hasMany(Report, {
  foreignKey: 'file_id',
  as: 'reports'
});

// 10. Relations ModerationAction
ModerationAction.belongsTo(Utilisateur, {
  foreignKey: 'user_id',
  as: 'user'
});

ModerationAction.belongsTo(Utilisateur, {
  foreignKey: 'admin_id',
  as: 'admin'
});

ModerationAction.belongsTo(Report, {
  foreignKey: 'report_id',
  as: 'report'
});

Utilisateur.hasMany(ModerationAction, {
  foreignKey: 'user_id',
  as: 'moderationActions'
});

Utilisateur.hasMany(ModerationAction, {
  foreignKey: 'admin_id',
  as: 'adminActions'
});

Report.hasMany(ModerationAction, {
  foreignKey: 'report_id',
  as: 'actions'
});

export {
  sequelize,
  Utilisateur,
  File,
  Dossier,
  ActivityLog,
  PasswordResetToken,
  UserSession,
  Message,
  MessageAttachment,
  Notification,
  Report,
  ModerationAction,
  Empreinte,
  EmpreinteLog
};
