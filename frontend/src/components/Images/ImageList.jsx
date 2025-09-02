import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiImage, FiUpload, FiTrash2 } from 'react-icons/fi';
import Pagination from '../Pagination';
import ViewModeSwitcher from '../Common/ViewModeSwitcher';
import ItemList from '../Common/ItemList';
import FileDetailModal from '../Common/FileDetailModal';
import DeleteFileModal from '../Common/DeleteFileModal';
import DeleteBatchModal from './DeleteBatchModal';
import RenameFileModal from '../Common/RenameFileModal';
import ShareModal from '../Files/ShareModal';
import './Images.css';

const ImageList = () => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [imageToRename, setImageToRename] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [imageToShare, setImageToShare] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const menuButtonRefs = useRef({});

  useEffect(() => {
    fetchImages(1);

    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu') && 
          !event.target.closest('.btn-menu') &&
          !event.target.closest('.modal-overlay') &&
          !event.target.closest('.modal-content')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fonction pour construire l'URL complète des images
  const getImageUrl = (fileUrl) => {
    if (!fileUrl) return ''; // Gérer le cas où fileUrl est null ou undefined
    if (fileUrl.startsWith('http')) {
      return fileUrl; // URL complète déjà fournie
    } else if (fileUrl.startsWith('hifadhwi/') || /^v\d+\/hifadhwi\//.test(fileUrl) ||
               fileUrl.startsWith('hifadhui/') || /^v\d+\/hifadhui\//.test(fileUrl)) {
      // Chemin relatif Cloudinary (avec ou sans version)
      // Support des anciens chemins hifadhui/ et nouveaux hifadhwi/
      return `https://res.cloudinary.com/ddxypgvuh/image/upload/${fileUrl}`;
    } else {
      // Chemin local
      return `${process.env.REACT_APP_API_BASE_URL}${fileUrl}`;
    }
  };

  const fetchImages = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/files?page=${page}`, { 
        params: { limit: 10, type: 'image' } 
      });
      setImages(response.data.files);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des images' });
    } finally {
      setLoading(false);
    }
  };

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
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
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

  const onImageRenamed = (renamedImage) => {
    setMessage({ type: 'success', text: 'Image renommée avec succès' });
    fetchImages(currentPage);
    setIsRenameModalOpen(false);
  };

  const onImageDeleted = (deletedImageId) => {
    setMessage({ type: 'success', text: 'Image supprimée avec succès' });
    fetchImages(currentPage);
    setIsDeleteModalOpen(false); // Fermer la modale après suppression
  };

  const handlePreview = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
    setOpenMenuId(null); // Fermer le menu après ouverture de l'aperçu
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleBatchDelete = async () => {
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    try {
      await api.delete('/files/batch-delete', { data: { fileIds: selectedImages } });
      setMessage({ type: 'success', text: `${selectedImages.length} image(s) supprimée(s) avec succès.` });
      fetchImages(currentPage); // Recharger les images
      setIsSelectionMode(false); // Quitter le mode sélection
      setSelectedImages([]); // Vider la sélection
    } catch (error) {
      console.error('Erreur lors de la suppression par lot:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression des images.' });
    } finally {
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handleFileDeleted = () => {
    fetchImages(currentPage); // Recharger les images après suppression
    setIsDeleteModalOpen(false);
    setImageToDelete(null);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedImages([]); // Réinitialiser la sélection en changeant de mode
  };

  const handleSelectImage = (imageId) => {
    setSelectedImages(prevSelected =>
      prevSelected.includes(imageId)
        ? prevSelected.filter(id => id !== imageId)
        : [...prevSelected, imageId]
    );
  };

  if (loading) {
    return <div className="loading-container"><div className="loading"></div></div>;
  }

  return (
    <>
      <div className="container">
        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mes images</h1>
            <p className="text-secondary">Vous avez {pagination.total || 0} image(s) dans votre coffre-fort</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleSelectionMode} className="btn btn-secondary">
              {isSelectionMode ? 'Annuler' : 'Sélectionner'}
            </button>
            <Link to="/upload" className="btn btn-primary">
              <FiUpload /> Uploader une image
            </Link>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="card-image">
            <div className="text-center p-6">
              <FiImage size={48} className="text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune image</h3>
              <p className="text-secondary mb-4">Vous n'avez pas encore uploadé d'images.</p>
              <Link to="/upload" className="btn btn-primary">
                <FiUpload /> Uploader votre première image
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="file-list-header">
              <h2 className="text-lg font-semibold">Images sécurisées</h2>
              <div className="text-sm text-secondary">
                Page {pagination.page} sur {pagination.totalPages}
              </div>
            </div>

            {isSelectionMode ? (
              <div className="selection-header card-image mb-4">
                <span>{selectedImages.length} image(s) sélectionnée(s)</span>
                <button onClick={handleBatchDelete} className="btn btn-danger" disabled={selectedImages.length === 0}>
                  <FiTrash2 /> Tout supprimer
                </button>
              </div>
            ) : (
              <div className="folder-bar">
                <ViewModeSwitcher 
                  viewMode={viewMode} 
                  setViewMode={setViewMode} 
                  storageKey="imagesViewMode" 
                />
              </div>
            )}

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
              menuButtonRefs={menuButtonRefs}
            />

            {pagination.totalPages > 1 && (
              <Pagination
                itemsPerPage={10} 
                totalItems={pagination.total}
                paginate={fetchImages}
                currentPage={currentPage}
              />
            )}
          </>
        )}
      </div>

      {isModalOpen && selectedImage && (
        <FileDetailModal
          isOpen={isModalOpen}
          file={selectedImage}
          type="image"
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <DeleteFileModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        file={imageToDelete}
        onFileDeleted={handleFileDeleted}
      />

      <DeleteBatchModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        imageCount={selectedImages.length}
      />

      <RenameFileModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        file={imageToRename}
        onFileRenamed={onImageRenamed}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        file={imageToShare}
      />

    </>
  );
};

export default ImageList;
