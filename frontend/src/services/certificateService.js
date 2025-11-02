import api from './api';

/**
 * Service pour gérer les certificats d'authenticité
 */
const certificateService = {
  /**
   * Télécharger le certificat PDF d'un fichier
   * @param {string} fileId - ID du fichier
   * @returns {Promise<Blob>} - Blob du PDF
   */
  async downloadCertificate(fileId) {
    try {
      const response = await api.get(`/certificates/${fileId}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement du certificat:', error);
      throw error;
    }
  },

  /**
   * Obtenir les métadonnées du certificat (preview)
   * @param {string} fileId - ID du fichier
   * @returns {Promise<Object>} - Métadonnées du certificat
   */
  async getCertificatePreview(fileId) {
    try {
      const response = await api.get(`/certificates/${fileId}/preview`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées:', error);
      throw error;
    }
  },

  /**
   * Vérifier un fichier par son hash
   * @param {string} hash - Hash SHA-256 du fichier
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async verifyByHash(hash) {
    try {
      const response = await api.get(`/verify/${hash}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification par hash:', error);
      throw error;
    }
  },

  /**
   * Vérifier un fichier en l'uploadant
   * @param {File} file - Fichier à vérifier
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async verifyByFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/verify/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification par fichier:', error);
      throw error;
    }
  },

  /**
   * Vérifier un hash fourni manuellement
   * @param {string} hash - Hash à vérifier
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async verifyHashManually(hash) {
    try {
      const response = await api.post('/verify/hash', { hash });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification manuelle:', error);
      throw error;
    }
  },

  /**
   * Télécharger le certificat et déclencher le téléchargement dans le navigateur
   * @param {string} fileId - ID du fichier
   * @param {string} filename - Nom du fichier original
   */
  async downloadAndSaveCertificate(fileId, filename) {
    try {
      const blob = await this.downloadCertificate(fileId);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nom du fichier PDF
      const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `certificat_${sanitizedFilename}.pdf`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }
};

export default certificateService;
