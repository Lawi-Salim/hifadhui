import api from './api';

const getFiles = (paramsOrPage = {}, limit = 10, dossierId = null) => {
  // Support pour les deux formats : objet de paramètres OU paramètres séparés
  let params;
  
  if (typeof paramsOrPage === 'object' && paramsOrPage !== null) {
    // Format objet (utilisé par useInfiniteScroll)
    params = { ...paramsOrPage };
  } else {
    // Format paramètres séparés (rétrocompatibilité)
    params = { 
      page: paramsOrPage || 1, 
      limit: limit || 10 
    };
    if (dossierId) params.dossierId = dossierId;
  }
  
  console.log('📄 [fileService.getFiles] Paramètres envoyés:', params);
  return api.get('/files', { params });
};

const renameFile = (id, newName) => {
  return api.put(`/files/${id}`, { filename: newName });
};

const deleteFile = (id) => {
  return api.delete(`/files/${id}`);
};

const getFileById = (id) => {
  return api.get(`/files/${id}`);
};

// Service pour la suppression de compte
const deleteAccount = (password = null) => {
  const data = password ? { password } : {};
  return api.delete('/auth/delete-account', { data });
};

const fileService = {
  getFiles,
  renameFile,
  deleteFile,
  getFileById,
  deleteAccount,
};

export default fileService;
