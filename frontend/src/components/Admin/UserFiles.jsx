import React, { useState, useEffect, useCallback } from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { FiUser, FiCalendar, FiHardDrive, FiMenu } from 'react-icons/fi';
import { getAdminFiles } from '../../services/adminService';
import FileDetailModal from '../Common/FileDetailModal';
import ContentToolbar from '../Common/ContentToolbar';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import PdfPreview from '../Common/PdfPreview';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../Files/FileList.css';
import './AdminStyles.css';

const UserFiles = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFile, setSelectedFile] = useState(null);
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

  // Fonction pour récupérer TOUS les PDFs de TOUS les utilisateurs
  const fetchAllFilesForAdmin = async (params) => {
    const adminParams = {
      ...params,
      type: 'pdf', // ou 'document' selon votre logique
      admin_view: true,
      user_filter: userFilter || undefined,
      date_filter: dateFilter || undefined,
      size_filter: sizeFilter || undefined
    };
    
    const response = await getAdminFiles(adminParams);
    return response;
  };

  // Hook pour le scroll infini
  const {
    items: files,
    loading,
    hasMore,
    error,
    totalCount,
    lastItemRef,
    refresh
  } = useInfiniteScroll(fetchAllFilesForAdmin, { limit: 20 });

  const [isModalOpen, setIsModalOpen] = useState(false);


  const handlePreview = (file) => {
    setSelectedFile(file);
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
    const users = files.map(file => file.fileUser).filter(Boolean);
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    return uniqueUsers;
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (filename, mimetype) => {
    if (mimetype?.includes('pdf')) {
      return <FaFileAlt className="text-red-500" />;
    }
    // Autres types de fichiers
    return <FaFileAlt className="text-blue-500" />;
  };

  if (loading && files.length === 0) {
    return <LoadingSpinner message="Chargement de tous les PDFs..." />;
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
              <h1 className="text-2xl font-bold">Tous les PDFs</h1>
              <p className="text-secondary">Vue admin - {totalCount || 0} fichier(s) au total de tous les utilisateurs.</p>
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
            <h2 className="section-title">Fichiers de tous les utilisateurs</h2>
            <span className="items-count">{files.length} / {totalCount} fichiers chargés</span>
          </div>
          <div className="content-header-right">
            <ContentToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              storageKey="adminFilesViewMode"
              showPagination={false}
              showViewSwitcher={true}
              showSelectionTools={false}
              className="inline-toolbar"
            />
          </div>
        </div>

        {files.length === 0 ? (
          <div className="card-image">
            <div className="text-center p-6">
              <FaFileAlt size={48} className="text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun fichier</h3>
              <p className="text-secondary mb-4">Aucun fichier trouvé avec les filtres actuels.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vue en grille avec informations utilisateur */}
            {viewMode === 'grid' ? (
              <div className="admin-grid-view">
                {files.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="admin-file-card"
                    ref={index === files.length - 1 ? lastItemRef : null}
                  >
                    <div className="file-preview" onClick={() => handlePreview(file)}>
                      {file.mimetype?.includes('pdf') ? (
                        <div className="pdf-preview-container">
                          <PdfPreview fileUrl={file.file_url} fileId={file.id} className="admin-pdf-thumbnail" />
                          <div className="file-type-badge pdf-badge">PDF</div>
                        </div>
                      ) : (
                        <>
                          <div className="file-icon-large">
                            {getFileIcon(file.filename, file.mimetype)}
                          </div>
                          <div className="file-type-badge">
                            {file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="admin-file-footer">
                      <h4 className="file-name" title={file.filename}>
                        {file.filename}
                      </h4>
                      
                      <div className="user-info-row">
                        <SmartAvatar user={file.fileUser} size={24} />
                        <span className="user-name-text">
                          <UserDisplayName user={file.fileUser} />
                        </span>
                        <ProviderIcon user={file.fileUser} size="small" />
                      </div>
                      
                      <div className="file-meta-row">
                        <span className="file-size-text">{formatFileSize(file.size)}</span>
                        <span className="file-date-text">
                          {new Date(file.date_upload || file.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vue en liste admin */
              <div className="admin-list-view">
                {files.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="admin-list-item"
                    ref={index === files.length - 1 ? lastItemRef : null}
                  >
                    <div className="list-item-thumbnail">
                      {file.mimetype?.includes('pdf') ? (
                        <div className="pdf-preview-small">
                          <PdfPreview fileUrl={file.file_url} fileId={file.id} className="list-pdf-thumb" />
                          <div className="file-type-badge-small pdf-badge">PDF</div>
                        </div>
                      ) : (
                        <div className="file-icon-small">
                          {getFileIcon(file.filename, file.mimetype)}
                        </div>
                      )}
                    </div>
                    
                    <div className="list-item-content">
                      <h4 className="list-file-name" title={file.filename}>
                        {file.filename}
                      </h4>
                      
                      <div className="list-user-info">
                        <SmartAvatar user={file.fileUser} size={20} />
                        <span className="list-user-name">
                          <UserDisplayName user={file.fileUser} />
                        </span>
                        <ProviderIcon user={file.fileUser} size="small" />
                      </div>
                    </div>
                    
                    <div className="list-item-meta-right">
                      <div className="list-meta-info">
                        <span className="list-file-size">{formatFileSize(file.size)}</span>
                        <span className="list-file-date">
                          {new Date(file.date_upload || file.createdAt).toLocaleDateString('fr-FR')}
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
        file={selectedFile}
        type="pdf"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
        }}
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
        <div className="text-center py-4 text-gray-500">
          Tous les fichiers ont été chargés
        </div>
      )}
    </>
  );
};

export default UserFiles;