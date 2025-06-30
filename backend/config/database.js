import { Sequelize } from "sequelize"
import dotenv from "dotenv"

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = isProduction ? {
  // Configuration pour la production (PostgreSQL sur Supabase)
  database: process.env.DB_NAME || "postgres",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  host: process.env.DB_HOST || "db.epphyztkmvhcablsarqy.supabase.co",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
} : {
  // Configuration pour le développement (MySQL local)
  database: process.env.DB_NAME || "db_picture",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "nadalawi",
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
  logging: console.log,
  dialectOptions: {
    ssl: false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
      underscored: true
    },
    timezone: '+03:00' // Fuseau horaire de l'Afrique de l'Est (Tanzanie)
  }
)

// Tester la connexion à la base de données
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('Impossible de se connecter à la base de données:', error);
    return false;
  }
}

testConnection();

export { sequelize, Sequelize }
