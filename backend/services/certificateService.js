import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service de génération de certificats d'authenticité pour les fichiers
 */
class CertificateService {
  /**
   * Génère un certificat d'authenticité PDF pour un fichier
   * @param {Object} file - Objet fichier depuis la base de données
   * @param {Object} owner - Objet utilisateur propriétaire
   * @returns {Promise<Buffer>} - Buffer du PDF généré
   */
  async generateCertificate(file, owner) {
    return new Promise(async (resolve, reject) => {
      try {
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Buffer pour stocker le PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // URL de vérification
        const verifyUrl = `${process.env.FRONTEND_URL || 'https://hifadhui.site'}/verify/${file.hash}`;

        // Générer le QR code
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          }
        });

        // En-tête avec logo et titre
        this._drawHeader(doc);

        // Titre du certificat - compact
        doc.fontSize(16)
           .fillColor('#1e293b')
           .font('Helvetica-Bold')
           .text('CERTIFICAT D\'AUTHENTICITÉ', { align: 'center' })
           .moveDown(0.2);

        doc.fontSize(8)
           .fillColor('#64748b')
           .font('Helvetica')
           .text('Preuve d\'antériorité et d\'intégrité', { align: 'center' })
           .moveDown(0.6);

        // Ligne de séparation
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#e2e8f0')
           .lineWidth(1)
           .stroke()
           .moveDown(0.8);

        // Tableau des informations
        this._drawTable(doc, [
          { section: 'INFORMATIONS DU FICHIER', items: [
            { label: 'Nom du fichier', value: file.filename },
            { label: 'Type', value: file.mimetype || 'Non spécifié' },
            { label: 'Taille', value: this._formatFileSize(file.size) },
            { label: 'Date de dépôt', value: format(new Date(file.date_upload), 'dd MMMM yyyy à HH:mm:ss', { locale: fr }) + ' UTC' }
          ]},
          { section: 'EMPREINTE CRYPTOGRAPHIQUE', items: [
            { label: 'Hash SHA-256', value: file.hash, mono: true }
          ]},
          { section: 'PROPRIÉTAIRE', items: [
            { label: 'Nom', value: owner.username },
            { label: 'Email', value: owner.email }
          ]},
          { section: 'SIGNATURE UNIQUE', items: [
            { label: 'Identifiant', value: file.signature.substring(0, 32) + '...', mono: true }
          ]}
        ]);

        // QR Code et instructions de vérification
        doc.moveDown(1);
        
        // Cadre pour le QR code
        const qrY = doc.y;
        doc.rect(50, qrY, 495, 120)
           .fillAndStroke('#f8fafc', '#e2e8f0')
           .lineWidth(1);

        // QR Code
        doc.image(qrCodeDataUrl, 70, qrY + 20, { width: 80, height: 80 });

        // Instructions à côté du QR code
        doc.fontSize(11)
           .fillColor('#1e293b')
           .font('Helvetica-Bold')
           .text('VÉRIFICATION DE L\'AUTHENTICITÉ', 170, qrY + 20)
           .moveDown(0.3);

        doc.fontSize(9)
           .fillColor('#475569')
           .font('Helvetica')
           .text('Scannez le QR code ou visitez :', 170, doc.y)
           .moveDown(0.3);

        doc.fontSize(8)
           .fillColor('#3b82f6')
           .font('Helvetica')
           .text(verifyUrl, 170, doc.y, { 
             link: verifyUrl,
             underline: true,
             width: 350
           });

        // Pied de page
        this._drawFooter(doc);

        // Finaliser le PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Dessine l'en-tête du certificat
   */
  _drawHeader(doc) {
    // Logo Hifadhui (image PNG texte)
    const logoPath = path.join(__dirname, '../../frontend/public/hifadhui-logo-png.png');
    
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 150, height: 40 });
      
