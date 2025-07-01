# Guide de Déploiement Vercel

## Configuration requise

### 1. Variables d'environnement Vercel

Dans votre dashboard Vercel, configurez les variables d'environnement suivantes :

**Variables pour le Backend :**
- `NODE_ENV=production`
- `DB_HOST` (votre hôte de base de données de production)
- `DB_PORT` (port de votre base de données)
- `DB_NAME` (nom de votre base de données)
- `DB_USER` (utilisateur de votre base de données)
- `DB_PASSWORD` (mot de passe de votre base de données)
- `JWT_SECRET` (clé secrète pour JWT)

**Variables pour le Frontend :**
- `REACT_APP_API_URL=/api`

### 2. Structure du projet

Assurez-vous que votre projet a la structure suivante :
```
/
├── backend/
│   ├── server.js
│   ├── app.js
│   └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
└── vercel.json
```

### 3. Déploiement

1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement dans le dashboard Vercel
3. Déployez votre projet

### 4. Vérification

Après le déploiement, testez :
- L'inscription : `POST /api/auth/register`
- La connexion : `POST /api/auth/login`
- L'accès aux photos : `GET /api/photos`

## Résolution des problèmes

### Erreur 405 (Method Not Allowed)
- Vérifiez que votre `vercel.json` est correctement configuré
- Assurez-vous que les routes API sont bien définies dans `backend/routes/`
- Vérifiez que CORS est correctement configuré

### Erreur de base de données
- Vérifiez que vos variables d'environnement de base de données sont correctes
- Assurez-vous que votre base de données est accessible depuis Vercel

### Erreur de build
- Vérifiez que tous les packages sont installés
- Assurez-vous que les scripts de build sont corrects 