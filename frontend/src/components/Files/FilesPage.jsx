import React, { useState } from 'react';
import { FaPlus, FaFolderOpen } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import fileService from '../../services/fileService';
import api from '../../services/api';
import ItemList from '../Common/ItemList';
import DeleteFileModal from '../Common/DeleteFileModal';
import RenameFileModal from '../Common/RenameFileModal';
import FileDetailModal from '../Common/FileDetailModal';
import ShareModal from './ShareModal';
import ContentToolbar from '../Common/ContentToolbar';
import { Link } from 'react-router-dom';
import DeleteBatchModal from '../Common/DeleteBatchModal';
import BulkActionsManager from '../Common/BulkActionsManager';
import { useDownloadZip, DownloadProgressIndicator } from '../Common/DownloadZip';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import './FileList.css';

const FilesPage = () => {
  const [viewMode, setViewMode] = useState('grid');
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
  const [, setBatchDeleteLoading] = useState(false);
  const [, setDeleteProgress] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  
  // Hook pour le scroll infini
  const {
    items: files,
    loading,
    hasMore,
    error,
    totalCount,
    lastItemRef,
    refresh
  } = useInfiniteScroll(fileService.getFiles, { limit: 20 });

  // Hook pour le téléchargement ZIP
  const {
    progressBar,
    handleDownloadZip,
    clearError
  } = useDownloadZip();

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
    refresh();
  };

  const handleFileDeleted = () => {
    refresh();
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

  // Fonction pour gérer le téléchargement ZIP
  const handleBatchDownload = async () => {
    if (selectedFiles.length === 0) return;

    // Récupérer les objets fichiers complets à partir des IDs sélectionnés
    const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id));

    try {
      await handleDownloadZip(selectedFileObjects, 
        (result) => {
          console.log(`${result.fileCount} fichier(s) téléchargé(s) dans ${result.fileName}`);
          // Optionnel: quitter le mode sélection après téléchargement
          setIsSelectionMode(false);
          setSelectedFiles([]);
        },
        (error) => {
          console.error(`Erreur lors du téléchargement: ${error}`);
        }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
    }
  };

  const handleBatchDelete = async () => {
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    setBatchDeleteLoading(true);
    setDeleteProgress(0);
    
    try {
      // Simuler la progression pendant la suppression
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) return prev; // S'arrêter à 90% jusqu'à la fin réelle
          return Math.round(prev + Math.random() * 15);
        });
      }, 200);
      
      await api.delete('/files/batch-delete', { data: { fileIds: selectedFiles } });
      
      // Compléter la progression
      clearInterval(progressInterval);
      setDeleteProgress(100);
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      refresh(); // Recharger les fichiers
      setIsSelectionMode(false); // Quitter le mode sélection
      setSelectedFiles([]); // Vider la sélection
    } catch (error) {
      console.error('Erreur lors de la suppression par lot:', error);
    } finally {
      setBatchDeleteLoading(false);
      setDeleteProgress(0);
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      // Si tous sont sélectionnés, désélectionner tout
      setSelectedFiles([]);
    } else {
      // Sinon, sélectionner tous les fichiers visibles
      setSelectedFiles(files.map(file => file.id));
    }
  };

  if (loading && files.length === 0) return <div className="files-loading">Chargement...</div>;
  if (error) return <div className="files-error">{error}</div>;

  return (
    <BulkActionsManager
      isSelectionMode={isSelectionMode}
      selectedItems={selectedFiles}
      itemType="file"
      onSelectionModeChange={setIsSelectionMode}
      onItemsUpdated={refresh}
      onSelectAll={handleSelectAll}
      totalItems={files.length}
    >
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div className='my-space-title'>
            <button 
              className="mobile-hamburger-menu"
              onClick={() => {
                const event = new CustomEvent('toggleSidebar');
                window.dispatchEvent(event);
              }}
              aria-label="Toggle menu"
            >
              <FiMenu />
            </button>
            <div className="title-content">
              <h1 className="text-2xl font-bold">Mes Fichiers</h1>
              <p className="text-secondary">Vous avez {totalCount || 0} fichier(s) au total.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/upload" className="btn btn-primary flex items-center gap-2">
              <FaUpload /> Uploader un fichier
            </Link>
          </div>
        </div>

      <div className="file-list-header">
        <div className="header-left">
          <h2 className="text-lg font-semibold">Fichiers sécurisés</h2>
        </div>
        <div className="header-right">
          <div className="text-sm text-secondary">
            {files.length} / {totalCount} fichiers chargés
          </div>
          
          <ContentToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            storageKey="filesViewMode"
            showPagination={false}
            showViewSwitcher={true}
            className="inline-toolbar"
            onToggleSelection={toggleSelectionMode}
            onBatchDelete={handleBatchDelete}
            onBatchDownload={handleBatchDownload}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedFiles.length}
          />
        </div>
      </div>

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
        // Props pour le scroll infini
        lastItemRef={lastItemRef}
        hasMore={hasMore}
        loading={loading}
      />


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
        <FileDetailModal
          isOpen={isPreviewModalOpen}
          file={fileToPreview}
          type="file"
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
        imageCount={selectedFiles.length}
        itemType="file"
        selectedItems={selectedFiles}
      />

      {/* Indicateur de chargement pour le scroll infini */}
      {loading && files.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 transition ease-in-out duration-150">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement...
          </div>
        </div>
      )}
      
      {!hasMore && files.length > 0 && (
        <div className="text-center py-4 text-gray-500 has-more">
          Tous les fichiers ont été chargés
        </div>
      )}

      {/* Indicateur de progrès pour le téléchargement ZIP */}
      <DownloadProgressIndicator
        progressBar={progressBar}
        onClose={clearError}
      />
      </div>
    </BulkActionsManager>
  );
};

export default FilesPage;
