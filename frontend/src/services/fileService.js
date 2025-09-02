import api from './api';

const getFiles = (params) => {
  return api.get('/files', { params });
};


const renameFile = (id, newName) => {
  return api.put(`/files/${id}`, { filename: newName });
};

const deleteFile = (id) => {
  return api.delete(`/files/${id}`);
};

const fileService = {
  getFiles,
  renameFile,
  deleteFile,
};

export default fileService;
