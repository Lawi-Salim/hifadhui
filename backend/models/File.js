import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import crypto from 'crypto';

const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Taille du fichier en octets'
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrlOrPath: function(value) {
        // Accepter les URLs Cloudinary, les chemins relatifs ou les chemins Cloudinary relatifs
        const isCloudinaryUrl = /^https:\/\/res\.cloudinary\.com\//.test(value);
        const isRelativePath = /^\/uploads\//.test(value);
        const isHttpUrl = /^https?:\/\//.test(value);
        const isCloudinaryPath = /^(v\d+\/)?Hifadhui\//.test(value) || /^v\d+\/[^/]+\.(jpg|jpeg|png|pdf)$/i.test(value);
        
        if (!isCloudinaryUrl && !isRelativePath && !isHttpUrl && !isCloudinaryPath) {
          throw new Error('L\'URL du fichier doit être une URL Cloudinary valide, un chemin relatif /uploads/ ou un chemin Cloudinary relatif');
        }
      }
    }
  },
  hash: {
    type: DataTypes.CHAR(64),
    allowNull: false,
    unique: true,
    validate: {
      len: [64, 64]
    }
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },
  dossier_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'dossier',
      key: 'id'
    }
  },
  is_public_verification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Autoriser la vérification publique avec affichage des détails du fichier'
  },
  date_upload: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  modelName: 'File',
  tableName: 'file',
  timestamps: true,
  createdAt: 'date_upload',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (file) => {
      // Générer le hash SHA-256 si pas fourni
      if (!file.hash && file.file_url) {
        file.hash = crypto.createHash('sha256').update(file.file_url + Date.now()).digest('hex');
      }
      
      // Générer la signature unique si pas fournie
      if (!file.signature) {
        const timestamp = Date.now();
        const signatureData = `${file.filename || 'unknown'}-${file.owner_id || 'unknown'}-${timestamp}`;
        file.signature = crypto.createHash('sha256').update(signatureData).digest('hex');
      }
    }
  }
});

// Méthode statique pour générer un hash de fichier de manière cohérente
File.generateFileHash = (buffer) => {
  const startTime = Date.now();
  
  if (!Buffer.isBuffer(buffer)) {
    console.log('🔄 [HASH] Conversion du buffer en Buffer (actuel:', typeof buffer, ')');
    buffer = Buffer.from(buffer);
  }
  
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  
  console.log('🔢 [HASH] Génération du hash:', {
    bufferType: buffer.constructor.name,
    bufferLength: buffer.length,
    firstBytes: buffer.length > 0 ? buffer.slice(0, 16).toString('hex') : 'empty',
    generatedHash: hash,
    duration: `${Date.now() - startTime}ms`
  });
  
  return hash;
};

// Méthode pour vérifier l'intégrité du fichier
File.prototype.verifyIntegrity = function(fileBuffer) {
  const calculatedHash = File.generateFileHash(fileBuffer);
  return this.hash === calculatedHash;
};

export default File;
