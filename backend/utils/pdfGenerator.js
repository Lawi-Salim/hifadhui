import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer le dossier des certificats s'il n'existe pas
const certsDir = path.join(__dirname, '../certificates');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

/**
 * Génère un certificat PDF pour un fichier donné.
 * @param {object} file - L'instance Sequelize du fichier.
 * @param {object} user - L'instance Sequelize de l'utilisateur.
 * @returns {Promise<string>} - Le chemin relatif du PDF généré.
 */
const generateCertificate = async (file, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 72,
        right: 72
      }
    });

    const pdfName = `certificat-${file.id}.pdf`;
    const pdfPath = path.join(certsDir, pdfName);
    const writeStream = fs.createWriteStream(pdfPath);

    doc.pipe(writeStream);

    // En-tête principal avec couleur
    doc.fontSize(20).font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('CERTIFICAT DE PROPRIÉTÉ ET D\'INTÉGRITÉ NUMÉRIQUE', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Identifiant du certificat
    const certId = `HFD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0')}`;
    doc.fontSize(12).fillColor('#666666')
       .text(`Identifiant du Certificat : ${certId}`, { align: 'center' });
    
    doc.moveDown(2);

    // Section Fichier avec tableau
    doc.fillColor('#000000');
    const startY = doc.y;
    
    // Titre de section avec fond
    doc.rect(72, startY, 451, 25).fillAndStroke('#f3f4f6', '#d1d5db');
    doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold')
       .text('FICHIER', 80, startY + 8);
    
    // Lignes du tableau
    const rowHeight = 25;
    let currentY = startY + 25;
    
    const fileData = [
      ['Nom', file.filename],
      ['Type', file.mimetype || 'PDF'],
      ['Propriétaire', `${user.username} (${user.email})`],
      ['Date de dépôt', new Date(file.date_upload).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      })]
    ];

    fileData.forEach((row, index) => {
      // Alternance de couleurs
      if (index % 2 === 0) {
        doc.rect(72, currentY, 451, rowHeight).fill('#ffffff');
      } else {
        doc.rect(72, currentY, 451, rowHeight).fill('#f9fafb');
      }
      
      // Bordures
      doc.rect(72, currentY, 451, rowHeight).stroke('#d1d5db');
      doc.rect(72, currentY, 150, rowHeight).stroke('#d1d5db');
      
      // Texte
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
         .text(row[0], 80, currentY + 8);
      doc.font('Helvetica')
         .text(row[1], 230, currentY + 8, { width: 285 });
      
      currentY += rowHeight;
    });

    doc.y = currentY + 20;

    // Section Intégrité avec tableau
    const integrityY = doc.y;
    
    // Titre de section avec fond vert
    doc.rect(72, integrityY, 451, 25).fillAndStroke('#dcfce7', '#16a34a');
    doc.fillColor('#15803d').fontSize(12).font('Helvetica-Bold')
       .text('INTEGRITE', 80, integrityY + 8);
    
    currentY = integrityY + 25;
    
    const integrityData = [
      ['Hash (SHA-256)', file.hash],
      ['Signature Hifadhwi', file.signature]
    ];

    integrityData.forEach((row, index) => {
      // Alternance de couleurs
      if (index % 2 === 0) {
        doc.rect(72, currentY, 451, rowHeight).fill('#ffffff');
      } else {
        doc.rect(72, currentY, 451, rowHeight).fill('#f9fafb');
      }
      
      // Bordures
      doc.rect(72, currentY, 451, rowHeight).stroke('#d1d5db');
      doc.rect(72, currentY, 150, rowHeight).stroke('#d1d5db');
      
      // Texte
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
         .text(row[0], 80, currentY + 8);
      doc.fontSize(8).font('Courier')
         .text(row[1], 230, currentY + 5, { width: 285, lineGap: 2 });
      
      currentY += rowHeight;
    });

    // QR Code placeholder (carré noir simple)
    doc.y = currentY + 30;
    const qrSize = 80;
    const qrX = 72;
    const qrY = doc.y;
    
    // Dessiner un QR code simple
    doc.rect(qrX, qrY, qrSize, qrSize).fill('#000000');
    
    // Motif QR code basique
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          doc.rect(qrX + i * 10, qrY + j * 10, 10, 10).fill('#ffffff');
        }
      }
    }

    // Pied de page
    doc.y = Math.max(doc.y + qrSize + 30, 700);
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica-Oblique')
       .text('Ce certificat a été généré automatiquement par Hifadhwi.', { align: 'center' });
    doc.text('Il atteste que le fichier ci-dessus a été déposé à la date indiquée et que son intégrité est vérifiable via son empreinte SHA-256.', { align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      const relativePath = `/certificates/${pdfName}`;
      resolve(relativePath);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};

export { generateCertificate };
