import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '.env.production') });

// Configuration pour Supabase
const supabaseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
};

async function migrateToSupabase() {
  console.log('🚀 Début de la migration vers Supabase...');
  
  const sequelize = new Sequelize(supabaseConfig);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à Supabase réussie.');
    
    // Charger les modèles
    const User = (await import('./models/User.js')).default;
    const Photo = (await import('./models/Photo.js')).default;
    
    console.log('🔄 Synchronisation des modèles avec Supabase...');
    await sequelize.sync({ alter: true });
    
    console.log('✅ Migration vers Supabase terminée avec succès !');
    
    // Vérifier les tables créées
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('\n📋 Tables disponibles dans Supabase:');
    console.table(tables.map(t => ({ Table: t.table_name })));
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration vers Supabase:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

migrateToSupabase();
