import express from 'express';
import { sequelize } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/cron/keep-alive
 * @desc    Health check silencieux pour garder la DB active et les instances warm
 * @access  Public (mais sécurisé par CRON_SECRET)
 */
router.get('/keep-alive', async (req, res) => {
  try {
    // Vérification de sécurité : CRON_SECRET pour éviter les abus
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      console.warn('⚠️ [KEEP-ALIVE] Tentative d\'accès non autorisée');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const startTime = Date.now();
    
    // Requête légère pour garder la DB active
    await sequelize.query('SELECT 1', { raw: true });
    
    const responseTime = Date.now() - startTime;
    
    // Log silencieux (seulement si debug activé)
    if (process.env.DEBUG_CRON === 'true') {
      console.log(`✅ [KEEP-ALIVE] DB ping réussi - ${responseTime}ms`);
    }
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      message: 'Database connection maintained'
    });
    
  } catch (error) {
    console.error('❌ [KEEP-ALIVE] Erreur lors du ping DB:', error.message);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cron/health
 * @desc    Health check complet du système
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test connexion DB
    await sequelize.authenticate();
    const dbResponseTime = Date.now() - startTime;
    
    // Informations sur l'instance
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`
        },
        server: {
          uptime: `${Math.floor(uptime)}s`,
          memory: {
            used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
          }
        },
        environment: process.env.VERCEL ? 'vercel' : 'local'
      }
    });
    
  } catch (error) {
    console.error('❌ [HEALTH] Erreur health check:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
