<div align="center">
  <img src="./frontend/public/favicon.png" alt="Hifadhui Logo" width="150"/>
  <h1 align="center">Hifadhui - Votre Coffre-fort Numérique</h1>
  <p align="center">
    <strong>Protégez, prouvez et partagez la propriété de vos créations numériques.</strong>
    <br />
    <a href="#-fonctionnalités-clés">Fonctionnalités</a> •
    <a href="#-architecture-technique">Architecture</a> •
    <a href="#-démarrage-rapide">Installation</a> •
    <a href="#-feuille-de-route">Feuille de route</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  </p>
</div>

---

## 🎯 Mission du Projet

**Hifadhui** (ou **Hifadhui** en comorien (shiKomori) qui signifie "préserver, protéger" comme en swahili) est un coffre-fort numérique personnel conçu pour les créateurs, artistes et développeurs. Il offre une solution robuste pour **stocker, gérer et prouver la propriété intellectuelle** de vos œuvres numériques (images, ebooks, documents, etc.).

Dans un monde où le contenu digital est facilement dupliqué, Hifadhui apporte une réponse claire en générant une **preuve d'antériorité infalsifiable** pour chaque fichier, vous donnant ainsi un avantage juridique en cas de litige sur les droits d'auteur.

**Pourquoi "Hifadhui" ?**

Le nom **"Hifadhui"** vient du swahili et signifie **"protéger, préserver"**. Ce nom symbolise parfaitement notre mission : protéger vos créations numériques et préserver vos droits de propriété intellectuelle.

**Quelques infos importantes**
  📧 *mavuna@hifadhui.site*

## ✨ Fonctionnalités Clés

Le projet intègre déjà un ensemble de fonctionnalités puissantes, et d'autres sont à venir.

- **🔒 Authentification Sécurisée** : Espace personnel protégé par JWT (JSON Web Tokens) pour une isolation totale des données de chaque utilisateur.

- **✍️ Preuve d'Antériorité Infalsifiable** : Chaque fichier est immédiatement traité pour générer une preuve de propriété robuste :
  - **Hash SHA-256 & Signature** : Une empreinte numérique unique qui garantit l'intégrité du fichier et une signature pour la traçabilité.

- **☁️ Stockage Cloud Optimisé** : Intégration avec **Cloudinary** pour un stockage sécurisé, rapide et organisé. Les fichiers sont classés dans des dossiers spécifiques (`images`, `pdfs`) pour maintenir une architecture propre.

- **🗂️ Gestion Hiérarchique de Fichiers** :
  - Créez des dossiers et des sous-dossiers à volonté.
  - Naviguez facilement grâce à un fil d'Ariane dynamique.
  - Uploadez une archive `.zip` pour recréer automatiquement une arborescence de dossiers.

- **✏️ Opérations CRUD Complètes** : Renommez et supprimez vos fichiers et dossiers. Toute suppression est synchronisée entre la base de données et Cloudinary pour optimiser le stockage.

- **🔗 Partage Sécurisé et Contrôlé** :
  - Générez des **liens de partage éphémères** (valides 24h) pour empêcher la redistribution non autorisée.
  - Les aperçus d'images et de PDFs sont **filigranés** avec l'email du propriétaire pour décourager le vol.
  - Le téléchargement direct depuis le lien de partage est désactivé.

- **👁️ Aperçus Intégrés** : Visualisez vos images et documents PDF directement depuis l'application, sans avoir à les télécharger.

- **👑 Panel Administrateur** : Une interface dédiée pour superviser les inscriptions et suivre les activités sur la plateforme.

## 🛠️ Architecture Technique

Le projet est construit sur une architecture full-stack moderne et découplée :

- **Frontend** : Une Single Page Application (SPA) développée avec **React**, offrant une interface utilisateur réactive et dynamique.
- **Backend** : Une API RESTful robuste construite avec **Node.js** et **Express**, gérant la logique métier, l'authentification et la communication avec les services tiers.
- **Base de Données** : **PostgreSQL** pour sa fiabilité et ses fonctionnalités avancées, utilisée pour stocker les métadonnées des fichiers, les informations des utilisateurs.
- **Stockage d'objets** : **Cloudinary** pour le stockage et la manipulation à la volée des fichiers médias (images, PDFs).

## 🚀 Démarrage Rapide

Suivez ces étapes pour lancer le projet en local.

### Prérequis
- Node.js (v18+)
- PostgreSQL
- Un compte Cloudinary

### 1. Cloner le Dépôt
```bash
git clone https://github.com/Lawi-Salim/hifadhui.git
cd hifadhui
```

### 2. Configurer le Backend
```bash
cd backend
yarn install

# Créez un fichier .env à partir de .env.example
cp .env.example .env
```
**Remplissez le fichier `.env`** avec vos informations de base de données et vos clés Cloudinary/JWT.

### 3. Configurer le Frontend
```bash
cd ../frontend
yarn install

# Créez un fichier .env à partir de .env.example
cp .env.example .env
```
**Remplissez le fichier `.env`** avec l'URL de votre API backend (`REACT_APP_API_BASE_URL`).

### 4. Lancer l'Application
```bash
# Dans le terminal du backend
yarn dev

# Dans le terminal du frontend
yarn start
```
L'application sera accessible sur `http://localhost:3000`.

## 🗺️ Feuille de Route

Le projet continue d'évoluer ! Voici les prochaines grandes étapes :

- **🔄 Mot de passe oublié** : Implémentation d'un flux complet de réinitialisation de mot de passe par email.
- **📊 Statistiques de Partage** : Suivi détaillé des consultations des liens partagés.
- **🔐 Options de Partage Avancées** : Protection par mot de passe, gestion des dates d'expiration, et partage par email.
- **📱 QR Codes** : Génération de QR codes pour un partage mobile facilité.

---

<p align="center">Développé avec ❤️ par Lawi Salim</p>