      // Slogan centré sous le logo (logo width = 150, donc centre à 50 + 75 = 125)
      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('Coffre-fort numérique sécurisé', 50, 85, {
           width: 150,
           align: 'center'
         });
    }

    // Date de génération du certificat
    doc.fontSize(8)
       .fillColor('#94a3b8')
       .text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 400, 50, {
         width: 145,
         align: 'right'
       });

    doc.moveDown(2);
  }

  /**
   * Dessine un tableau avec plusieurs sections
   */
  _drawTable(doc, sections) {
    const tableX = 50;
    const tableWidth = 495;
    const startY = doc.y;

    sections.forEach((section, sectionIndex) => {
      // Titre de section avec fond
      const titleY = doc.y;
      doc.rect(tableX, titleY, tableWidth, 20)
         .fillAndStroke('#f1f5f9', '#e2e8f0')
         .lineWidth(0.5);

      doc.fontSize(9)
         .fillColor('#1e293b')
         .font('Helvetica-Bold')
         .text(section.section, tableX + 10, titleY + 6);

      doc.moveDown(1.2);

      // Items du tableau
      section.items.forEach((item, itemIndex) => {
        const rowY = doc.y;
        const rowHeight = item.mono ? 25 : 18;

        // Fond alterné pour les lignes
        if (itemIndex % 2 === 0) {
          doc.rect(tableX, rowY, tableWidth, rowHeight)
             .fill('#fafafa');
        }

        // Bordure de ligne
        doc.rect(tableX, rowY, tableWidth, rowHeight)
           .stroke('#e2e8f0');

        // Label (colonne gauche)
        doc.fontSize(8)
           .fillColor('#64748b')
           .font('Helvetica')
           .text(item.label + ' :', tableX + 10, rowY + 5, { width: 140 });

        // Valeur (colonne droite)
        const font = item.mono ? 'Courier' : 'Helvetica';
        doc.fontSize(item.mono ? 7 : 8)
           .fillColor('#1e293b')
           .font(font)
           .text(item.value, tableX + 160, rowY + 5, { 
             width: tableWidth - 170,
             continued: false
           });

        doc.y = rowY + rowHeight;
      });

      // Espacement entre sections
      if (sectionIndex < sections.length - 1) {
        doc.moveDown(0.3);
      }
    });
  }

  /**
   * Dessine une section avec titre et données
   */
  _drawSection(doc, title, items) {
    // Titre de section
    doc.fontSize(10)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(title)
       .moveDown(0.3);

    // Items
    items.forEach(item => {
      const labelY = doc.y;
      
      // Label
      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text(item.label + ' :', 70, labelY, { width: 150 });

      // Valeur
      const font = item.mono ? 'Courier' : 'Helvetica';
      const valueWidth = item.wrap ? 320 : 350;
      
      doc.fontSize(8)
         .fillColor('#1e293b')
         .font(font)
         .text(item.value, 230, labelY, { 
           width: valueWidth,
           continued: false
         });

      doc.moveDown(0.5);
    });
  }

  /**
   * Dessine le pied de page
   */
  _drawFooter(doc) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 80;

    // Ligne de séparation
    doc.moveTo(50, footerY)
       .lineTo(540, footerY)
       .strokeColor('#e2e8f0')
       .lineWidth(1)
       .stroke();

    // Texte explicatif centré
    doc.fontSize(8)
       .fillColor('#64748b')
       .font('Helvetica')
       .text(
         'Certificat attestant le dépôt du fichier sur Hifadhui. L\'empreinte SHA-256 garantit son intégrité.',
         50,
         footerY + 5,
         { width: 495, align: 'center' }
       );
  }

  /**
   * Formate la taille du fichier en unités lisibles
   */
  _formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
  }

  /**
   * Génère les métadonnées du certificat (pour preview JSON)
   */
  generateCertificateMetadata(file, owner) {
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://hifadhui.site'}/verify/${file.hash}`;
    
    return {
      certificateId: file.signature,
      file: {
        name: file.filename,
        hash: file.hash,
        size: file.size,
        mimetype: file.mimetype,
        uploadDate: file.date_upload
      },
      owner: {
        name: owner.username,
        email: owner.email
      },
      verification: {
        url: verifyUrl,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`
      },
      generatedAt: new Date().toISOString()
    };
  }
}

export default new CertificateService();
