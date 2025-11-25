import React, { useState, useEffect } from 'react';
import { FaPlus, FaFolderOpen, FaUpload, FaCalendar, FaDatabase, FaDownload } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import api from '../../services/api';
import ItemList from '../Common/ItemList';
import DeleteFileModal from '../Common/DeleteFileModal';
import RenameFileModal from '../Common/RenameFileModal';
import FileDetailModal from '../Common/FileDetailModal';
import ShareModal from '../Files/ShareModal';
import ContentToolbar from '../Common/ContentToolbar';
import DeleteBatchModal from '../Common/DeleteBatchModal';
import BulkActionsManager from '../Common/BulkActionsManager';
import { useDownloadZip, DownloadProgressIndicator } from '../Common/DownloadZip';
import CertificateModal from '../Certificates/CertificateModal';
import certificateService from '../../services/certificateService';
import Pagination from '../Common/Pagination';
import { Link } from 'react-router-dom';
import './Images.css';
import '../Admin/AdminStyles.css'; // Import des styles admin pour les filtres
import LoadingSpinner from '../Common/LoadingSpinner';

const ImageList = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImage, setSelectedImage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');

  // Fonction pour calculer la position du menu avec hauteur dynamique
  const getMenuPosition = (buttonElement, optionsCount = 5) => {
    if (!buttonElement) return 'bottom';
    
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
    const spaceBelow = viewportHeight - rect.bottom;
    
    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };

  // États pour la pagination
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadImages = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/files', {
        params: {
          page,
          limit: itemsPerPage,
          type: 'image',
          period: periodFilter || undefined,
          sizeRange: sizeFilter || undefined
        }
      });

      const data = response.data || {};
      const imagesData = data.files || data.data || [];
      const pagination = data.pagination || {};

      setImages(imagesData);
      setTotalCount(pagination.total || pagination.totalItems || imagesData.length || 0);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Erreur lors du chargement des images:', err);
      setError('Erreur lors du chargement des images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages(currentPage);
  }, [currentPage, periodFilter, sizeFilter]);

  const refresh = () => {
    loadImages(currentPage);
  };

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [fileToCertify, setFileToCertify] = useState(null);

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
    setFileToShare(image);
    setIsShareModalOpen(true);
    setOpenMenuId(null); // Fermer le menu
  };

  const handleCertificate = (image) => {
    setFileToCertify(image);
    setIsCertificateModalOpen(true);
    setOpenMenuId(null); // Fermer le menu
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
    try {
      const imageIds = selectedImages.map(image => image.id);
      
      await api.delete('/files/batch-delete', { data: { fileIds: imageIds } });
      
      refresh(); // Recharger les images
      setIsSelectionMode(false); // Quitter le mode sélection
      setSelectedImages([]); // Vider la sélection
    } catch (error) {
      console.error('Erreur lors de la suppression par lot:', error);
    } finally {
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
      await handleDownloadZip(
        selectedImages,
        (result) => {
          // Optionnel: quitter le mode sélection après téléchargement
          setIsSelectionMode(false);
          setSelectedImages([]);
        },
        (error) => {
        },
        { withWatermark: false }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
    }
  };

  // Téléchargement ZIP avec filigrane (watermark seulement sur les images avec Product ID)
  const handleBatchDownloadWithWatermark = async () => {
    if (selectedImages.length === 0) return;

    try {
      await handleDownloadZip(
        selectedImages,
        (result) => {
          setIsSelectionMode(false);
          setSelectedImages([]);
        },
        (error) => {
        },
        { withWatermark: true }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP avec filigrane:', error);
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedImages([]); // Réinitialiser la sélection en changeant de mode
  };

  if (loading && images.length === 0) {
    return <LoadingSpinner message="Chargement des images..." />;
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
              <p className="text-secondary">Vous avez {images.length || 0}/{totalCount || 0} image(s) chargées.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/upload" className="btn btn-primary">
              <FaUpload /> Uploader une image
            </Link>
          </div>
        </div>

        {/* Section des filtres */}
        <div className="admin-filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <FaCalendar className="filter-icon" />
                Période
              </label>
              <select 
                className="filter-select"
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois-ci</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <FaDatabase className="filter-icon" />
                Taille
              </label>
              <select 
                className="filter-select"
                value={sizeFilter}
                onChange={(e) => {
                  setSizeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Toutes les tailles</option>
                <option value="small">Petit (&lt; 1 Mo)</option>
                <option value="medium">Moyen (1-10 Mo)</option>
                <option value="large">Grand (&gt; 10 Mo)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="file-list-header">
          <div className="header-left">
            <h2 className="text-lg font-semibold">Images sécurisées</h2>
          </div>
          <div className="header-right">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBatchDownloadWithWatermark}
                disabled={!isSelectionMode || selectedImages.length === 0}
                className={`btn btn-secondary inline-flex items-center gap-2 ${(!isSelectionMode || selectedImages.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={
                  !isSelectionMode
                    ? 'Activer la sélection pour télécharger avec filigrane'
                    : selectedImages.length === 0
                      ? 'Sélectionnez au moins une image pour télécharger avec filigrane'
                      : 'Télécharger les images sélectionnées avec filigrane'
                }
              >
                <FaDownload /> Avec filigrane
              </button>
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
            handleCertificate={handleCertificate}
            handleOpenPreviewModal={handlePreview}
            // Props pour la sélection multiple
            isSelectionMode={isSelectionMode}
            selectedItems={selectedImages}
            handleSelectItem={handleSelectImage}
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


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
            onPageChange={setCurrentPage}
            onPrevPage={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
            }}
            onNextPage={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
              }
            }}
            itemName="images"
          />
        </div>
      )}

      {/* Indicateur de progrès pour le téléchargement ZIP */}
      <DownloadProgressIndicator
        progressBar={progressBar}
        onClose={clearError}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        file={fileToShare}
      />

      <CertificateModal
        file={fileToCertify}
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />
    </BulkActionsManager>
  );
};

export default ImageList;
