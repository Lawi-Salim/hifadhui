import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { Photo, User } from '../models/index.js';
import { upload } from '../config/multer.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Récupérer toutes les photos d'un utilisateur (protégée par authentification)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const photos = await Photo.findAll({
      where: { user_id: req.user.id },
      order: [['upload_date', 'DESC']]
    });
    
    res.json(photos);
  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

// Récupérer une photo spécifique par ID (protégée par authentification)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('--- Requête GET /api/photos/:id ---');
    console.log('ID demandé :', id);
    console.log('Utilisateur authentifié :', req.user);
    const photo = await Photo.findOne({
      where: { 
        id: id,
        user_id: req.user.id 
      }
    });
    console.log('Résultat de la recherche photo :', photo ? 'Photo trouvée' : 'Photo non trouvée');
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }
    
    res.json(photo);
  } catch (error) {
    console.error('Erreur lors de la récupération de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la photo' });
  }
});

// Télécharger une nouvelle photo (protégée par authentification)
router.post('/', authenticateToken, async (req, res) => {
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
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const photo = await Photo.findOne({
      where: { 
        id: id,
        user_id: req.user.id 
      }
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée ou accès non autorisé' });
    }
    
    // Mise à jour des champs
    if (title) photo.title = title;
    if (description !== undefined) photo.description = description;
    photo.updated_at = new Date();
    
    await photo.save();
    
    res.json(photo);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la photo' });
  }
});

// Supprimer une photo (protégée par authentification)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const photo = await Photo.findOne({
      where: { 
        id: id,
        user_id: req.user.id 
      }
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée ou accès non autorisé' });
    }
    
    await photo.destroy();
    
    res.json({ message: 'Photo supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' });
  }
});

export default router;
