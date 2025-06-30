# Hifadhui Backend

Backend pour l'application de stockage et de partage de photos Hifadhui.

## Prérequis

- Node.js (version 14 ou supérieure)
- PostgreSQL (version 12 ou supérieure)
- npm ou yarn

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/hifadhui.git
   cd hifadhui/backend
   ```

2. Installer les dépendances :
   ```bash
   npm install
   # ou
   yarn
   ```

3. Configurer l'environnement :
   ```bash
   cp .env.example .env
   ```
   Puis éditez le fichier `.env` avec vos paramètres.

4. Démarrer la base de données PostgreSQL et s'assurer qu'elle est accessible avec les identifiants configurés dans `.env`.

## Démarrage

### Mode développement

```bash
npm run dev
# ou
yarn dev
```

Le serveur démarrera sur `http://localhost:5000` par défaut.

### Mode production

```bash
npm start
# ou
yarn start
```

## Structure du projet

```
backend/
├── config/           # Configuration de l'application
│   ├── cors.js       # Configuration CORS
│   ├── database.js   # Configuration de la base de données
│   └── multer.js     # Configuration du middleware multer pour le téléchargement de fichiers
├── middlewares/      # Middlewares personnalisés
│   └── auth.js       # Middleware d'authentification
├── models/           # Modèles Sequelize
│   ├── index.js      # Initialisation des modèles
│   ├── User.js       # Modèle utilisateur
│   └── Photo.js      # Modèle photo
├── routes/           # Routes de l'API
│   ├── auth.js       # Routes d'authentification
│   ├── photos.js     # Routes des photos
│   └── index.js      # Regroupement des routes
├── utils/            # Utilitaires
│   └── fileUtils.js  # Fonctions utilitaires pour les fichiers
├── uploads/          # Dossier de stockage des fichiers téléchargés
├── app.js            # Configuration d'Express
└── server.js         # Point d'entrée du serveur
```

## API Documentation

### Authentification

- `POST /api/auth/register` - S'inscrire
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Récupérer le profil de l'utilisateur connecté

### Photos

- `GET /api/photos` - Récupérer toutes les photos publiques
- `GET /api/photos/user/:userId` - Récupérer les photos d'un utilisateur
- `POST /api/photos` - Téléverser une nouvelle photo
- `PUT /api/photos/:id` - Mettre à jour une photo
- `DELETE /api/photos/:id` - Supprimer une photo

## Tests

```bash
npm test
# ou
yarn test
```

## Déploiement

### Préparation pour la production

1. Assurez-vous que toutes les variables d'environnement sont correctement configurées dans `.env`
2. Construisez l'application :
   ```bash
   npm run build
   # ou
   yarn build
   ```

### Avec PM2 (recommandé pour la production)

1. Installez PM2 globalement :
   ```bash
   npm install -g pm2
   ```

2. Démarrez l'application avec PM2 :
   ```bash
   pm2 start server.js --name "hifadhui-backend"
   ```

3. Configurez PM2 pour démarrer automatiquement au démarrage :
   ```bash
   pm2 startup
   pm2 save
   ```

## Licence

MIT
