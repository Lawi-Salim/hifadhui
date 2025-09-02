const { sequelize } = require('../config/database');
const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Vérifier si un admin existe déjà
    const existingAdmin = await Utilisateur.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà:', existingAdmin.email);
      console.log('🔄 Mise à jour des informations de l\'admin existant...');
      
      // Mettre à jour l'admin existant
      await existingAdmin.update({
        username: 'Lawi Salim',
        email: 'lawi@gmail.com',
        password: '123456', // Sera hashé automatiquement par le hook beforeUpdate
        role: 'admin'
      });
      
      console.log('✅ Administrateur mis à jour avec succès');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.username);
    } else {
      // Créer un nouvel admin
      const admin = await Utilisateur.create({
        username: 'Lawi Salim',
        email: 'lawi@gmail.com',
        password: '123456', // Sera hashé automatiquement par le hook beforeCreate
        role: 'admin'
      });

      console.log('✅ Administrateur créé avec succès');
      console.log('📧 Email:', admin.email);
      console.log('👤 Nom:', admin.username);
      console.log('🆔 ID:', admin.id);
    }

    console.log('\n🔐 Informations de connexion:');
    console.log('Email: lawi@gmail.com');
    console.log('Mot de passe: 123456');
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('📧 Un utilisateur avec cet email existe déjà');
    } else if (error.name === 'SequelizeValidationError') {
      console.log('❌ Erreur de validation:', error.errors.map(e => e.message).join(', '));
    }
  } finally {
    // Fermer la connexion
    await sequelize.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;