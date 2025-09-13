import express from 'express';
import { File, Certificate, sequelize } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';
import cloudinary from '../config/cloudinary.js';
import { getCertificateConfig } from '../utils/cloudinaryStructure.js';
import { Readable } from 'stream';

const router = express.Router();

// Route pour générer un certificat de propriété
router.post('/generate/:fileId', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      where: { 
        id: req.params.fileId,
        owner_id: req.user.id,
        is_latest: true
      }
    });

    if (!file) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    // Trouver le fichier racine (original)
    const rootFileId = file.parent_file_id || file.id;

    // Vérifier si un certificat existe déjà pour le fichier racine
    let certificate = await Certificate.findOne({
      where: { root_file_id: rootFileId }
    });

    if (certificate) {
      return res.json({
        message: 'Certificat déjà existant',
        certificate: {
          id: certificate.id,
          pdf_url: certificate.pdf_url,
          date_generated: certificate.date_generated
        }
      });
    }

    // Générer le PDF du certificat
    const pdfBuffer = await generateCertificatePDF(file, req.user);

    // Uploader le PDF vers Cloudinary avec le nom du fichier original
    const uploadResult = await uploadPDFToCloudinary(pdfBuffer, file.filename, req.user);

    // Extraire le chemin relatif pour optimiser le stockage
    let relativePath = uploadResult.secure_url;
    if (uploadResult.secure_url.includes('/upload/')) {
      const uploadIndex = uploadResult.secure_url.indexOf('/upload/');
      relativePath = uploadResult.secure_url.substring(uploadIndex + 8); // +8 pour "/upload/"
    }

    // Créer l'enregistrement du certificat avec chemin relatif
    certificate = await Certificate.create({
      root_file_id: rootFileId,
      pdf_url: relativePath
    });

    res.status(201).json({
      message: 'Certificat généré avec succès',
      certificate: {
        id: certificate.id,
        pdf_url: certificate.pdf_url,
        date_generated: certificate.date_generated
      }
    });

  } catch (error) {
    console.error('Erreur génération certificat:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du certificat'
    });
  }
});

// Route pour lister les certificats de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Récupérer d'abord tous les root_file_id des fichiers de l'utilisateur
    const userFiles = await File.findAll({
      where: { owner_id: req.user.id },
      attributes: ['id', 'parent_file_id']
    });

    const rootFileIds = userFiles.map(file => file.parent_file_id || file.id);
    const uniqueRootFileIds = [...new Set(rootFileIds)];

    // Récupérer tous les certificats liés à ces root_file_id
    const certificates = await Certificate.findAll({
      where: {
        root_file_id: {
          [Op.in]: uniqueRootFileIds
        }
      },
      order: [['date_generated', 'DESC']]
    });

    // Pour chaque certificat, récupérer la dernière version du fichier
    const certificatesWithLatestFile = await Promise.all(
      certificates.map(async (cert) => {
        const rootFileId = cert.root_file_id;
        
        // Trouver la dernière version de ce fichier
        const latestFile = await File.findOne({
          where: {
            [Op.or]: [
              { id: rootFileId },
              { parent_file_id: rootFileId }
            ],
            owner_id: req.user.id,
            is_latest: true // Ajout de la condition cruciale
          },
          // Ne pas restreindre les attributs pour tout récupérer (version, is_latest, etc.)
        });

        if (latestFile) {
          const certificateData = cert.toJSON();
          const latestFileData = latestFile.toJSON();

          // La structure finale attendue par le frontend
          return {
            ...certificateData, // id du certificat, etc.
            filename: latestFileData.filename, // Pour la liste
            version: latestFileData.version,   // Pour la liste
            certificateFile: latestFileData    // Pour le modal
          };
        }
        return cert.toJSON(); // Fallback si aucun fichier n'est trouvé
      })
    );

    // Filtrer les certificats pour ne garder que ceux qui ont un fichier associé
    const validCertificates = certificatesWithLatestFile.filter(cert => cert.certificateFile);

    res.json({ certificates: validCertificates });

  } catch (error) {
    console.error('Erreur liste certificats:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des certificats'
    });
  }
});

