import React from 'react';
import UserAvatar from './UserAvatar';

/**
 * Composant centralisé pour l'avatar intelligent
 * - Comptes Google avec photo → photo Google
 * - Comptes Google sans photo → initiales seulement
 * - Comptes locaux → avatar généré
 */
const SmartAvatar = ({ user, size = 40, className = '', style = {} }) => {
  const [imageError, setImageError] = React.useState(false);

  // Reset de l'erreur si l'utilisateur ou l'avatar_url change
  React.useEffect(() => {
    setImageError(false);
  }, [user?.avatar_url]);

  // Fonction pour générer les initiales
  const getInitials = (name) => {
    if (!name) return '?';
    
    // Si c'est un email, prendre la partie avant @
    const cleanName = name.includes('@') ? name.split('@')[0] : name;
    
    // Diviser par espaces, points, underscores, etc.
    const parts = cleanName.split(/[\s._-]+/).filter(part => part.length > 0);
    
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    // Prendre la première lettre des deux premiers mots
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

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
          console.log('Erreur chargement avatar Google, basculement vers initiales');
          setImageError(true);
        }}
      />
    );
  }

  // Si c'est un compte Google sans photo ou avec erreur de chargement → initiales seulement
  if (user?.provider === 'google') {
    const initials = getInitials(user?.username || user?.email);
    const backgroundColor = '#4285f4'; // Couleur Google
    
    return (
      <div 
        className={className}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          borderRadius: '50%', 
          backgroundColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.4}px`,
          fontWeight: '600',
          border: '2px solid var(--border-color)',
          ...style
        }}
      >
        {initials}
      </div>
    );
  }

  // Pour les comptes locaux → avatar généré
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
