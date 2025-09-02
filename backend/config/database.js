const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
if (process.env.NODE_ENV === 'production') {
  dbConfig.dialectOptions = {
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

module.exports = { sequelize };
