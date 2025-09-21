import React from 'react';
import UserAvatar from './UserAvatar';

/**
 * Composant centralisé pour l'avatar intelligent
 * - Comptes Google avec photo → photo Google
 * - Comptes Google sans photo → avatar généré
 * - Comptes locaux → avatar généré
 */
const SmartAvatar = ({ user, size = 40, className = '', style = {} }) => {
  const [imageError, setImageError] = React.useState(false);

  // Reset de l'erreur si l'utilisateur ou l'avatar_url change
  React.useEffect(() => {
    setImageError(false);
  }, [user?.avatar_url]);

  // Si c'est un compte Google avec une photo valide ET pas d'erreur de chargement
  if (user?.provider === 'google' && user?.avatar_url && user.avatar_url.trim() !== '' && !imageError) {
    return (
      <img 
        src={user.avatar_url} 
        alt="Avatar" 
        className={className}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          borderRadius: '50%', 
          objectFit: 'cover',
          border: '2px solid var(--border-color)',
          ...style
        }}
        onError={() => {
          console.log('Erreur chargement avatar Google, basculement vers avatar généré');
          setImageError(true);
        }}
      />
    );
  }

  // Pour tous les autres cas (compte local, Google sans photo, ou erreur de chargement)
  return (
    <UserAvatar 
      name={user?.username || user?.email} 
      size={size} 
      className={className}
      style={style}
    />
  );
};

export default SmartAvatar;
