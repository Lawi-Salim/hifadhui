import React, { createContext, useMemo, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Forcer le thème sombre uniquement
  const theme = 'dark';

  useEffect(() => {
    // Forcer le thème sombre au chargement
    document.body.className = 'dark-theme';
    // Nettoyer le localStorage du thème
    localStorage.removeItem('theme');
  }, []);

  const value = useMemo(() => ({
    theme
    // toggleTheme supprimé car plus nécessaire
  }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
