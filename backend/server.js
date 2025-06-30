import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { Sequelize, DataTypes } from "sequelize"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Création du dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite à 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Seules les images sont autorisées!"))
    }
  },
})

const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Configuration de la base de données
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: !isProduction ? console.log : false,
  dialectOptions: {}
};

// Configuration SSL pour la production (PostgreSQL)
if (isProduction && process.env.DB_SSL === 'true') {
  dbConfig.dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

// Initialisation de Sequelize
const sequelize = new Sequelize(dbConfig);

// Modèles
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Photo = sequelize.define('Photo', {
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  filepath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  upload_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'photos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relations
User.hasMany(Photo, { foreignKey: 'user_id' });
Photo.belongsTo(User, { foreignKey: 'user_id' });

// Synchronisation des modèles avec la base de données
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
    
    // En développement, on force la synchronisation (à ne pas faire en production)
    if (!isProduction) {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

syncDatabase();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET || "votre_clé_secrète", (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Routes
app.get("/", (req, res) => {
  res.send("API Hifadhui fonctionne correctement")
})

// Inscription
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouvel utilisateur
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      userId: user.id,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Connexion
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Télécharger une photo
app.post("/api/photos", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;
    const filename = req.file.filename;
    const filepath = `/uploads/${filename}`;

    // Créer une nouvelle photo
    const photo = await Photo.create({
      user_id: userId,
      title,
      description,
      filepath,
      upload_date: new Date(),
    });

    res.status(201).json({
      message: "Photo téléchargée avec succès",
      photo: {
        id: photo.id,
        title: photo.title,
        description: photo.description,
        filepath: photo.filepath,
        userId: photo.user_id,
      },
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement de la photo:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer toutes les photos d'un utilisateur
app.get("/api/photos", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const photos = await Photo.findAll({
      where: { user_id: userId },
      order: [[ 'upload_date', 'DESC' ]],
    });

    res.json(photos);
  } catch (error) {
    console.error("Erreur lors de la récupération des photos:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer une photo spécifique
app.get("/api/photos/:id", authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = await Photo.findOne({
      where: { id: photoId, user_id: userId }
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo non trouvée" });
    }

    res.json(photo);
  } catch (error) {
    console.error("Erreur lors de la récupération de la photo:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer une photo
app.delete("/api/photos/:id", authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    // Récupérer et vérifier la photo
    const photo = await Photo.findOne({
      where: { id: photoId, user_id: userId },
      transaction: t
    });

    if (!photo) {
      await t.rollback();
      return res.status(404).json({ message: "Photo non trouvée ou accès non autorisé" });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, photo.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'entrée de la base de données
    await photo.destroy({ transaction: t });
    await t.commit();

    res.json({ message: "Photo supprimée avec succès" });
  } catch (error) {
    await t.rollback();
    console.error("Erreur lors de la suppression de la photo:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Fonction pour copier les images de robots dans le dossier uploads
const copyRobotImages = async () => {
  const robotImages = [
    { name: "MechaByte.png", source: path.join(__dirname, "../uploads/MechaByte.png") },
    { name: "AstroBot.png", source: path.join(__dirname, "../uploads/AstroBot.png") },
    { name: "ByteBot.png", source: path.join(__dirname, "../uploads/ByteBot.png") },
    { name: "Hifahdui.png", source: path.join(__dirname, "../uploads/Hifahdui.png") },
  ];

  for (const image of robotImages) {
    const destPath = path.join(uploadsDir, image.name);

    // Vérifier si l'image source existe
    if (fs.existsSync(image.source)) {
      // Vérifier si l'image n'existe pas déjà dans le dossier uploads
      if (!fs.existsSync(destPath)) {
        try {
          // Copier l'image
          fs.copyFileSync(image.source, destPath);
          console.log(`Image ${image.name} copiée avec succès`);
        } catch (error) {
          console.error(`Erreur lors de la copie de l'image ${image.name}:`, error);
        }
      }
    } else {
      console.warn(`L'image source ${image.source} n'existe pas`);
    }
  }
};

// Démarrer le serveur
app.listen(PORT, async () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  
  // Copier les images de robots
  try {
    await copyRobotImages();
  } catch (error) {
    console.error("Erreur lors de la copie des images de robots:", error);
  }
});

export default app
