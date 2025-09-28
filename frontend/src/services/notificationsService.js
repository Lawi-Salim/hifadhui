const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class NotificationsService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications`;
  }

  /**
   * Récupère le token d'authentification
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Headers par défaut avec authentification
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    };
  }

  /**
   * Gestion des réponses HTTP
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || `Erreur HTTP: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Récupère toutes les notifications avec pagination et filtres
   */
  async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${this.baseURL}?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des notifications
   */
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupère une notification spécifique
   */
  async getNotification(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de la notification:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle notification
   */
  async createNotification(notificationData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notificationData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/read`, {
        method: 'PATCH',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * Archive une notification
   */
  async archiveNotification(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/archive`, {
        method: 'PATCH',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      throw error;
    }
  }

  /**
   * Marque plusieurs notifications comme lues
   */
  async markMultipleAsRead(ids) {
    try {
      const response = await fetch(`${this.baseURL}/bulk/read`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ ids })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors du marquage en lot:', error);
      throw error;
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
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
   * Récupère les notifications non lues
   */
  async getUnreadNotifications(limit = 10) {
    return await this.getNotifications({
      status: 'unread',
      limit,
      page: 1
    });
  }

  /**
   * Récupère les notifications par type
   */
  async getNotificationsByType(type, limit = 20) {
    return await this.getNotifications({
      type,
      limit,
      page: 1
    });
  }

  /**
   * Récupère les notifications urgentes
   */
  async getUrgentNotifications() {
    return await this.getNotifications({
      priority: 'urgent',
      status: 'unread',
      limit: 50
    });
  }

  /**
   * Recherche dans les notifications
   */
  async searchNotifications(query, filters = {}) {
    return await this.getNotifications({
      search: query,
      ...filters
    });
  }
}

export default new NotificationsService();
