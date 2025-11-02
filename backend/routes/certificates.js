import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { File, Utilisateur } from '../models/index.js';
import certificateService from '../services/certificateService.js';

const router = express.Router();

/**
 * @route   GET /api/v1/certificates/:fileId
 * @desc    Télécharger le certificat d'authenticité PDF d'un fichier
 * @access  Private (propriétaire du fichier)
 */
router.get('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    console.log(`📜 [CERTIFICATE] Demande de certificat pour fichier: ${fileId}`);

    // Récupérer le fichier
    const file = await File.findOne({
      where: { id: fileId },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!file) {
      console.warn(`⚠️ [CERTIFICATE] Fichier non trouvé: ${fileId}`);
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (file.owner_id !== userId) {
      console.warn(`⚠️ [CERTIFICATE] Accès non autorisé au certificat: ${fileId} par user: ${userId}`);
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Générer le certificat PDF
    console.log(`🔄 [CERTIFICATE] Génération du certificat PDF...`);
    const pdfBuffer = await certificateService.generateCertificate(file, file.fileUser);

    // Nom du fichier PDF
    const sanitizedFilename = file.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const pdfFilename = `certificat_${sanitizedFilename}_${Date.now()}.pdf`;

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log(`✅ [CERTIFICATE] Certificat généré avec succès: ${pdfFilename}`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ [CERTIFICATE] Erreur lors de la génération du certificat:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du certificat',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/v1/certificates/:fileId/preview
 * @desc    Obtenir les métadonnées du certificat (preview JSON)
 * @access  Private (propriétaire du fichier)
 */
router.get('/:fileId/preview', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    console.log(`👁️ [CERTIFICATE-PREVIEW] Demande de preview pour fichier: ${fileId}`);

    // Récupérer le fichier
    const file = await File.findOne({
      where: { id: fileId },
      include: [{
        model: Utilisateur,
        as: 'fileUser',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (file.owner_id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Générer les métadonnées
    const metadata = certificateService.generateCertificateMetadata(file, file.fileUser);

    console.log(`✅ [CERTIFICATE-PREVIEW] Métadonnées générées pour: ${fileId}`);
    res.json(metadata);

  } catch (error) {
    console.error('❌ [CERTIFICATE-PREVIEW] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des métadonnées' });
  }
});

/**
 * @route   GET /api/v1/certificates/batch/download
 * @desc    Télécharger plusieurs certificats en ZIP
 * @access  Private
 * @future  À implémenter si besoin
 */
router.post('/batch/download', authenticateToken, async (req, res) => {
  // TODO: Implémenter le téléchargement en lot
  res.status(501).json({ 
    error: 'Fonctionnalité non encore implémentée',
    message: 'Le téléchargement de certificats en lot sera disponible prochainement'
  });
});

export default router;
