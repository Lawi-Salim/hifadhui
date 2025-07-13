import { User } from './User.js';
import { Photo } from './Photo.js';

// Définir les associations
User.hasMany(Photo, { 
  foreignKey: 'user_id',
  as: 'photos'
});

Photo.belongsTo(User, { 
  foreignKey: 'user_id',
  as: 'user'
});

export { User, Photo };
