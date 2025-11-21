/**
 * Middleware de vérification des quotas d'upload
 * Vérifie si l'utilisateur peut uploader selon son plan (gratuit/premium)
 */

import { Utilisateur } from '../models/index.js';
import { Op } from 'sequelize';

// Configuration des quotas
const QUOTAS = {
  FREE: {
    maxFilesPerDay: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  PREMIUM: {
    maxFilesPerDay: 1000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['*'] // Tous types
  }
};

/**
 * Middleware principal de vérification des quotas
 */
export const checkUploadQuota = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    // Récupérer les informations utilisateur
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    const isPremium = user.subscription_type === 'premium' || false; // Par défaut gratuit
    const quota = isPremium ? QUOTAS.PREMIUM : QUOTAS.FREE;

    // Vérifier le quota journalier
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uploadsToday = await getUploadCountToday(userId, today);
    
    console.log(`📊 [QUOTA CHECK] Vérification quota:`, {
      userId,
      isPremium,
      uploadsToday,
      maxAllowed: quota.maxFilesPerDay,
      remaining: quota.maxFilesPerDay - uploadsToday
    });

    if (uploadsToday >= quota.maxFilesPerDay) {
      console.log(`🚫 [QUOTA EXCEEDED] Utilisateur ${userId} a atteint son quota: ${uploadsToday}/${quota.maxFilesPerDay}`);
      
      return res.status(429).json({
        success: false,
        error: 'Vous avez atteint le nombre d\'upload par jour, revenez demain ou passez à un plan premium',
        code: 'QUOTA_EXCEEDED'
      });
    }

    // Vérifier la taille du fichier (si présent)
    if (req.file && req.file.size > quota.maxFileSize) {
      return res.status(413).json({
        error: `Fichier trop volumineux. Taille max: ${formatFileSize(quota.maxFileSize)}`,
        code: 'FILE_TOO_LARGE',
        maxSize: quota.maxFileSize,
        fileSize: req.file.size,
        upgradeRequired: !isPremium
      });
    }

    // Vérifier le type de fichier
    if (req.file && !isFileTypeAllowed(req.file.mimetype, quota.allowedTypes)) {
      return res.status(415).json({
        error: 'Type de fichier non autorisé',
        code: 'INVALID_FILE_TYPE',
        allowedTypes: quota.allowedTypes,
        fileType: req.file.mimetype,
        upgradeRequired: !isPremium
      });
    }

    // Ajouter les infos de quota à la requête
    req.quota = {
      used: uploadsToday,
      max: quota.maxFilesPerDay,
      remaining: quota.maxFilesPerDay - uploadsToday,
      isPremium,
      resetTime: getNextResetTime()
    };

    next();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du quota:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification du quota',
      code: 'QUOTA_CHECK_ERROR'
    });
  }
};

/**
 * Compter les uploads d'aujourd'hui pour un utilisateur
 */
async function getUploadCountToday(userId, startOfDay) {
  try {
    const { ActivityLog } = await import('../models/index.js');

    // On compte les événements d'upload (IMAGE_UPLOAD, PDF_UPLOAD, ZIP_UPLOAD)
    // plutôt que le nombre de fichiers créés, pour que
    // - un upload simple = 1 événement
    // - un upload ZIP avec plusieurs fichiers extraits = 1 événement
    const count = await ActivityLog.count({
      where: {
        userId: userId,
        actionType: {
          [Op.in]: ['IMAGE_UPLOAD', 'PDF_UPLOAD', 'ZIP_UPLOAD']
        },
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });

    console.log(`📊 [UPLOAD COUNT] Utilisateur ${userId}: ${count} upload(s) aujourd'hui (basé sur ActivityLog)`);
    return count;
  } catch (error) {
    console.error('Erreur lors du comptage des uploads:', error);
    return 0;
  }
}

/**
 * Obtenir l'heure de reset du quota (minuit suivant)
 */
function getNextResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Vérifier si le type de fichier est autorisé
 */
function isFileTypeAllowed(mimeType, allowedTypes) {
  if (allowedTypes.includes('*')) return true;
  return allowedTypes.includes(mimeType);
}

/**
 * Formater la taille de fichier
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Middleware pour retourner les informations de quota
 */
export const getQuotaInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const user = await Utilisateur.findByPk(userId);
    const isPremium = user?.subscription_type === 'premium';
    const quota = isPremium ? QUOTAS.PREMIUM : QUOTAS.FREE;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uploadsToday = await getUploadCountToday(userId, today);

    res.json({
      quota: {
        used: uploadsToday,
        max: quota.maxFilesPerDay,
        remaining: Math.max(0, quota.maxFilesPerDay - uploadsToday),
        resetTime: getNextResetTime(),
        isPremium,
        maxFileSize: quota.maxFileSize,
        allowedTypes: quota.allowedTypes
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos quota:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export default {
  checkUploadQuota,
  getQuotaInfo,
  QUOTAS
};
