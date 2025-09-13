### Coffre-fort numérique (hifadhwi)
Un outil personnel qui permet de stocker des documents numériques et permet la preuve de ma propriété sur ces documents.

---

### Suivi des Fonctionnalités

| Date | Fonctionnalité | Statut |
| :--- | :--- | :--- |
| **Il y a 3 jours** | **Initialisation & Fichiers** | ✅ Terminé |
| | Modélisation de la base de données | ✅ Terminé |
| | Connexion à la base de données | ✅ Terminé |
| | Création d'un admin par défaut | ✅ Terminé |
| | Upload de fichiers (JPG, PNG, PDF) avec signature SHA-256 et certificat | ✅ Terminé |
| | Ajout de la table `Dossier` | ✅ Terminé |
| **Il y a 2 jours** | **Gestion des Dossiers & ZIP** | ✅ Terminé |
| | Upload et extraction d'archives ZIP | ✅ Terminé |
| | Création automatique de dossiers post-extraction | ✅ Terminé |
| | CRUD pour les dossiers (Créer, Renommer, Supprimer) | ✅ Terminé |
| | [Admin] Filtrage des utilisateurs inscrits | ✅ Terminé |
| **Hier** | **Panel Admin** | ✅ Terminé |
| | [Admin] Suite liste des utilisateurs | ✅ Terminé |
| | [Admin] Suivi des activités des utilisateurs | ✅ Terminé |
| **Aujourd'hui** | **Améliorations & Corrections** | ✅ Terminé |
| | [Admin] Suite suivi des activités des utilisateurs | ✅ Terminé |
| | Suppression multiple d'images (coche) | ✅ Terminé |
| | Correction bug suppression par lot (Backend & Frontend) | ✅ Terminé |
| | Remplacement alerte par modale de suppression | ✅ Terminé |
| | Correction du design - Détails d'activité utilisateur | ✅ Terminé |
| | Refactorisation et centralisation des modales | ✅ Terminé |
| | Système de partage sécurisé de fichiers avec filigrane | ✅ Terminé |

---

## 🚀 Fonctionnalités Futures

## 29/08/2025
### 📊 Statistiques de partage
- Voir combien de fois un fichier a été consulté
- Historique des accès avec dates et heures
- Graphiques d'utilisation

### ⏰ Gestion avancée d'expiration
- Choisir la durée d'expiration (1h, 24h, 7j, 30j, jamais)
- Notification avant expiration
- Renouvellement automatique

### 🔐 Partage avec mot de passe
- Protection par mot de passe optionnelle
- Génération automatique de mots de passe sécurisés
- Chiffrement des liens sensibles

### 📧 Partage par email
- Envoyer le lien directement par email
- Templates d'emails personnalisables
- Notifications de consultation

### 📱 QR Code
- Générer un QR code pour le partage mobile
- Téléchargement du QR code en PNG
- Intégration dans les emails

### 🏆 Certificats avec QR Code
- QR codes dans les certificats PDF pour vérification en ligne
- Page de vérification publique `/verify/:certId`
- Validation de l'authenticité via QR code scan
- Intégration avec domaine de production (hifadhui.site)

### 👥 Partage en lot
- Partager plusieurs fichiers en une fois
- Création d'albums temporaires
- Gestion groupée des expirations

---
## 30/08/2025

### 🔑 Plan d'Implémentation - Fonctionnalité Mot de Passe Oublié

### État Actuel Analysé
- **Frontend** : Composant `ForgotPassword.jsx` existe mais est statique (interface seulement)
- **Backend** : Aucune route pour la réinitialisation dans `auth.js`
- **Base de données** : Pas de modèle pour les tokens de réinitialisation
- **Email** : Aucune configuration d'envoi d'emails

### Architecture Proposée

#### 1. Backend (Priorité Haute)
- **Nouveau modèle** : `PasswordResetToken.js`
  - Champs : `token`, `email`, `expires_at`, `used`
  - Relations avec le modèle `Utilisateur`
- **Routes API** :
  - `POST /auth/forgot-password` : Génère et envoie le token
  - `POST /auth/reset-password` : Valide le token et met à jour le mot de passe
- **Service Email** : Configuration Nodemailer avec templates HTML

#### 2. Frontend (Priorité Moyenne)
- **Mise à jour** `ForgotPassword.jsx` : Ajouter la logique de soumission
- **Nouveau composant** `ResetPassword.jsx` : Page de réinitialisation avec token
- **Routes** : Ajouter `/reset-password/:token` dans `App.js`
- **Gestion d'état** : Loading, erreurs, succès

#### 3. Sécurité & Validation
- **Tokens sécurisés** : UUID v4 avec expiration (15 minutes)
- **Rate limiting** : Limitation des demandes par IP/email
- **Validation** : Côté client et serveur
- **Nettoyage** : Suppression automatique des tokens expirés

### Flux Utilisateur Complet
1. **Demande** : Utilisateur saisit email → Génération token → Envoi email
2. **Validation** : Clic lien email → Vérification token → Page réinitialisation
3. **Réinitialisation** : Nouveau mot de passe → Validation → Mise à jour BDD
4. **Confirmation** : Redirection login avec message de succès

### Ordre d'Implémentation Recommandé
1. Modèle `PasswordResetToken` + migration
2. Configuration service email (Nodemailer)
3. Routes backend avec validation
4. Tests des endpoints API
5. Mise à jour composant `ForgotPassword.jsx`
6. Création composant `ResetPassword.jsx`
7. Ajout routes frontend
8. Tests end-to-end du flux complet