import api from './api';

class BulkActionsService {
  // Déplacer des éléments vers un dossier
  async moveItems(itemIds, targetDossierId, itemType = 'file') {
    try {
      console.log('🔄 [FRONTEND] Déplacement demandé:', { itemIds, targetDossierId, itemType });
      const response = await api.post('/bulk-actions/move', {
        itemIds,
        targetDossierId,
        itemType
      });
      console.log('✅ [FRONTEND] Déplacement réussi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND] Erreur lors du déplacement:', error);
      throw error;
    }
  }

  // Copier des éléments vers un dossier
  async copyItems(itemIds, targetDossierId, itemType = 'file') {
    try {
      console.log('📋 [FRONTEND] Copie demandée:', { itemIds, targetDossierId, itemType });
      const response = await api.post('/bulk-actions/copy', {
        itemIds,
        targetDossierId,
        itemType
      });
      console.log('✅ [FRONTEND] Copie réussie:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND] Erreur lors de la copie:', error);
      throw error;
    }
  }

  // Supprimer des éléments en lot
  async deleteItems(itemIds, itemType = 'file') {
    try {
      const response = await api.delete('/bulk-actions/delete', {
        data: {
          itemIds,
          itemType
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  // Récupérer la liste des dossiers pour sélection
  async getFoldersForSelection() {
    try {
      const response = await api.get('/bulk-actions/folders-tree');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers:', error);
      throw error;
    }
  }

  // Vérifier les conflits avant déplacement/copie
  async checkConflicts(itemIds, targetDossierId, operation = 'move') {
    try {
      const response = await api.post('/bulk-actions/check-conflicts', {
        itemIds,
        targetDossierId,
        operation
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification des conflits:', error);
      throw error;
    }
  }
}

export default new BulkActionsService();
