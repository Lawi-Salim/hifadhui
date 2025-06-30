import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Configuration pour la base de données MySQL locale
const dbConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'nadalawi',
  database: process.env.DB_NAME || 'db_picture',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true
  }
};

async function createDatabaseIfNotExists() {
  // Créer une connexion sans spécifier la base de données
  const tempSequelize = new Sequelize({
    username: dbConfig.username,
    password: dbConfig.password,
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: false
  });

  try {
    // Créer la base de données si elle n'existe pas
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    console.log(`✅ Base de données '${dbConfig.database}' vérifiée/créée.`);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la base de données:', error);
    throw error;
  } finally {
    await tempSequelize.close();
  }
}

async function migrate() {
  console.log('Début de la migration...');
  
  try {
    // Créer la base de données si elle n'existe pas
    await createDatabaseIfNotExists();
    
    // Se connecter à la base de données
    const sequelize = new Sequelize(dbConfig);
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données MySQL réussie.');
    
    // Charger les modèles
    const User = (await import('./models/User.js')).default;
    const Photo = (await import('./models/Photo.js')).default;
    
    // Synchroniser les modèles avec la base de données
    console.log('🔄 Synchronisation des modèles avec la base de données...');
    await sequelize.sync({ alter: true });
    
    console.log('✅ Migration terminée avec succès !');
    
    // Vérifier les tables créées
    const [tables] = await sequelize.query('SHOW TABLES;');
    console.log('\n📋 Tables disponibles dans la base de données:');
    console.table(tables.map(t => ({ Table: Object.values(t)[0] })));
    
    // Compter les enregistrements
    try {
      const usersCount = await User.count();
      const photosCount = await Photo.count();
      console.log(`\n📊 Nombre d'utilisateurs: ${usersCount}`);
      console.log(`📊 Nombre de photos: ${photosCount}`);
    } catch (countError) {
      console.log('\nℹ️ Impossible de compter les enregistrements. Les tables sont peut-être vides.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  }
}

migrate();
