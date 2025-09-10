import React from 'react';
import { formatFilename, normalizeFilename, fixEncoding } from '../../utils/textUtils';

/**
 * Composant pour afficher du texte formaté avec correction d'encodage
 */
const FormattedText = ({ 
  text, 
  type = 'text', 
  maxLength = null, 
  hideExtension = false,
  className = '',
  title = null,
  ...props 
}) => {
  if (!text) return null;

  let formattedText = text;

  switch (type) {
    case 'filename':
      formattedText = formatFilename(text, maxLength, hideExtension);
      break;
    case 'normalize':
      formattedText = normalizeFilename(text);
      break;
    case 'encoding':
      formattedText = fixEncoding(text);
      break;
    default:
      formattedText = fixEncoding(text);
  }

  return (
    <span 
      className={className}
      title={title || (maxLength && formattedText.includes('...') ? fixEncoding(text) : undefined)}
      {...props}
    >
      {formattedText}
    </span>
  );
};

export default FormattedText;
