import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuration pour la base de données source (MySQL)
const sourceConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'nadalawi',
  database: process.env.DB_NAME || 'db_picture',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql'
};

// Configuration pour la base de données cible (PostgreSQL - Supabase)
const targetConfig = {
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'LawiSalim@1616',
  database: process.env.PG_DATABASE || 'postgres',
  host: process.env.PG_HOST || 'db.YOUR_SUPABASE_REF.supabase.co',
  dialect: 'postgres',
  port: process.env.PG_PORT || 5432,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
};

async function migrate() {
  console.log('Début de la migration...');
  
  const sourceSequelize = new Sequelize(sourceConfig);
  const targetSequelize = new Sequelize(targetConfig);

  try {
    // Vérifier les connexions
    await sourceSequelize.authenticate();
    console.log('✅ Connexion à la base source (MySQL) réussie.');
    
    await targetSequelize.authenticate();
    console.log('✅ Connexion à la base cible (PostgreSQL) réussie.');

    // Désactiver temporairement les contraintes de clé étrangère
    await targetSequelize.query('SET session_replication_role = replica;');

    // Migrer les utilisateurs
    const [users] = await sourceSequelize.query('SELECT * FROM users');
    console.log(`📊 ${users.length} utilisateurs à migrer.`);
    
    for (const user of users) {
      await targetSequelize.query(
        `INSERT INTO users (id, username, email, password, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (id) DO NOTHING`,
        {
          bind: [
            user.id,
            user.username,
            user.email,
            user.password,
            user.created_at || new Date(),
            user.updated_at || new Date()
          ]
        }
      );
    }
    console.log('✅ Migration des utilisateurs terminée.');

    // Migrer les photos
    const [photos] = await sourceSequelize.query('SELECT * FROM photos');
    console.log(`📸 ${photos.length} photos à migrer.`);
    
    for (const photo of photos) {
      await targetSequelize.query(
        `INSERT INTO photos (id, user_id, title, description, filepath, upload_date, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO NOTHING`,
        {
          bind: [
            photo.id,
            photo.user_id,
            photo.title,
            photo.description || null,
            photo.filepath,
            photo.upload_date || new Date(),
            photo.created_at || new Date()
          ]
        }
      );
    }
    console.log('✅ Migration des photos terminée.');

    // Réactiver les contraintes de clé étrangère
    await targetSequelize.query('SET session_replication_role = origin;');

    console.log('✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
  } finally {
    await sourceSequelize.close();
    await targetSequelize.close();
    process.exit();
  }
}

migrate();