// Route pour télécharger un certificat
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      where: { id: req.params.id }
    });

    if (!certificate) {
      return res.status(404).json({
        error: 'Certificat non trouvé'
      });
    }

    // Récupérer la dernière version du fichier
    const rootFileId = certificate.root_file_id;
    const latestFile = await File.findOne({
      where: {
        [Op.or]: [
          { id: rootFileId },
          { parent_file_id: rootFileId }
        ],
        owner_id: req.user.id,
        is_latest: true // Ajout de la condition cruciale
      },
      // Ne pas restreindre les attributs
    });

    if (!latestFile) {
      return res.status(404).json({
        error: 'Fichier associé non trouvé'
      });
    }

    // Télécharger le PDF depuis Cloudinary
    const url = require('url');
    const https = require('https');
    const http = require('http');
    
    const parsedUrl = url.parse(certificate.pdf_url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const filename = `certificat-${latestFile.filename}.pdf`;
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    protocol.get(certificate.pdf_url, (cloudinaryResponse) => {
      cloudinaryResponse.pipe(res);
    }).on('error', (error) => {
      console.error('Erreur lors du téléchargement depuis Cloudinary:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erreur lors du téléchargement du certificat' });
      }
    });

  } catch (error) {
    console.error('Erreur téléchargement certificat:', error);
    res.status(500).json({
      error: 'Erreur lors du téléchargement du certificat'
    });
  }
});

// Fonction pour générer le PDF du certificat
async function generateCertificatePDF(file, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // En-tête
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('CERTIFICAT DE PROPRIÉTÉ NUMÉRIQUE', { align: 'center' });
    
    doc.moveDown(2);

    // Logo ou titre Hifadhwi
    doc.fontSize(18)
       .font('Helvetica')
       .fillColor('#2563eb')
       .text('Hifadhwi - Coffre-fort Numérique', { align: 'center' });

    doc.moveDown(2);
    doc.fillColor('black');

    // Informations du document
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMATIONS DU DOCUMENT', { underline: true });

    doc.moveDown(1);
    doc.font('Helvetica');

    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const uploadDate = new Date(file.date_upload).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(`Nom du fichier: ${file.filename}`)
       .text(`Propriétaire: ${user.username} (${user.email})`)
       .text(`Date d'upload: ${uploadDate}`)
       .text(`Hash SHA-256: ${file.hash}`)
       .text(`Signature unique: ${file.signature}`)
       .text(`Version: ${file.version}`);

    doc.moveDown(2);

    // Section de certification
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('CERTIFICATION', { underline: true });

    doc.moveDown(1);
    doc.font('Helvetica')
       .text('Ce certificat atteste que le document mentionné ci-dessus a été déposé dans le coffre-fort numérique Hifadhwi et appartient légitimement à l\'utilisateur identifié.');

    doc.moveDown(1);
    doc.text('L\'intégrité du document est garantie par son empreinte cryptographique SHA-256 et sa signature numérique unique.');

    doc.moveDown(2);

    // Informations de vérification
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('VÉRIFICATION', { underline: true });

    doc.moveDown(1);
    doc.font('Helvetica')
       .text('Pour vérifier l\'authenticité de ce certificat, vous pouvez:')
       .text('1. Vérifier le hash SHA-256 du document original')
       .text('2. Contrôler la signature numérique')
       .text('3. Contacter Hifadhwi pour validation');

    doc.moveDown(2);

    // Pied de page
    doc.fontSize(12)
       .text(`Certificat généré le: ${currentDate}`)
       .text('Hifadhwi - Système de preuve de propriété numérique')
       .text('Ce document est généré automatiquement et ne nécessite pas de signature manuscrite.');

    // Finaliser le PDF
    doc.end();
  });
}

// Fonction pour uploader le PDF vers Cloudinary
async function uploadPDFToCloudinary(pdfBuffer, originalFileName, user) {
  return new Promise((resolve, reject) => {
    const config = getCertificateConfig(user, originalFileName);
    console.log(`📄 [CERTIFICATE UPLOAD] Configuration:`, config);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      config,
      (error, result) => {
        if (error) {
          console.error(`❌ [CERTIFICATE UPLOAD] Erreur:`, error);
          reject(error);
        } else {
          console.log(`✅ [CERTIFICATE UPLOAD] Succès:`, result.secure_url);
          resolve(result);
        }
      }
    );

    const readable = new Readable();
    readable.push(pdfBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export default router;
