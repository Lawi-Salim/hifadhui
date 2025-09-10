import React, { useState } from 'react';
import { FaPlus, FaFolderOpen } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import api from '../../services/api';
import ItemList from '../Common/ItemList';
import DeleteFileModal from '../Common/DeleteFileModal';
import RenameFileModal from '../Common/RenameFileModal';
import FileDetailModal from '../Common/FileDetailModal';
import ContentToolbar from '../Common/ContentToolbar';
import DeleteBatchModal from '../Common/DeleteBatchModal';
import BulkActionsManager from '../Common/BulkActionsManager';
import { useDownloadZip, DownloadProgressIndicator } from '../Common/DownloadZip';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { Link } from 'react-router-dom';
import './Images.css';

const ImageList = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImage, setSelectedImage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Fonction pour calculer la position du menu avec hauteur dynamique
  const getMenuPosition = (buttonElement, optionsCount = 5) => {
    if (!buttonElement) return 'bottom';
    
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
    const spaceBelow = viewportHeight - rect.bottom;
    
    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };

  // Fonction pour récupérer les images avec le bon format pour useInfiniteScroll
  const fetchImagesForInfiniteScroll = async (params) => {
    const response = await api.get('/files', { 
      params: { ...params, type: 'image' }
    });
    return response;
  };

  // Hook pour le scroll infini
  const {
    items: images,
    loading,
    hasMore,
    error,
    totalCount,
    lastItemRef,
    refresh
  } = useInfiniteScroll(fetchImagesForInfiniteScroll, { limit: 20 });

  // Hook pour le téléchargement ZIP
  const {
    progressBar,
    handleDownloadZip,
    clearError
  } = useDownloadZip();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [imageToRename, setImageToRename] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = async (image) => {
    try {
      const response = await api.get(`/files/${image.id}/download`, {
        responseType: 'blob'
      });
      
      // Créer un blob URL pour le téléchargement
      const blob = new Blob([response.data], { type: image.mimetype });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setOpenMenuId(null); // Fermer le menu après téléchargement
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const openDeleteModal = (imageOrId) => {
    // Si c'est un ID (venant d'ItemList), on trouve l'image correspondante
    const image = typeof imageOrId === 'object' ? imageOrId : images.find(img => img.id === imageOrId);
    setImageToDelete(image);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null); // Fermer le menu après ouverture de la suppression
  };

  const handleShare = (image) => {
    setImageToShare(image);
    setIsShareModalOpen(true);
    setOpenMenuId(null); // Fermer le menu après ouverture du partage
  };

  const handleRename = (imageOrId) => {
    // Si c'est un ID (venant d'ItemList), on trouve l'image correspondante
    const image = typeof imageOrId === 'object' ? imageOrId : images.find(img => img.id === imageOrId);
    setImageToRename(image);
    setIsRenameModalOpen(true);
    setOpenMenuId(null); // Fermer le menu après ouverture du renommage
  };

  const handleImageRenamed = () => {
    refresh();
  };

  const handleImageDeleted = () => {
    refresh();
    setIsDeleteModalOpen(false);
    setSelectedImage(null);
  };

  const handleBatchDelete = async () => {
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    setBatchDeleteLoading(true);
    setDeleteProgress(0);
    
    try {
      const imageIds = selectedImages.map(image => image.id);
      const totalImages = imageIds.length;
      
      // Simuler la progression pendant la suppression
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) return prev; // S'arrêter à 90% jusqu'à la fin réelle
          return Math.round(prev + Math.random() * 15);
        });
      }, 200);
      
      await api.delete('/files/batch-delete', { data: { fileIds: imageIds } });
      
      // Compléter la progression
      clearInterval(progressInterval);
      setDeleteProgress(100);
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      refresh(); // Recharger les images
      setIsSelectionMode(false); // Quitter le mode sélection
      setSelectedImages([]); // Vider la sélection
    } catch (error) {
      console.error('Erreur lors de la suppression par lot:', error);
    } finally {
      setBatchDeleteLoading(false);
      setDeleteProgress(0);
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handlePreview = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
    setOpenMenuId(null); // Fermer le menu après ouverture de l'aperçu
  };

  const handleSelectImage = (image) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id);
      if (isSelected) {
        return prev.filter(img => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      // Si tous sont sélectionnés, désélectionner tout
      setSelectedImages([]);
    } else {
      // Sinon, sélectionner tous les éléments visibles
      setSelectedImages([...images]);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedImages.length === 0) return;

    try {
      await handleDownloadZip(selectedImages, 
        (result) => {
          // Optionnel: quitter le mode sélection après téléchargement
          setIsSelectionMode(false);
          setSelectedImages([]);
        },
        (error) => {
        }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedImages([]); // Réinitialiser la sélection en changeant de mode
  };

  if (loading && images.length === 0) {
    return <div className="loading-container"><div className="loading"></div></div>;
  }

  return (
    <BulkActionsManager
      isSelectionMode={isSelectionMode}
      selectedItems={selectedImages}
      itemType="image"
      onSelectionModeChange={setIsSelectionMode}
      onItemsUpdated={refresh}
      onSelectAll={handleSelectAll}
      totalItems={images.length}
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
              <h1 className="text-2xl font-bold">Mes images</h1>
              <p className="text-secondary">Vous avez {totalCount || 0} image(s) au total.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/upload" className="btn btn-primary">
              <FaUpload /> Uploader une image
            </Link>
          </div>
        </div>

        <div className="file-list-header">
          <div className="header-left">
            <h2 className="text-lg font-semibold">Images sécurisées</h2>
          </div>
          <div className="header-right">
            <div className="text-sm text-secondary text-page">
              {images.length} / {totalCount} images chargées
            </div>
            
            <ContentToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              storageKey="imagesViewMode"
              showPagination={false}
              showViewSwitcher={true}
              className="inline-toolbar"
              onToggleSelection={handleToggleSelectionMode}
              onBatchDelete={handleBatchDelete}
              onBatchDownload={handleBatchDownload}
              isSelectionMode={isSelectionMode}
              selectedCount={selectedImages.length}
            />
          </div>
        </div>

        {images.length === 0 ? (
          <div className="card-image">
            <div className="text-center p-6">
              <FaUpload size={48} className="text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune image</h3>
              <p className="text-secondary mb-4">Vous n'avez pas encore uploadé d'images.</p>
              <Link to="/upload" className="btn btn-primary">
                <FaUpload /> Uploader votre première image
              </Link>
            </div>
          </div>
        ) : (
          <ItemList
            items={images}
            viewMode={viewMode}
            activeMenu={openMenuId}
            toggleMenu={(e, itemId) => {
              // Vérifier si e est un événement ou un ID direct
              if (e && typeof e === 'object' && e.preventDefault) {
                e.preventDefault();
                e.stopPropagation();
                const position = getMenuPosition(e.currentTarget, 5); // 5 options pour images: Aperçu, Télécharger, Partager, Renommer, Supprimer
                setOpenMenuId(openMenuId?.id === itemId ? null : { id: itemId, position });
              } else {
                // Si e est en fait l'ID (appel direct)
                const actualItemId = e;
                setOpenMenuId(openMenuId?.id === actualItemId ? null : { id: actualItemId, position: 'bottom' });
              }
            }}
            // Handlers pour les actions
            handleOpenFile={handleDownload}
            handleOpenFileRenameModal={handleRename}
            handleOpenFileDeleteModal={openDeleteModal}
            handleShare={handleShare}
            handleOpenPreviewModal={handlePreview}
            // Props pour la sélection multiple
            isSelectionMode={isSelectionMode}
            selectedItems={selectedImages}
            handleSelectItem={handleSelectImage}
            // Props pour le scroll infini
            lastItemRef={lastItemRef}
            hasMore={hasMore}
            loading={loading}
          />
        )}
      </div>

      {isDeleteModalOpen && imageToDelete && (
        <DeleteFileModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          file={imageToDelete}
          onFileDeleted={handleImageDeleted}
        />
      )}

      <DeleteBatchModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        imageCount={selectedImages.length}
        itemType="image"
        selectedItems={selectedImages}
      />

      <RenameFileModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        file={imageToRename}
        onFileRenamed={handleImageRenamed}
      />

      <FileDetailModal
        isOpen={isModalOpen}
        file={selectedImage}
        type="image"
        onClose={() => setIsModalOpen(false)}
      />


      {/* Indicateur de chargement pour le scroll infini */}
      {loading && images.length > 0 && (
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
      
      {!hasMore && images.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Toutes les images ont été chargées
        </div>
      )}

      {/* Indicateur de progrès pour le téléchargement ZIP */}
      <DownloadProgressIndicator
        progressBar={progressBar}
        onClose={clearError}
      />
    </BulkActionsManager>
  );
};

export default ImageList;
