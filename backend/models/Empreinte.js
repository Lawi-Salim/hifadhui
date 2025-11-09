import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import crypto from 'crypto';
import QRCode from 'qrcode';

const Empreinte = sequelize.define('Empreinte', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Identifiant unique du produit (Format: HFD-LW-XXXXXX-YYYYYY)
  product_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  
  // Composants du product_id
  prefix: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'HFD'
  },
  
  owner_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'LW' // Tous les utilisateurs utilisent LW
  },
  
  sequence_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  random_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  // Empreintes cryptographiques pré-générées
  hash_pregenere: {
    type: DataTypes.CHAR(64),
    unique: true,
    allowNull: false
  },
  
  signature_pregeneree: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
  
  qr_code_data: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  qr_code_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Statut et association
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'disponible',
    validate: {
      isIn: [['disponible', 'utilise', 'expire']]
    }
  },
  
  file_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'File',
      key: 'id'
    }
  },
  
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  
  // Métadonnées
  generated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'empreintes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Génère un numéro séquentiel pour un utilisateur
 * @param {UUID} ownerId - ID de l'utilisateur
 * @returns {Promise<number>} - Prochain numéro de séquence
 */
Empreinte.getNextSequenceNumber = async function(ownerId) {
  const lastEmpreinte = await Empreinte.findOne({
    where: { owner_id: ownerId },
    order: [['sequence_number', 'DESC']]
  });
  
  return lastEmpreinte ? lastEmpreinte.sequence_number + 1 : 1;
};

/**
 * Génère un numéro aléatoire à 6 chiffres
 * @returns {number} - Nombre entre 100000 et 999999
 */
Empreinte.generateRandomNumber = function() {
  return Math.floor(100000 + Math.random() * 900000);
};

/**
 * Génère un product_id au format HFD-LW-XXXXXX-YYYYYY
 * @param {number} sequenceNumber - Numéro séquentiel
 * @param {number} randomNumber - Numéro aléatoire
 * @returns {string} - Product ID formaté
 */
Empreinte.generateProductId = function(sequenceNumber, randomNumber) {
  const prefix = 'HFD';
  const ownerCode = 'LW';
  const seqFormatted = String(sequenceNumber).padStart(6, '0');
  const randFormatted = String(randomNumber).padStart(6, '0');
  
  return `${prefix}-${ownerCode}-${seqFormatted}-${randFormatted}`;
};

/**
 * Génère un hash SHA-256 pré-généré unique
 * @param {string} productId - Product ID
 * @param {UUID} ownerId - ID de l'utilisateur
 * @returns {string} - Hash SHA-256
 */
