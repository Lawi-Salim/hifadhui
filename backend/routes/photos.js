import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { Photo, User } from '../models/index.js';
import { upload } from '../config/multer.js';
import { sequelize } from '../config/database.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Récupérer toutes les photos publiques
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.findAll({
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['upload_date', 'DESC']]
    });
    
    res.json(photos);
  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

// Récupérer les photos d'un utilisateur spécifique
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { includePrivate } = req.query;
    
    const whereClause = { user_id: userId };
    
    // Si l'utilisateur ne demande pas les photos privées ou n'est pas l'utilisateur lui-même
    if (includePrivate !== 'true' || (req.user && req.user.id !== userId)) {
      whereClause.isPublic = true;
    }
    
    const photos = await Photo.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['upload_date', 'DESC']]
    });
    
    res.json(photos);
  } catch (error) {
    console.error('Erreur lors de la récupération des photos utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos utilisateur' });
  }
});

// Récupérer une photo spécifique par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const photo = await Photo.findOne({
      where: { id },
      include: [{
        model: User,
        attributes: ['id', 'username']
      }]
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }
    
    // Vérifier si l'utilisateur peut accéder à cette photo
    // Si la photo n'est pas publique et que l'utilisateur n'est pas le propriétaire
    if (!photo.isPublic && (!req.user || req.user.id !== photo.user_id)) {
      return res.status(403).json({ error: 'Accès non autorisé à cette photo' });
    }
    
    res.json(photo);
  } catch (error) {
    console.error('Erreur lors de la récupération de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la photo' });
  }
});

// Télécharger une nouvelle photo (protégée par authentification)
router.post('/', (req, res, next) => {
  console.log('Route /api/photos appelée');
  console.log('Headers reçus :', req.headers);
  next();
}, authenticateToken, async (req, res) => {
  console.log('--- Tentative d\'upload de photo ---');
  console.log('Body reçu :', req.body);
  console.log('Utilisateur authentifié :', req.user);
  try {
    const { title, description, photoUrl } = req.body;
    if (!title || !photoUrl) {
      console.warn('Titre ou photoUrl manquant');
      return res.status(400).json({ error: 'Titre et URL de la photo requis' });
    }
    if (!req.user || !req.user.id) {
      console.error('Utilisateur non authentifié ou id manquant');
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const photo = await Photo.create({
      title,
      description: description || null,
      filepath: photoUrl, // On stocke l'URL Cloudinary dans filepath
      user_id: req.user.id,
      upload_date: new Date()
    });
    console.log('Photo créée avec succès :', photo);
    res.status(201).json(photo);
  } catch (error) {
    console.error('Erreur lors du téléchargement de la photo:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement de la photo', details: error.message });
  }
});

// Mettre à jour une photo (protégée par authentification)
router.put('/:id', authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { title, description, category, isPublic } = req.body;
    
    const photo = await Photo.findOne({
      where: { id, user_id: req.user.id },
      transaction: t
    });
    
    if (!photo) {
      await t.rollback();
      return res.status(404).json({ error: 'Photo non trouvée ou accès non autorisé' });
    }
    
    // Mise à jour des champs
    photo.title = title || photo.title;
    if (description !== undefined) photo.description = description;
    if (category !== undefined) photo.category = category;
    if (isPublic !== undefined) photo.isPublic = isPublic === 'true';
    
    await photo.save({ transaction: t });
    await t.commit();
    
    res.json(photo);
  } catch (error) {
    await t.rollback();
    console.error('Erreur lors de la mise à jour de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la photo' });
  }
});

// Supprimer une photo (protégée par authentification)
router.delete('/:id', authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const photo = await Photo.findOne({
      where: { id, user_id: req.user.id },
      transaction: t
    });
    
    if (!photo) {
      await t.rollback();
      return res.status(404).json({ error: 'Photo non trouvée ou accès non autorisé' });
    }
    
    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', photo.filepath);
    
    await photo.destroy({ transaction: t });
    await t.commit();
    
    // Supprimer le fichier après la validation de la transaction
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier:', err);
    });
    
    res.json({ message: 'Photo supprimée avec succès' });
  } catch (error) {
    await t.rollback();
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' });
  }
});

export default router;
