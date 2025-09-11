import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
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
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hifadhui',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  dbConfig
);

export { sequelize };