Empreinte.generateHash = function(productId, ownerId) {
  const timestamp = Date.now();
  const randomSalt = crypto.randomBytes(16).toString('hex');
  const data = `${productId}-${ownerId}-${timestamp}-${randomSalt}`;
  
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Génère une signature pré-générée unique
 * @param {string} productId - Product ID
 * @param {UUID} ownerId - ID de l'utilisateur
 * @param {string} hash - Hash pré-généré
 * @returns {string} - Signature
 */
Empreinte.generateSignature = function(productId, ownerId, hash) {
  const timestamp = Date.now();
  const data = `${productId}-${ownerId}-${hash}-${timestamp}`;
  
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Génère les données du QR code (URL de partage)
 * @param {string} hash - Hash pré-généré
 * @returns {string} - URL de partage
 */
Empreinte.generateQRCodeData = function(hash) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://hifadhui.site';
  return `${frontendUrl}/share/${hash}`;
};

/**
 * Génère une ou plusieurs empreintes pour un utilisateur
 * @param {UUID} ownerId - ID de l'utilisateur
 * @param {number} count - Nombre d'empreintes à générer (défaut: 1)
 * @param {number} expirationDays - Jours avant expiration (défaut: 30)
 * @returns {Promise<Array>} - Tableau des empreintes créées
 */
Empreinte.generateEmpreintes = async function(ownerId, count = 1, expirationDays = 30) {
  const empreintes = [];
  const startSequence = await Empreinte.getNextSequenceNumber(ownerId);
  
  for (let i = 0; i < count; i++) {
    const sequenceNumber = startSequence + i;
    const randomNumber = Empreinte.generateRandomNumber();
    const productId = Empreinte.generateProductId(sequenceNumber, randomNumber);
    const hash = Empreinte.generateHash(productId, ownerId);
    const signature = Empreinte.generateSignature(productId, ownerId, hash);
    const qrCodeData = Empreinte.generateQRCodeData(hash);
    
    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    const empreinte = await Empreinte.create({
      product_id: productId,
      prefix: 'HFD',
      owner_code: 'LW',
      sequence_number: sequenceNumber,
      random_number: randomNumber,
      hash_pregenere: hash,
      signature_pregeneree: signature,
      qr_code_data: qrCodeData,
      qr_code_url: null, // Sera généré plus tard si nécessaire
      status: 'disponible',
      owner_id: ownerId,
      expires_at: expiresAt
    });
    
    empreintes.push(empreinte);
  }
  
  return empreintes;
};

/**
 * Génère l'image QR code et l'upload sur Cloudinary
 * @param {string} empreinteId - ID de l'empreinte
 * @returns {Promise<string>} - URL Cloudinary du QR code
 */
Empreinte.generateQRCodeImage = async function(empreinteId) {
  const empreinte = await Empreinte.findByPk(empreinteId);
  if (!empreinte) {
    throw new Error('Empreinte introuvable');
  }
  
  try {
    // Générer le QR code en base64
    const qrCodeDataUrl = await QRCode.toDataURL(empreinte.qr_code_data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    
    // TODO: Upload sur Cloudinary
    // Pour l'instant, on retourne le data URL
    // Dans la prochaine étape, on intégrera l'upload Cloudinary
    
    await empreinte.update({
      qr_code_url: qrCodeDataUrl
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Erreur génération QR code:', error);
    throw error;
  }
};

/**
 * Récupère les empreintes disponibles pour un utilisateur
 * @param {UUID} ownerId - ID de l'utilisateur
 * @param {number} limit - Nombre maximum d'empreintes (défaut: 10)
 * @returns {Promise<Array>} - Empreintes disponibles
 */
Empreinte.getAvailableEmpreintes = async function(ownerId, limit = 10) {
  return await Empreinte.findAll({
    where: {
      owner_id: ownerId,
      status: 'disponible'
    },
    order: [['sequence_number', 'ASC']],
    limit
  });
};

/**
 * Marque une empreinte comme utilisée et l'associe à un fichier
 * @param {UUID} empreinteId - ID de l'empreinte
 * @param {UUID} fileId - ID du fichier
 * @returns {Promise<Empreinte>} - Empreinte mise à jour
 */
Empreinte.markAsUsed = async function(empreinteId, fileId) {
  const empreinte = await Empreinte.findByPk(empreinteId);
  
  if (!empreinte) {
    throw new Error('Empreinte introuvable');
  }
  
  if (empreinte.status !== 'disponible') {
    throw new Error(`Empreinte déjà ${empreinte.status}`);
  }
  
  return await empreinte.update({
    status: 'utilise',
    file_id: fileId,
    used_at: new Date()
  });
};

/**
 * Marque les empreintes expirées
 * @returns {Promise<number>} - Nombre d'empreintes expirées
 */
Empreinte.markExpiredEmpreintes = async function() {
  const [updatedCount] = await Empreinte.update(
    { status: 'expire' },
    {
      where: {
        status: 'disponible',
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    }
  );
  
  return updatedCount;
};

/**
 * Supprime les empreintes expirées depuis plus de X jours
 * @param {number} daysAfterExpiration - Jours après expiration (défaut: 7)
 * @returns {Promise<number>} - Nombre d'empreintes supprimées
 */
Empreinte.deleteOldExpiredEmpreintes = async function(daysAfterExpiration = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAfterExpiration);
  
  const deletedCount = await Empreinte.destroy({
    where: {
      status: 'expire',
      expires_at: {
        [sequelize.Sequelize.Op.lt]: cutoffDate
      }
    }
  });
  
  return deletedCount;
};

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

/**
 * Vérifie si l'empreinte est disponible
 * @returns {boolean}
 */
Empreinte.prototype.isAvailable = function() {
  return this.status === 'disponible' && 
         (!this.expires_at || this.expires_at > new Date());
};

/**
 * Vérifie si l'empreinte est expirée
 * @returns {boolean}
 */
Empreinte.prototype.isExpired = function() {
  return this.expires_at && this.expires_at < new Date();
};

/**
 * Retourne les informations formatées de l'empreinte
 * @returns {Object}
 */
Empreinte.prototype.getFormattedInfo = function() {
  return {
    id: this.id,
    productId: this.product_id,
    hash: this.hash_pregenere,
    signature: this.signature_pregeneree,
    qrCodeData: this.qr_code_data,
    qrCodeUrl: this.qr_code_url,
    status: this.status,
    generatedAt: this.generated_at,
    usedAt: this.used_at,
    expiresAt: this.expires_at,
    isAvailable: this.isAvailable(),
    isExpired: this.isExpired()
  };
};

export default Empreinte;
