import api from './api';

/**
 * Service pour la gestion admin des empreintes
 */

// Récupérer toutes les empreintes (tous utilisateurs)
export const getAllEmpreintes = async (params = {}) => {
  const { status, search, userId, page = 1, limit = 50 } = params;
  const queryParams = new URLSearchParams();
  
  if (status && status !== 'all') queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  if (userId) queryParams.append('userId', userId);
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  const response = await api.get(`/empreintes/admin/all?${queryParams.toString()}`);
  return response.data;
};

// Récupérer les statistiques globales
export const getEmpreintesStats = async () => {
  const response = await api.get('/empreintes/admin/stats');
  return response.data;
};

// Récupérer les stats par utilisateur
export const getEmpreintesUsers = async () => {
  const response = await api.get('/empreintes/admin/users');
  return response.data;
};

// Récupérer les détails d'une empreinte
export const getEmpreinteDetails = async (id) => {
  const response = await api.get(`/empreintes/admin/${id}`);
  return response.data;
};

const empreinteAdminService = {
  getAllEmpreintes,
  getEmpreintesStats,
  getEmpreintesUsers,
  getEmpreinteDetails
};

export default empreinteAdminService;
