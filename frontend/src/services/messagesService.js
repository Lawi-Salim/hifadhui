/**
 * Service pour la gestion des messages
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class MessagesService {
  /**
   * Récupère le token d'authentification
   */
  getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  /**
   * Headers par défaut avec authentification
   */
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Gestion des erreurs API
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || `Erreur HTTP ${response.status}`);
    }
    return response.json();
  }

  /**
   * Récupère les statistiques des messages
   */
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des messages avec pagination et filtres
   */
  async getMessages(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Paramètres de pagination avec valeurs par défaut
      queryParams.append('page', params.page || 1);
      queryParams.append('limit', params.limit || 20);
      
      // Filtres
      if (params.tab) queryParams.append('tab', params.tab);
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.priority) queryParams.append('priority', params.priority);

      const response = await fetch(`${API_BASE_URL}/messages?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  /**
   * Récupère un message spécifique
   */
  async getMessage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du message:', error);
      throw error;
    }
  }

  /**
   * Marque un message comme lu
   */
  async markAsRead(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}/read`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * Marque un message comme répondu
   */
  async markAsReplied(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}/reply`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors du marquage comme répondu:', error);
      throw error;
    }
  }

  /**
   * Archive un message
   */
  async archiveMessage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}/archive`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      throw error;
    }
  }

  /**
   * Supprime un message
   */
  async deleteMessage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau message (envoi d'email)
   */
  async createMessage(messageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw error;
    }
  }

  /**
   * Répond à un message spécifique
   */
  async replyToMessage(messageId, replyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reply`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(replyData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      throw error;
    }
  }

  /**
   * Récupère les messages de contact récents
   */
  async getRecentContactMessages(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/contact/recent?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages récents:', error);
      throw error;
    }
  }

  /**
   * Récupère les emails envoyés récents
   */
  async getRecentSentEmails(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/sent/recent?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des emails récents:', error);
      throw error;
    }
  }

  /**
   * Actions en lot sur plusieurs messages
   */
  async bulkAction(action, messageIds) {
    try {
      const promises = messageIds.map(id => {
        switch (action) {
          case 'markAsRead':
            return this.markAsRead(id);
          case 'archive':
            return this.archiveMessage(id);
          case 'delete':
            return this.deleteMessage(id);
          default:
            throw new Error(`Action non supportée: ${action}`);
        }
      });

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        successful,
        failed,
        total: messageIds.length,
        results
      };
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error);
      throw error;
    }
  }

  /**
   * Recherche dans les messages
   */
  async searchMessages(query, filters = {}) {
    try {
      const params = {
        search: query,
        ...filters
      };
      return await this.getMessages(params);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  }

  /**
   * Marque plusieurs messages comme lus
   */
  async markMultipleAsRead(ids) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/bulk/read`, {
        method: 'PUT',  // Utilise PUT comme défini dans la route backend
        headers: this.getHeaders(),
        body: JSON.stringify({ ids })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors du marquage en lot:', error);
      throw error;
    }
  }
}

// Export d'une instance singleton
const messagesService = new MessagesService();
export default messagesService;
