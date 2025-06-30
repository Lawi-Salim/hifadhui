import { Router } from 'express';
import authRoutes from './auth.js';
import photoRoutes from './photos.js';

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des photos
router.use('/photos', photoRoutes);

// Route de test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

export default router;
