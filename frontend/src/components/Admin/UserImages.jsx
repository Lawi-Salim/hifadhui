import React, { useState, useEffect, useCallback } from 'react';
import { FaImage } from 'react-icons/fa';
import { FiUser, FiCalendar, FiHardDrive, FiMenu } from 'react-icons/fi';
import { getAdminFiles } from '../../services/adminService';
import FileDetailModal from '../Common/FileDetailModal';
import ContentToolbar from '../Common/ContentToolbar';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import { buildImageUrl } from '../../config/cloudinary';
import LoadingSpinner from '../Common/LoadingSpinner';
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

  // Fonction pour récupérer TOUTES les images de TOUS les utilisateurs
  const fetchAllImagesForAdmin = async (params) => {
    const adminParams = {
      ...params,
      type: 'image',
      admin_view: true, // Paramètre pour indiquer que c'est une vue admin
      user_filter: userFilter || undefined,
      date_filter: dateFilter || undefined,
      size_filter: sizeFilter || undefined
    };
    
    const response = await getAdminFiles(adminParams);
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
  } = useInfiniteScroll(fetchAllImagesForAdmin, { limit: 20 });

  const [isModalOpen, setIsModalOpen] = useState(false);


  const handlePreview = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };


  // Fonction pour formater la taille des fichiers
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                onChange={(e) => setUserFilter(e.target.value)}
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
                onChange={(e) => setDateFilter(e.target.value)}
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
                onChange={(e) => setSizeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Toutes les tailles</option>
                <option value="small">&lt; 1 MB</option>
                <option value="medium">1-10 MB</option>
                <option value="large">10-50 MB</option>
                <option value="xlarge">&gt; 50 MB</option>
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
                    ref={index === images.length - 1 ? lastItemRef : null}
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
                    ref={index === images.length - 1 ? lastItemRef : null}
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

      {/* Indicateur de chargement pour le scroll infini */}
      {loading && images.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 transition ease-in-out duration-150">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement des images...
          </div>
        </div>
      )}
      {!hasMore && images.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Toutes les images ont été chargées
        </div>
      )}
    </>
  );
};

export default UserImages;