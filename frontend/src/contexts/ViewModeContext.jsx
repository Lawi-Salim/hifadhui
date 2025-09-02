import React, { createContext, useState, useContext, useEffect } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => useContext(ViewModeContext);

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('viewMode');
    return savedMode || 'grid'; // 'grid' or 'list'
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};
