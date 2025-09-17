import { Sequelize } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  dialectModule: pg,
  logging: false, // Désactiver les logs SQL
  dialectOptions: {
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  sync: { force: false, alter: false },
};

// Pour la production (Vercel + Supabase), nous devons activer SSL
// Forcer la production si on détecte Vercel ou si NODE_ENV n'est pas défini et qu'on a des credentials Supabase
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.VERCEL === '1' || 
                    (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.com'));

if (isProduction) {
  dbConfig.dialectOptions = {
    ...dbConfig.dialectOptions,
    ssl: {
      require: true,
      rejectUnauthorized: false, // Nécessaire pour les connexions à Supabase
    },
  };
  
  // Configuration spéciale pour Vercel + Supabase - Pool ultra-conservateur
  dbConfig.pool = {
    max: 1,           // Une seule connexion max
    min: 0,           // Aucune connexion minimum
    acquire: 60000,   // Attendre 60s pour acquérir une connexion
    idle: 1000,       // Fermer après 1s d'inactivité
    evict: 500,       // Vérifier toutes les 500ms
  };
  
  // Forcer la fermeture des connexions inactives
  dbConfig.dialectOptions.keepAlive = false;
  dbConfig.dialectOptions.keepAliveInitialDelayMillis = 0;
}

const useDatabaseUrl = Boolean(process.env.DATABASE_URL);

const sequelize = useDatabaseUrl
  ? new Sequelize(process.env.DATABASE_URL, dbConfig)
  : new Sequelize(
      process.env.DB_NAME || 'hifadhui',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD,
      dbConfig
    );

// Gestion des connexions pour Vercel serverless
if (isProduction) {
  // Fermer toutes les connexions à la fin de chaque requête
  process.on('beforeExit', async () => {
    try {
      await sequelize.close();
      console.log('🔌 [DB] Connexions fermées avant sortie');
    } catch (error) {
      console.error('❌ [DB] Erreur fermeture connexions:', error);
    }
  });

  // Timeout de sécurité pour fermer les connexions inactives
  setInterval(async () => {
    try {
      const pool = sequelize.connectionManager.pool;
      if (pool && pool.numUsed() === 0 && pool.numFree() > 0) {
        await pool.clear();
        console.log('🧹 [DB] Pool nettoyé automatiquement');
      }
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  }, 30000); // Toutes les 30 secondes
}

export { sequelize };
