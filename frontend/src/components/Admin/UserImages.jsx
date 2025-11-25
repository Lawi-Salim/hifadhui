import React, { useState, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';
import { FiUser, FiCalendar, FiHardDrive, FiMenu } from 'react-icons/fi';
import { getAdminFiles } from '../../services/adminService';
import FileDetailModal from '../Common/FileDetailModal';
import ContentToolbar from '../Common/ContentToolbar';
import Pagination from '../Common/Pagination';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import { buildImageUrl } from '../../config/cloudinary';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatFileSize } from '../../utils/fileSize';
import '../Images/Images.css';
import './AdminStyles.css';

const UserImages = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImage, setSelectedImage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');

  // Fonction pour calculer la position du menu
  const getMenuPosition = (buttonElement, optionsCount = 4) => {
    if (!buttonElement) return 'bottom';
    
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16;
    const spaceBelow = viewportHeight - rect.bottom;
    
    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };

  // États pour la pagination admin
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

      const adminParams = {
        page,
        limit: itemsPerPage,
        type: 'image',
        admin_view: true,
        user_filter: userFilter || undefined,
        date_filter: dateFilter || undefined,
        size_filter: sizeFilter || undefined
      };

      const response = await getAdminFiles(adminParams);
      const data = response.data || {};
      const imagesData = data.files || data.data || [];
      const pagination = data.pagination || {};

      setImages(imagesData);
      setTotalCount(pagination.total || pagination.totalItems || imagesData.length || 0);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Erreur lors du chargement des images admin:', err);
      setError('Erreur lors du chargement des images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages(currentPage);
  }, [currentPage, userFilter, dateFilter, sizeFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);


  const handlePreview = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };


  // Fonction pour obtenir les utilisateurs uniques pour le filtre
  const getUniqueUsers = () => {
    const users = images.map(img => img.fileUser).filter(Boolean);
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    return uniqueUsers;
  };

  if (loading && images.length === 0) {
    return <LoadingSpinner message="Chargement de toutes les images..." />;
  }

  return (
    <>
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
              <h1 className="text-2xl font-bold">Toutes les Images</h1>
              <p className="text-secondary">Vue admin - {totalCount || 0} image(s) au total de tous les utilisateurs.</p>
            </div>
          </div>
        </div>

        {/* Filtres Admin */}
        <div className="admin-filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <FiUser className="filter-icon" />
                Utilisateur
              </label>
              <select 
                value={userFilter} 
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="">Tous les utilisateurs</option>
                {getUniqueUsers().map(user => (
                  <option key={user.id} value={user.id}>
                    <UserDisplayName user={user} /> ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">
                <FiCalendar className="filter-icon" />
                Période
              </label>
              <select 
                value={dateFilter} 
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">
                <FiHardDrive className="filter-icon" />
                Taille
              </label>
              <select 
                value={sizeFilter} 
                onChange={(e) => {
                  setSizeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="">Toutes les tailles</option>
                <option value="small">&lt; 1 Mo</option>
                <option value="medium">1-10 Mo</option>
                <option value="large">10-50 Mo</option>
                <option value="xlarge">&gt; 50 Mo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-content-header">
          <div className="content-header-left">
            <h2 className="section-title">Images de tous les utilisateurs</h2>
            <span className="items-count">{images.length} / {totalCount} images chargées</span>
          </div>
          <div className="content-header-right">
            <ContentToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              storageKey="adminImagesViewMode"
              showPagination={false}
              showViewSwitcher={true}
              showSelectionTools={false}
              className="inline-toolbar"
            />
          </div>
        </div>

        {images.length === 0 ? (
          <div className="card-image">
            <div className="text-center p-6">
              <FaImage size={48} className="text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune image</h3>
              <p className="text-secondary mb-4">Aucune image trouvée avec les filtres actuels.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vue en grille admin - toujours utiliser la vue grid native pour l'admin */}
            {viewMode === 'grid' ? (
              <div className="admin-grid-view">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="admin-image-card"
                  >
                    <div className="image-preview" onClick={() => handlePreview(image)}>
                      <img 
                        src={buildImageUrl(image.file_url)}
                        alt={image.filename}
                        className="admin-image-thumbnail"
                      />
                    </div>
                    
                    <div className="admin-file-footer">
                      <h4 className="file-name" title={image.filename}>
                        {image.filename}
                      </h4>
                      
                      <div className="user-info-row">
                        <SmartAvatar user={image.fileUser} size={24} />
                        <span className="user-name-text">
                          <UserDisplayName user={image.fileUser} />
                        </span>
                        <ProviderIcon user={image.fileUser} size="small" />
                      </div>
                      
                      <div className="file-meta-row">
                        <span className="file-size-text">{formatFileSize(image.size)}</span>
                        <span className="file-date-text">
                          {new Date(image.date_upload || image.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vue en liste admin */
              <div className="admin-list-view">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="admin-list-item"
                  >
                    <div className="list-item-thumbnail">
                      <img 
                        src={buildImageUrl(image.file_url)}
                        alt={image.filename}
                        className="list-image-thumb"
                        onClick={() => handlePreview(image)}
                      />
                    </div>
                    
                    <div className="list-item-content">
                      <h4 className="list-file-name" title={image.filename}>
                        {image.filename}
                      </h4>
                      
                      <div className="list-user-info">
                        <SmartAvatar user={image.fileUser} size={20} />
                        <span className="list-user-name">
                          <UserDisplayName user={image.fileUser} />
                        </span>
                        <ProviderIcon user={image.fileUser} size="small" />
                      </div>
                    </div>
                    
                    <div className="list-item-meta-right">
                      <div className="list-meta-info">
                        <span className="list-file-size">{formatFileSize(image.size)}</span>
                        <span className="list-file-date">
                          {new Date(image.date_upload || image.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <FileDetailModal
        isOpen={isModalOpen}
        file={selectedImage}
        type="image"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedImage(null);
        }}
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
    </>
  );
};
export default UserImages;