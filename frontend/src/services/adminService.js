import api from './api';

export const getUsers = async (page = 1, limit = 10) => {
  const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
  return response.data;
};

export const getActivities = (page = 1, limit = 20) => {
  return api.get(`/admin/activities?page=${page}&limit=${limit}`);
};

export const getActivitySummary = (page = 1, limit = 10) => {
  return api.get(`/admin/activities/summary?page=${page}&limit=${limit}`);
};

export const getUserActivityDetails = (userId) => {
  return api.get(`/admin/activities/user/${userId}`);
};

export const getAdminFiles = async (params) => {
  const response = await api.get('/admin/files', { params });
  return response;
};

const adminService = {
  getUsers,
  getActivities,
  getActivitySummary,
  getUserActivityDetails,
  getAdminFiles,
};

export default adminService;
