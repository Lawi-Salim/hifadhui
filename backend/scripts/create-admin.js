import { Sequelize } from 'sequelize';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Détection automatique de l'environnement
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.VERCEL === '1' || 
                    (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.com'));

// Configuration de base de données directe pour Vercel (priorité à DATABASE_URL)
const baseOptions = {
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl: isProduction ? { require: true, rejectUnauthorized: false } : false
  },
  // IMPORTANT: pas de pool pour éviter MaxClientsInSessionMode pendant build/one-shot
  pool: false
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, baseOptions)
  : new Sequelize(
      process.env.DB_NAME || 'postgres',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        ...baseOptions
      }
    );

// Définition du modèle Utilisateur directement
const Utilisateur = sequelize.define('Utilisateur', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  email: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  role: {
    type: Sequelize.STRING(20),
    defaultValue: 'user'
  }
}, {
  tableName: 'utilisateur',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

async function connectWithRetry(maxRetries = 3, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`⏳ [CREATE-ADMIN] Connexion DB (tentative ${attempt}/${maxRetries})...`);
      await sequelize.authenticate();
      console.log('✅ [CREATE-ADMIN] Connexion DB OK');
      return;
    } catch (err) {
      console.error(`❌ [CREATE-ADMIN] Échec tentative ${attempt}:`, err.message);
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

export async function createAdmin() {
  try {
    console.log('🚀 [CREATE-ADMIN] Début du script de création admin');
    console.log('🔍 [CREATE-ADMIN] Variables d\'environnement:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - VERCEL:', process.env.VERCEL);
    console.log('  - DATABASE_URL défini:', Boolean(process.env.DATABASE_URL));
    console.log('  - DB_HOST:', process.env.DB_HOST || '(non défini)');
    
    try {
      await connectWithRetry(3, 1500);
      // Créer l'admin par défaut
      await createAdminDefault();
    } catch (error) {
      console.error('❌ [CREATE-ADMIN] Erreur de connexion à la base de données:', error.message);
      console.error('❌ [CREATE-ADMIN] Stack trace:', error.stack);
    } finally {
      await sequelize.close();
      console.log('🔌 [CREATE-ADMIN] Connexion fermée');
    }
  } catch (error) {
    console.error('❌ [CREATE-ADMIN] Erreur lors de la création de l\'administrateur:', error.message);
    console.error('❌ [CREATE-ADMIN] Stack trace:', error.stack);
  }
}

async function createAdminDefault() {
  try {
    console.log('🔍 [CREATE-ADMIN] Vérification de l\'existence d\'un admin...');
    
    const existingAdmin = await Utilisateur.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  [CREATE-ADMIN] Un administrateur existe déjà:', existingAdmin.email);
      console.log('🔄 [CREATE-ADMIN] Mise à jour des informations de l\'admin existant...');
      await existingAdmin.update({
        username: 'Lawi Salim',
        email: 'lawi@gmail.com',
        password: '123456',
        role: 'admin'
      });
      console.log('✅ [CREATE-ADMIN] Administrateur mis à jour avec succès');
    } else {
      console.log('🔨 [CREATE-ADMIN] Création d\'un nouvel admin...');
      const admin = await Utilisateur.create({
        username: 'Lawi Salim',
        email: 'lawi@gmail.com',
        password: '123456',
        role: 'admin'
      });
      console.log('✅ [CREATE-ADMIN] Administrateur créé:', admin.id);
    }

    console.log('\n🔐 [CREATE-ADMIN] Connexions par défaut:');
    console.log('Email: lawi@gmail.com');
    console.log('Mot de passe: 123456');
    console.log('⚠️  [CREATE-ADMIN] Changez le mot de passe après la première connexion');

  } catch (error) {
    console.error('❌ [CREATE-ADMIN] Erreur lors de la création de l\'administrateur:', error.message);
    console.error('❌ [CREATE-ADMIN] Stack trace:', error.stack);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('📧 [CREATE-ADMIN] Un utilisateur avec cet email existe déjà');
    } else if (error.name === 'SequelizeValidationError') {
      console.log('❌ [CREATE-ADMIN] Erreur de validation:', error.errors.map(e => e.message).join(', '));
    }
  } finally {
    // Fermeture gérée plus haut
  }
}

// Exécuter le script si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdmin();
}

export default createAdmin;