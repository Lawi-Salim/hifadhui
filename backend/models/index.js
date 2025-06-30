import { User } from './User.js';
import { Photo } from './Photo.js';

// Définition des relations entre les modèles
User.hasMany(Photo, { foreignKey: 'user_id' });
Photo.belongsTo(User, { foreignKey: 'user_id' });

export { User, Photo };
