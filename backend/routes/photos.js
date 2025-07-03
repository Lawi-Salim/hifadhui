import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { Photo, User } from '../models/index.js';
import { upload } from '../config/multer.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Récupérer toutes les photos publiques
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.findAll({
      where: { isPublic: true },
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']]
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
    
    const whereClause = { userId };
    
    // Si l'utilisateur ne demande pas les photos privées ou n'est pas l'utilisateur lui-même
    if (includePrivate !== 'true' || (req.user && req.user.id !== parseInt(userId))) {
      whereClause.isPublic = true;
    }
    
    const photos = await Photo.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(photos);
  } catch (error) {
    console.error('Erreur lors de la récupération des photos utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos utilisateur' });
  }
});

// Téléverser une nouvelle photo (protégée par authentification)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, photoUrl } = req.body;
    if (!title || !photoUrl) {
      return res.status(400).json({ error: 'Titre et URL de la photo requis' });
    }
    const photo = await Photo.create({
      title,
      description: description || null,
      filepath: photoUrl, // On stocke l'URL Cloudinary dans filepath
      user_id: req.user.id,
      upload_date: new Date()
    });
    res.status(201).json(photo);
  } catch (error) {
    console.error('Erreur lors du téléchargement de la photo:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement de la photo' });
  }
});

// Mettre à jour une photo (protégée par authentification)
router.put('/:id', authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { title, description, category, isPublic } = req.body;
    
    const photo = await Photo.findOne({
      where: { id, userId: req.user.id },
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
      where: { id, userId: req.user.id },
      transaction: t
    });
    
    if (!photo) {
      await t.rollback();
      return res.status(404).json({ error: 'Photo non trouvée ou accès non autorisé' });
    }
    
    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', photo.imageUrl);
    
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
