import api from './api';

const getDossiers = () => {
  return api.get('/dossiers');
};

const createDossier = (dossierData) => {
  return api.post('/dossiers', dossierData);
};

const getDossierById = (id) => {
  return api.get(`/dossiers/${id}`);
};

const getDossierByPath = (path) => {
  return api.get(`/dossiers/by-path/${encodeURIComponent(path)}`);
};

const uploadZipToDossier = (dossierId, formData) => {
  return api.post(`/dossiers/${dossierId}/upload-zip`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const renameDossier = (id, newName) => {
  return api.put(`/dossiers/${id}`, { name: newName });
};

const deleteDossier = async (id) => {
  try {
    const response = await api.delete(`/dossiers/${id}`, {
      timeout: 120000 // 2 minutes pour les dossiers volumineux
    });
    return response;
  } catch (error) {
    // Si le serveur retourne 204 (No Content), c'est un succès
    if (error.response?.status === 204) {
      return { status: 204, data: null };
    }
    throw error;
  }
};

const dossierService = {
  getDossiers,
  createDossier,
  getDossierById,
  getDossierByPath,
  uploadZipToDossier,
  renameDossier,
  deleteDossier,
};

export default dossierService;
