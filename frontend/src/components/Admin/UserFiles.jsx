import React, { useState, useEffect } from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { FiUser, FiCalendar, FiHardDrive, FiMenu } from 'react-icons/fi';
import { getAdminFiles } from '../../services/adminService';
import FileDetailModal from '../Common/FileDetailModal';
import ContentToolbar from '../Common/ContentToolbar';
import Pagination from '../Common/Pagination';
import SmartAvatar from '../Layout/SmartAvatar';
import UserDisplayName from '../Layout/UserDisplayName';
import ProviderIcon from '../Layout/ProviderIcon';
import PdfPreview from '../Common/PdfPreview';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../Files/FileList.css';
import './AdminStyles.css';
import { formatFileSize } from '../../utils/fileSize';

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

  // États pour la pagination admin
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadFiles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const adminParams = {
        page,
        limit: itemsPerPage,
        type: 'pdf',
        admin_view: true,
        user_filter: userFilter || undefined,
        date_filter: dateFilter || undefined,
        size_filter: sizeFilter || undefined
      };

      const response = await getAdminFiles(adminParams);
      const data = response.data || {};
      const filesData = data.files || data.data || [];
      const pagination = data.pagination || {};

      setFiles(filesData);
      setTotalCount(pagination.total || pagination.totalItems || filesData.length || 0);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Erreur lors du chargement des fichiers admin:', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPage);
  }, [currentPage, userFilter, dateFilter, sizeFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);


  const handlePreview = (file) => {
    setSelectedFile(file);
    setIsModalOpen(true);
    setOpenMenuId(null);
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
            itemName="fichiers"
          />
        </div>
      )}
    </>
  );
};

export default UserFiles;