import React, { useState, useEffect } from 'react';
import { FaFolder, FaPlus } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import FolderContent from './FolderContent';
import ModalFolder from '../Common/ModalFolder';
import RenameDossierModal from './RenameDossierModal';
import DeleteDossierModal from './DeleteDossierModal';
import UploadZipModal from './UploadZipModal';
import BulkActionsManager from '../Common/BulkActionsManager';
import MoveModal from '../Common/ModalMove';
import RenameFileModal from '../Common/RenameFileModal';
import DeleteFileModal from '../Common/DeleteFileModal';
import ShareModal from '../Files/ShareModal';
import FileUploadModal from '../Files/FileUploadModal';
import api from '../../services/api';
import './DossiersPage.css';
import LoadingSpinner from '../Common/LoadingSpinner';
import dossierService from '../../services/dossierService';
import { useViewMode } from '../../contexts/ViewModeContext';
import ContentToolbar from '../Common/ContentToolbar';
import { useDownloadZip } from '../Common/DownloadZip';
import DeleteBatchModal from '../Common/DeleteBatchModal';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Common/ToastContainer';
import FolderDetails from './FolderDetails';

const DossiersPage = () => {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const fetchDossiers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await dossierService.getDossiers({ page });
      const fetchedDossiers = response.data.dossiers || response.data;
      setDossiers(fetchedDossiers);
      
      if (response.data.pagination) {
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          total: response.data.pagination.total
        });
      }
    } catch (err) {
      setError('Erreur lors de la récupération des dossiers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null); // dossier sélectionné dans le ContentTree
  const [activeMenu, setActiveMenu] = useState(null);
  const [dossierToRename, setDossierToRename] = useState(null);
  const [dossierToDelete, setDossierToDelete] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDossiers, setSelectedDossiers] = useState([]);
  const [showTreePanel, setShowTreePanel] = useState(false);
  const { viewMode, setViewMode } = useViewMode();
  
  // États pour les modals de fichiers
  const [fileToRename, setFileToRename] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sélection multiple de fichiers dans la vue Mes Dossiers
  const [isFileSelectionMode, setIsFileSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isFileBatchDeleteModalOpen, setIsFileBatchDeleteModalOpen] = useState(false);

  // Déplacement ciblé (un seul dossier via le menu ActionFolder)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveItems, setMoveItems] = useState([]);
  const [moveItemType, setMoveItemType] = useState('file');
  const [isFolderDetailsOpen, setIsFolderDetailsOpen] = useState(false);
  const [folderDetails, setFolderDetails] = useState(null);

  // Hook pour le téléchargement ZIP
  const { handleDownloadZip } = useDownloadZip();

  // Toasts (succès / erreur)
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // Compter les éléments visés par la toolbar (fichiers sélectionnés ou dossier courant)
  const toolbarSelectedCount = selectedFiles.length > 0
    ? selectedFiles.length
    : (selectedFolder ? 1 : 0);

  useEffect(() => {
    fetchDossiers();
  }, []);

  const handleFileDownload = async (file) => {
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
    }
  };

  const handleFileRename = (file) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  };

  const handleFileDelete = (file) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handleFileShare = (file) => {
    setFileToShare(file);
    setIsShareModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest(`.dossier-card-link-${activeMenu?.id || activeMenu}`)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Réinitialiser la sélection de fichiers lors du changement de dossier sélectionné
  useEffect(() => {
    setIsFileSelectionMode(false);
    setSelectedFiles([]);
  }, [selectedFolder]);

  const handleDossierCreated = async (newDossier, parentId) => {
    // Fermer le modal de création
    setIsModalOpen(false);

    // Rafraîchir la liste des dossiers racine pour mettre à jour l'arborescence
    await fetchDossiers();

    // Si on est actuellement dans le dossier parent, recharger ses détails
    if (selectedFolder && parentId && selectedFolder.id === parentId) {
      try {
        const response = await dossierService.getDossierById(selectedFolder.id);
        setSelectedFolder(response.data);
      } catch (error) {
        console.error('Erreur lors du rechargement du dossier après création :', error);
      }
    }

    const nameLabel = newDossier?.name_original || newDossier?.name || 'Dossier';
    showSuccess(`${nameLabel} créé avec succès`);
  };

  const handleOpenUploadModal = (e, dossier) => {
    if (e) {
      e.preventDefault(); // Empêche la navigation
      e.stopPropagation(); // Empêche la propagation du clic
    }
    setSelectedDossier(dossier);
    setIsFileUploadModalOpen(true);
  };


    const handleOpenRenameModal = (e, dossier) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDossierToRename(dossier);
    setActiveMenu(null);
  };

  const handleOpenDeleteModal = (e, dossier) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDossierToDelete(dossier);
    setActiveMenu(null);
  };

  const handleDossierRenamed = (updatedDossier) => {
    setDossiers(dossiers.map(d => d.id === updatedDossier.id ? updatedDossier : d));
    setDossierToRename(null);
  };

  const handleDossierDeleted = (deletedDossierId) => {
    const deleted = dossiers.find((d) => d.id === deletedDossierId) || dossierToDelete;
    const nameLabel = deleted?.name_original || deleted?.name || 'Dossier';

    setDossiers(dossiers.filter(d => d.id !== deletedDossierId));
    setDossierToDelete(null);

    showSuccess(`${nameLabel} supprimé avec succès`);
  };

  const handleFileRenamed = () => {
    // Recharger la liste des dossiers pour mettre à jour les compteurs
    fetchDossiers();
    setIsRenameModalOpen(false);
    setFileToRename(null);
  };

  const handleFileDeleted = () => {
    // Recharger la liste des dossiers pour mettre à jour les compteurs
    fetchDossiers();
    const nameLabel = fileToDelete?.filename || 'Fichier';
    setIsDeleteModalOpen(false);
    setFileToDelete(null);
    showSuccess(`${nameLabel} supprimé avec succès`);
  };

  const handleUploadFinished = () => {
    setIsUploadModalOpen(false);
    fetchDossiers(); // Rafraîchit la liste pour mettre à jour le compteur de fichiers
  };


  // Gestion de la sélection multiple de fichiers (ContentView)
  const handleToggleFileSelectionMode = () => {
    setIsFileSelectionMode(prev => !prev);
    setSelectedFiles([]);
  };

  const handleSelectFile = (file) => {
    setSelectedFiles(prev => {
      const exists = prev.some(f => f.id === file.id);
      if (exists) {
        return prev.filter(f => f.id !== file.id);
      }
      return [...prev, file];
    });
  };

  // Récupérer récursivement tous les fichiers d'un dossier (et de ses sous-dossiers)
  const collectFilesFromDossier = async (dossierId, visited = new Set()) => {
    if (!dossierId || visited.has(dossierId)) return [];
    visited.add(dossierId);

    const response = await dossierService.getDossierById(dossierId);
    const dossier = response.data;

    const currentFiles = dossier.dossierFiles || [];
    const subDossiers = dossier.subDossiers || [];

    const nestedFilesArrays = await Promise.all(
      subDossiers.map(sub => collectFilesFromDossier(sub.id, visited))
    );

    return currentFiles.concat(...nestedFilesArrays);
  };

  const handleFileBatchDownload = async () => {
    try {
      let filesToDownload = selectedFiles;

      // Si aucun fichier sélectionné mais un dossier est sélectionné, télécharger tout le contenu du dossier
      if ((!filesToDownload || filesToDownload.length === 0) && selectedFolder) {
        filesToDownload = await collectFilesFromDossier(selectedFolder.id);
      }

      if (!filesToDownload || filesToDownload.length === 0) return;

      await handleDownloadZip(
        filesToDownload,
        () => {
          setIsFileSelectionMode(false);
          setSelectedFiles([]);
        },
        (error) => {
          console.error('Erreur lors du téléchargement ZIP:', error);
        }
      );
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
    }
  };

  const handleFileBatchDelete = () => {
    // Si des fichiers sont sélectionnés, ouvrir la suppression par lot
    if (selectedFiles.length > 0) {
      setIsFileBatchDeleteModalOpen(true);
      return;
    }

    // Sinon, si un dossier est sélectionné, ouvrir le modal de suppression de dossier
    if (selectedFolder) {
      setDossierToDelete(selectedFolder);
    }
  };

  // Ouvrir la modale de déplacement pour un dossier unique (menu ActionFolder)
  const handleFolderMove = (folder) => {
    if (!folder) return;
    setMoveItems([folder]);
    setMoveItemType('dossier');
    setIsMoveModalOpen(true);
  };

  const handleMoveSuccess = () => {
    // Recharger la liste des dossiers racine et le dossier courant
    fetchDossiers();
    if (selectedFolder) {
      dossierService
        .getDossierById(selectedFolder.id)
        .then((response) => {
          setSelectedFolder(response.data);
        })
        .catch((error) => {
          console.error('Erreur lors du rechargement du dossier après déplacement :', error);
        });
    }
    showSuccess('Dossier déplacé avec succès');
    setIsMoveModalOpen(false);
  };

  const handleMoveError = (message) => {
    showError(message || 'Erreur lors du déplacement du dossier');
  };

  const handleOpenFolderDetails = async (folder) => {
    if (!folder || !folder.id) return;
    try {
      let fullFolder = folder;
      if (!folder.dossierFiles) {
        const response = await dossierService.getDossierById(folder.id);
        fullFolder = response.data;
      }
      const allFiles = await collectFilesFromDossier(fullFolder.id);

      // Ne compter que les images et PDFs pour les statistiques de taille
      const relevantFiles = allFiles.filter((f) => {
        if (!f || !f.mimetype) return false;
        return (
          f.mimetype.startsWith('image/') ||
          f.mimetype === 'application/pdf'
        );
      });

      const totalFiles = relevantFiles.length;
      const imagesCount = relevantFiles.filter(
        (f) => f.mimetype && f.mimetype.startsWith('image/')
      ).length;

      const pdfCount = relevantFiles.filter(
        (f) => f.mimetype === 'application/pdf'
      ).length;

      const totalSizeBytes = relevantFiles.reduce(
        (total, file) => total + (Number(file.size) || 0),
        0
      );

      setFolderDetails({
        ...fullFolder,
        recursiveFiles: relevantFiles,
        recursiveFileCount: totalFiles,
        recursiveImagesCount: imagesCount,
        recursivePdfCount: pdfCount,
        recursiveSizeBytes: totalSizeBytes,
      });
      setIsFolderDetailsOpen(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails du dossier :', error);
    }
  };

  const handleConfirmFileBatchDelete = async () => {
    try {
      const fileIds = selectedFiles.map(file => file.id);
      if (fileIds.length > 0) {
        await api.delete('/files/batch-delete', { data: { fileIds } });
      }

      // Rafraîchir la liste des dossiers racine
      fetchDossiers();

      // Recharger le dossier sélectionné pour mettre à jour les fichiers
      if (selectedFolder) {
        const response = await dossierService.getDossierById(selectedFolder.id);
        setSelectedFolder(response.data);
      }

      setIsFileSelectionMode(false);
      setSelectedFiles([]);
      showSuccess('Fichiers supprimés avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression par lot de fichiers:', error);
    } finally {
      setIsFileBatchDeleteModalOpen(false);
    }
  };

  const handleToolbarRename = () => {
    if (selectedFiles.length === 1) {
      handleFileRename(selectedFiles[0]);
    } else if (selectedFiles.length === 0 && selectedFolder) {
      setDossierToRename(selectedFolder);
    }
  };

  // Callback appelé après une action en lot (déplacement/copie) via BulkActionsManager
  const handleFilesUpdated = () => {
    // Recharger la liste des dossiers pour mettre à jour les compteurs
    fetchDossiers();

    // Recharger le dossier sélectionné pour mettre à jour les fichiers
    if (selectedFolder) {
      dossierService
        .getDossierById(selectedFolder.id)
        .then((response) => {
          setSelectedFolder(response.data);
        })
        .catch((error) => {
          console.error('Erreur lors du rechargement du dossier après une action en lot:', error);
        });
    }

    // Réinitialiser la sélection de fichiers
    setSelectedFiles([]);
  };

  // Sélectionner/désélectionner tous les fichiers visibles du dossier courant
  const handleSelectAllFiles = () => {
    if (!selectedFolder || !selectedFolder.dossierFiles) {
      setSelectedFiles([]);
      return;
    }

    if (selectedFiles.length === selectedFolder.dossierFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...(selectedFolder.dossierFiles || [])]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDossiers.length === dossiers.length) {
      // Si tous sont sélectionnés, désélectionner tout
      setSelectedDossiers([]);
    } else {
      // Sinon, sélectionner tous les dossiers visibles
      setSelectedDossiers(dossiers.map(dossier => dossier.id));
    }
  };

  if (loading) return <LoadingSpinner message="Chargement des dossiers..." />;
  if (error) return <div className="dossiers-error">{error}</div>;

  return (
    <BulkActionsManager
      isSelectionMode={isFileSelectionMode}
      selectedItems={selectedFiles}
      itemType="file"
      onSelectionModeChange={setIsFileSelectionMode}
      onItemsUpdated={handleFilesUpdated}
      onSelectAll={handleSelectAllFiles}
      totalItems={selectedFolder && selectedFolder.dossierFiles ? selectedFolder.dossierFiles.length : 0}
    >
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div className='my-space-title'>
            <button 
              className="mobile-hamburger-menu"
              onClick={() => {
                // Déclencher l'ouverture du sidebar
                const event = new CustomEvent('toggleSidebar');
                window.dispatchEvent(event);
              }}
              aria-label="Toggle menu"
            >
              <FiMenu />
            </button>
            <div className="title-content">
              <h1 className="text-2xl font-bold">Mes Dossiers</h1>
              <p className="text-secondary">Vous avez {dossiers.length} dossier(s) dans votre coffre-fort</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <FaPlus className="mr-2"/> Nouveau Dossier
            </button>
          </div>
        </div>

      
        <div className="file-list-header">
          <div className="header-left">
            <h2 className="text-lg font-semibold">Arborescence</h2>
          </div>
          <div className="header-right">
            <ContentToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              storageKey="dossiersPageViewMode"
              showPagination={false}
              showViewSwitcher={true}
              className="inline-toolbar"
              onToggleSelection={handleToggleFileSelectionMode}
              onBatchDelete={handleFileBatchDelete}
              onBatchDownload={handleFileBatchDownload}
              isSelectionMode={isFileSelectionMode}
              selectedCount={toolbarSelectedCount}
              showSelectionTools={true}
              showRenameIcon={true}
              onBatchRename={handleToolbarRename}
            />
          </div>
        </div>

        <FolderContent
          dossiers={dossiers}
          loadDossierDetails={async (id) => {
            const response = await dossierService.getDossierById(id);
            return response.data;
          }}
          selectedFolder={selectedFolder}
          onFolderSelected={setSelectedFolder}
          onFolderRename={(folder) => handleOpenRenameModal(null, folder)}
          onFolderDelete={(folder) => handleOpenDeleteModal(null, folder)}
          onFolderMove={handleFolderMove}
          onFolderAccessDetails={handleOpenFolderDetails}
          onFileDownload={handleFileDownload}
          onFileRename={handleFileRename}
          onFileDelete={handleFileDelete}
          onFileShare={handleFileShare}
          onFileUpload={handleOpenUploadModal}
          isSelectionMode={isFileSelectionMode}
          selectedItems={selectedFiles}
          onSelectItem={handleSelectFile}
        />
        <ModalFolder 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDossierCreated={handleDossierCreated}
          initialParentId={selectedFolder ? selectedFolder.id : null}
          onError={showError}
        />
        {dossierToRename && (
          <RenameDossierModal
            isOpen={!!dossierToRename}
            onClose={() => setDossierToRename(null)}
            dossier={dossierToRename}
            onDossierRenamed={handleDossierRenamed}
          />
        )}

        {dossierToDelete && (
          <DeleteDossierModal
            isOpen={!!dossierToDelete}
            onClose={() => setDossierToDelete(null)}
            dossier={dossierToDelete}
            onDossierDeleted={handleDossierDeleted}
          />
        )}

        {folderDetails && (
          <FolderDetails
            isOpen={isFolderDetailsOpen}
            onClose={() => {
              setIsFolderDetailsOpen(false);
              setFolderDetails(null);
            }}
            folder={folderDetails}
          />
        )}

        {selectedDossier && (
          <UploadZipModal 
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadFinished={handleUploadFinished}
            dossier={selectedDossier}
          />
        )}

        {selectedDossier && (
          <FileUploadModal
            isOpen={isFileUploadModalOpen}
            onClose={() => setIsFileUploadModalOpen(false)}
            onUploadComplete={handleUploadFinished}
            dossierId={selectedDossier.id}
          />
        )}

      {/* Modals pour les fichiers */}
      {fileToRename && (
        <RenameFileModal
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setFileToRename(null);
          }}
          file={fileToRename}
          onFileRenamed={handleFileRenamed}
        />
      )}

      {fileToDelete && (
        <DeleteFileModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setFileToDelete(null);
          }}
          file={fileToDelete}
          onFileDeleted={handleFileDeleted}
        />
      )}

      {isFileBatchDeleteModalOpen && (
        <DeleteBatchModal
          isOpen={isFileBatchDeleteModalOpen}
          onClose={() => setIsFileBatchDeleteModalOpen(false)}
          onConfirm={handleConfirmFileBatchDelete}
          imageCount={selectedFiles.length}
          itemType="file"
          selectedItems={selectedFiles}
        />
      )}

      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        selectedItems={moveItems}
        itemType={moveItemType}
        onSuccess={handleMoveSuccess}
        onError={handleMoveError}
      />

      {fileToShare && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setFileToShare(null);
          }}
          file={fileToShare}
        />
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </BulkActionsManager>
  );
};

export default DossiersPage;
