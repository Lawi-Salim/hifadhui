import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUpload, FaCalendar, FaDatabase, FaSearch } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import fileService from '../../services/fileService';
import api from '../../services/api';
import downloadService from '../../services/downloadService';
import { generateLicenseForSelection } from '../../services/licenseService';
import LicenseDownloadModal from '../Common/LicenseDownloadModal';
import ItemList from '../Common/ItemList';
import DeleteFileModal from '../Common/DeleteFileModal';
import RenameFileModal from '../Common/RenameFileModal';
import FileDetailModal from '../Common/FileDetailModal';
import ShareModal from './ShareModal';
import CertificateModal from '../Certificates/CertificateModal';
import ContentToolbar from '../Common/ContentToolbar';
import { Link } from 'react-router-dom';
import DeleteBatchModal from '../Common/DeleteBatchModal';
import BulkActionsManager from '../Common/BulkActionsManager';
import { useDownloadZip, DownloadProgressIndicator } from '../Common/DownloadZip';
import Pagination from '../Common/Pagination';
import './FileList.css';
import '../Admin/AdminStyles.css'; // Import des styles admin pour les filtres
import LoadingSpinner from '../Common/LoadingSpinner';

const FilesPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenu, setActiveMenu] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  // Recherche : searchInput = saisie, searchApplied = valeur utilisée pour l'API
  const [searchInput, setSearchInput] = useState(''); // valeur tapée dans le champ
  const [searchApplied, setSearchApplied] = useState(''); // valeur réellement envoyée à l’API

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
  const [selectedFiles, setSelectedFiles] = useState([]); // Contiendra des objets fichier complets
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [, setBatchDeleteLoading] = useState(false);
  const [, setDeleteProgress] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [fileToCertify, setFileToCertify] = useState(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState([]);
  const bulkActionsRef = useRef(null);

  // États pour la pagination
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadFiles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fileService.getFiles({
        page,
        limit: itemsPerPage,
        period: periodFilter || undefined,
        sizeRange: sizeFilter || undefined,
        search: searchApplied || undefined
      });

      const data = response.data || {};
      const filesData = data.files || data.data || [];
      const pagination = data.pagination || {};

      setFiles(filesData);
      setTotalCount(pagination.total || pagination.totalItems || filesData.length || 0);
      setTotalPages(pagination.totalPages || 1);
      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des fichiers:', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  // Recharger les fichiers quand la page ou les filtres changent
  useEffect(() => {
    loadFiles(currentPage);
  }, [currentPage, periodFilter, sizeFilter, searchApplied]);

  // Mettre à jour automatiquement le critère de recherche avec un petit délai
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchApplied(searchInput.trim() || '');
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const refresh = () => {
    loadFiles(currentPage);
  };

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

  const handleDownload = async (file, { withWatermark = false } = {}) => {
    if (!file) return;

    // Déterminer si c'est une image avec un Product ID disponible
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const hasProductId = !!file.empreinte?.product_id;

    console.log('[FilesPage.handleDownload] called', {
      withWatermark,
      isImage,
      hasProductId,
      mimetype: file.mimetype,
      productId: file.empreinte?.product_id,
      file
    });

    try {
      if (withWatermark && (!isImage || !hasProductId)) {
        // Sécurité : si on demande un filigrane mais que ce n'est pas une image ou pas de product_id,
        // on retombe sur un téléchargement standard sans filigrane
        await downloadService.downloadSingleFile(file, { withWatermark: false });
        return;
      }

      await downloadService.downloadSingleFile(file, { withWatermark: withWatermark && isImage && hasProductId });
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

  const handleCertificate = (file) => {
    setFileToCertify(file);
    setIsCertificateModalOpen(true);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedFiles([]); // Réinitialiser la sélection en changeant de mode
  };

  const handleSelectFile = (file) => {
    setSelectedFiles((prevSelected) => {
      const isSelected = prevSelected.some((f) => f.id === file.id);
      if (isSelected) {
        return prevSelected.filter((f) => f.id !== file.id);
      }
      return [...prevSelected, file];
    });
  };

  // Fonction pour gérer le téléchargement ZIP
  const handleBatchDownload = async () => {
    if (selectedFiles.length === 0) return;

    setPendingSelection(selectedFiles);
    setIsLicenseModalOpen(true);
  };

  // Téléchargement ZIP avec filigrane (pour les fichiers sélectionnés, watermark seulement sur les images)
  const handleBatchDownloadWithWatermark = async () => {
    if (selectedFiles.length === 0) return;

    const selectedFileObjects = selectedFiles;
    const creatorName = user?.username
      ? `Créateur : ${user.username}`
      : 'Créateur : Soma Digital';
    try {
      let extraFiles = [];

      try {
        const { txtContent } = generateLicenseForSelection(selectedFileObjects, {}, { creatorName });
        extraFiles = [
          { name: 'LICENCE.txt', content: txtContent }
        ];
      } catch (e) {
        console.error('[FilesPage.handleBatchDownloadWithWatermark] Erreur génération licence, téléchargement sans fichier de licence', e);
      }

      await handleDownloadZip(
        selectedFileObjects,
        (result) => {
          console.log(`${result.fileCount} fichier(s) téléchargé(s) dans ${result.fileName} (avec filigrane)`);
          setIsSelectionMode(false);
          setSelectedFiles([]);
        },
        (error) => {
          console.error(`Erreur lors du téléchargement avec filigrane: ${error}`);
        },
        { withWatermark: true, extraFiles }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP avec filigrane:', error);
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
      
      await api.delete('/files/batch-delete', { data: { fileIds: selectedFiles.map(file => file.id) } });
      
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
      // Sinon, sélectionner tous les fichiers visibles (objets complets)
      setSelectedFiles([...files]);
    }
  };

  if (loading && !initialLoadDone) return <LoadingSpinner message="Chargement des PDFs..." />;
  if (error) return <div className="files-error">{error}</div>;

  const handleConfirmLicenseDownload = async (options) => {
    const items = pendingSelection && pendingSelection.length > 0 ? pendingSelection : selectedFiles;
    if (!items || items.length === 0) {
      return;
    }

    let extraFiles = [];

    if (options?.includeLicense) {
      const text = options.licenseText || '';
      if (options.includeTxt) {
        extraFiles.push({ name: 'LICENCE.txt', content: text });
      }
    }

    try {
      await handleDownloadZip(
        items,
        (result) => {
          console.log(`${result.fileCount} fichier(s) téléchargé(s) dans ${result.fileName}`);
          setIsSelectionMode(false);
          setSelectedFiles([]);
          setPendingSelection([]);
        },
        (error) => {
          console.error(`Erreur lors du téléchargement: ${error}`);
        },
        { withWatermark: false, extraFiles }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
    }
  };

  return (
    <BulkActionsManager
      isSelectionMode={isSelectionMode}
      selectedItems={selectedFiles}
      itemType="file"
      onSelectionModeChange={setIsSelectionMode}
      onItemsUpdated={refresh}
      onSelectAll={handleSelectAll}
      totalItems={files.length}
      onBulkDownloadWithWatermark={handleBatchDownloadWithWatermark}
      onClearSelection={() => setSelectedFiles([])}
      onBindActions={(actions) => {
        bulkActionsRef.current = actions;
      }}
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
              <p className="text-secondary">Vous avez {files.length || 0}/{totalCount || 0} fichier(s) chargés.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/upload" className="btn btn-primary flex items-center gap-2">
              <FaUpload /> Uploader un fichier
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

            <div className="filter-group filter-group--no-hover">
              <label className="filter-label">
                <FaSearch className="filter-icon" />
                Nom du fichier
              </label>
              <input
                type="text"
                className="filter-select"
                placeholder="Rechercher par nom..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                }}
              />
            </div>
          </div>
        </div>

      <div className="file-list-header">
        <div className="header-left">
          <h2 className="text-lg font-semibold">Fichiers sécurisés</h2>
        </div>
        <div className="header-right">
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
            onBulkSelectAll={() => bulkActionsRef.current?.selectAll?.()}
            onBulkMove={() => bulkActionsRef.current?.move?.()}
            onBulkCancel={() => bulkActionsRef.current?.cancel?.()}
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
        handleCertificate={handleCertificate}
        // Props pour la sélection multiple
        isSelectionMode={isSelectionMode}
        selectedItems={selectedFiles}
        handleSelectItem={handleSelectFile}
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

      <CertificateModal
        file={fileToCertify}
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />

      <DeleteBatchModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        imageCount={selectedFiles.length}
        itemType="file"
        selectedItems={selectedFiles}
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

      {/* Indicateur de progrès pour le téléchargement ZIP */}
      <DownloadProgressIndicator
        progressBar={progressBar}
        onClose={clearError}
      />
      <LicenseDownloadModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        selectedItems={pendingSelection}
        onConfirm={handleConfirmLicenseDownload}
      />
      </div>
    </BulkActionsManager>
  );
};

export default FilesPage;
