import React, { useState, useEffect, useCallback } from 'react';
import fileService from '../../services/fileService';
import api from '../../services/api';
import ItemList from '../Common/ItemList';
import DeleteFileModal from '../Common/DeleteFileModal';
import RenameFileModal from '../Common/RenameFileModal';
import FilePreviewModal from '../Common/FilePreviewModal';
import ShareModal from './ShareModal';
import { FaUpload, FaTrash } from 'react-icons/fa';
import ViewModeSwitcher from '../Common/ViewModeSwitcher';
import { Link } from 'react-router-dom';
import DeleteBatchModal from '../Images/DeleteBatchModal'; // Réutilisation de la modale existante
import Pagination from '../Pagination';
import './FileList.css';

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);

  // Fonction pour calculer la position du menu avec hauteur dynamique
  const getMenuPosition = (buttonElement, optionsCount = 5) => {
    if (!buttonElement) return 'bottom';
    
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
    const spaceBelow = viewportHeight - rect.bottom;
    
    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);

  const fetchFiles = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fileService.getFiles({ page, limit: 10 });
      setFiles(response.data.files || response.data);
      
      if (response.data.pagination) {
        setPagination({
          page: response.data.pagination.page || page,
          totalPages: response.data.pagination.totalPages || 1,
          total: response.data.pagination.total || 0
        });
      } else {
        // Si pas de pagination dans la réponse, on suppose une seule page
        setPagination({
          page: 1,
          totalPages: 1,
          total: response.data.files?.length || response.data.length || 0
        });
      }
      setCurrentPage(page);
    } catch (err) {
      setError('Erreur lors de la récupération des fichiers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(1);
  }, [fetchFiles]);

  const toggleMenu = (e, itemId) => {
    // Vérifier si e est un événement ou un ID direct
    if (e && typeof e === 'object' && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      const position = getMenuPosition(e.currentTarget, 5); // 5 options pour fichiers: Aperçu, Télécharger, Partager, Renommer, Supprimer
      setActiveMenu(activeMenu?.id === itemId ? null : { id: itemId, position });
    } else {
      // Si e est en fait l'ID (appel direct)
      const actualItemId = e;
      setActiveMenu(activeMenu?.id === actualItemId ? null : { id: actualItemId, position: 'bottom' });
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: 'blob'
      });
      
      // Créer un blob URL pour le téléchargement
      const blob = new Blob([response.data], { type: file.mimetype });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      // Optionnel: afficher un message d'erreur à l'utilisateur
    }
  };

  const handleOpenRenameModal = (fileOrId) => {
    // Si c'est un ID (venant d'ItemList), on trouve le fichier correspondant
    const file = typeof fileOrId === 'object' ? fileOrId : files.find(f => f.id === fileOrId);
    setSelectedFile(file);
    setIsRenameModalOpen(true);
    setActiveMenu(null);
  };

  const handleOpenDeleteModal = (fileOrId) => {
    // Si c'est un ID (venant d'ItemList), on trouve le fichier correspondant
    const file = typeof fileOrId === 'object' ? fileOrId : files.find(f => f.id === fileOrId);
    setSelectedFile(file);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const handleFileRenamed = () => {
    fetchFiles(currentPage);
  };

  const handleFileDeleted = () => {
    fetchFiles(currentPage); // Recharger les fichiers après suppression
    setIsDeleteModalOpen(false);
    setSelectedFile(null);
  };

  const handlePreview = (file) => {
    setFileToPreview(file);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (file) => {
    setFileToShare(file);
    setIsShareModalOpen(true);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedFiles([]); // Réinitialiser la sélection en changeant de mode
  };

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prevSelected =>
      prevSelected.includes(fileId)
        ? prevSelected.filter(id => id !== fileId)
        : [...prevSelected, fileId]
    );
  };

  const handleBatchDelete = async () => {
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    try {
      await api.delete('/files/batch-delete', { data: { fileIds: selectedFiles } });
      fetchFiles(currentPage); // Recharger les fichiers
      setIsSelectionMode(false); // Quitter le mode sélection
      setSelectedFiles([]); // Vider la sélection
    } catch (error) {
      console.error('Erreur lors de la suppression par lot:', error);
      setError('Erreur lors de la suppression des fichiers.');
    } finally {
      setIsBatchDeleteModalOpen(false);
    }
  };

  if (loading) return <div className="files-loading">Chargement...</div>;
  if (error) return <div className="files-error">{error}</div>;

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Fichiers</h1>
          <p className="text-secondary">Vous avez {pagination.total || 0} fichier(s) au total.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleSelectionMode} className="btn btn-secondary">
            {isSelectionMode ? 'Annuler' : 'Sélectionner'}
          </button>
          <Link to="/upload" className="btn btn-primary flex items-center gap-2">
            <FaUpload /> Uploader un fichier
          </Link>
        </div>
      </div>

      <div className="file-list-header">
        <h2 className="text-lg font-semibold">Images sécurisées</h2>
        <div className="text-sm text-secondary">
          Page {pagination.page} sur {pagination.totalPages}
        </div>
      </div>

      {isSelectionMode ? (
        <div className="selection-header card-image mb-4">
          <span>{selectedFiles.length} fichier(s) sélectionné(s)</span>
          <button onClick={handleBatchDelete} className="btn btn-danger" disabled={selectedFiles.length === 0}>
            <FaTrash /> Tout supprimer
          </button>
        </div>
      ) : (
        <div className="folder-bar">
          <ViewModeSwitcher 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            storageKey="filesViewMode" 
          />
        </div>
      )}

      <ItemList
        items={files}
        viewMode={viewMode}
        activeMenu={activeMenu}
        toggleMenu={toggleMenu}
        // Handlers pour les actions
        handleOpenFile={handleDownload}
        handleOpenFileRenameModal={handleOpenRenameModal}
        handleOpenFileDeleteModal={handleOpenDeleteModal}
        handleOpenPreviewModal={handlePreview}
        handleShare={handleShare}
        // Props pour la sélection multiple
        isSelectionMode={isSelectionMode}
        selectedItems={selectedFiles}
        handleSelectItem={handleSelectFile}
      />

      {pagination.totalPages > 1 && (
        <Pagination
          itemsPerPage={10}
          totalItems={pagination.total}
          paginate={fetchFiles}
          currentPage={currentPage}
        />
      )}

      <RenameFileModal 
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        file={selectedFile}
        onFileRenamed={handleFileRenamed}
      />

      <DeleteFileModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        file={selectedFile}
        onFileDeleted={handleFileDeleted}
      />

      {fileToPreview && (
        <FilePreviewModal
          isOpen={isPreviewModalOpen}
          file={fileToPreview}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setFileToPreview(null);
          }}
        />
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        file={fileToShare}
      />

      <DeleteBatchModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        imageCount={selectedFiles.length} // Le prop s'appelle imageCount mais fonctionne pour les fichiers
      />
    </div>
  );
};

export default FilesPage;
