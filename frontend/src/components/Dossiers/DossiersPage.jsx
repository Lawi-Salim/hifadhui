import React, { useState, useEffect } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaImage, FaFilePdf, FaFileAlt, FaPlus, FaTrash, FaEdit, FaDownload, FaShare } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import FolderTreeView from './FolderTreeView';
import FolderContentView from './FolderContentView';
import CreateDossierModal from './CreateDossierModal';
import RenameDossierModal from './RenameDossierModal';
import DeleteDossierModal from './DeleteDossierModal';
import UploadZipModal from './UploadZipModal';
import DeleteBatchModal from '../Common/DeleteBatchModal';
import BulkActionsManager from '../Common/BulkActionsManager';
import RenameFileModal from '../Common/RenameFileModal';
import DeleteFileModal from '../Common/DeleteFileModal';
import ShareModal from '../Files/ShareModal';
import FileUploadModal from '../Files/FileUploadModal';
import api from '../../services/api';
import './DossiersPage.css';
import dossierService from '../../services/dossierService';
import { useViewMode } from '../../contexts/ViewModeContext';
import ContentToolbar from '../Common/ContentToolbar';
import { useDownloadZip } from '../Common/DownloadZip';

const DossiersPage = () => {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const fetchDossiers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await dossierService.getDossiers({ page });
      setDossiers(response.data.dossiers || response.data);
      
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
  const [activeMenu, setActiveMenu] = useState(null);
  const [dossierToRename, setDossierToRename] = useState(null);
  const [dossierToDelete, setDossierToDelete] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDossiers, setSelectedDossiers] = useState([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showTreePanel, setShowTreePanel] = useState(false);
  const { viewMode, setViewMode } = useViewMode();
  
  // États pour les modals de fichiers
  const [fileToRename, setFileToRename] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // États pour la nouvelle interface arborescence + contenu
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  // États pour la toolbar du contenu des dossiers
  const [folderSelectionMode, setFolderSelectionMode] = useState(false);
  const [selectedFolderItems, setSelectedFolderItems] = useState([]);
  
  // Hook pour le téléchargement ZIP
  const { handleDownloadZip } = useDownloadZip();

  useEffect(() => {
    fetchDossiers();
  }, []);

  // Handlers pour la nouvelle interface
  const handleFolderSelect = async (folder) => {
    // Si folder est null, désélectionner
    if (!folder) {
      setSelectedFolderId(null);
      setSelectedFolder(null);
      return;
    }
    
    setSelectedFolderId(folder.id);
    
    // Récupérer les détails complets du dossier avec ses sous-dossiers et fichiers
    try {
      const response = await dossierService.getDossierById(folder.id);
      setSelectedFolder(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier:', error);
      setSelectedFolder(folder);
    }
  };

  const handleToggleExpand = async (folderId) => {
    const isCurrentlyExpanded = expandedFolders.includes(folderId);
    
    if (!isCurrentlyExpanded) {
      // Récupérer les sous-dossiers avant d'étendre
      try {
        const response = await dossierService.getDossierById(folderId);
        const folderWithSubDossiers = response.data;
        
        // Mettre à jour le dossier dans la liste avec ses sous-dossiers
        setDossiers(prevDossiers => {
          const updateFolderRecursive = (folders) => {
            return folders.map(folder => {
              if (folder.id === folderId) {
                return { ...folder, subDossiers: folderWithSubDossiers.subDossiers };
              }
              if (folder.subDossiers) {
                return { ...folder, subDossiers: updateFolderRecursive(folder.subDossiers) };
              }
              return folder;
            });
          };
          return updateFolderRecursive(prevDossiers);
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des sous-dossiers:', error);
      }
    }
    
    setExpandedFolders(prev => 
      isCurrentlyExpanded
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleFileAction = (file) => {
    console.log('Action sur fichier:', file);
  };

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

  const handleFolderAction = (folder) => {
    handleFolderSelect(folder);
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

  const handleDossierCreated = (newDossier) => {
    // Ajouter le nouveau dossier à la liste
    setDossiers([...dossiers, newDossier]);
    setIsModalOpen(false);
    
    // Si le dossier a été créé dans un dossier parent sélectionné, 
    // recharger le contenu de ce dossier pour voir le nouveau dossier
    if (selectedFolder && newDossier.parent_id === selectedFolder.id) {
      handleFolderSelect(selectedFolder);
    }
  };

  const handleOpenUploadModal = (e, dossier) => {
    if (e) {
      e.preventDefault(); // Empêche la navigation
      e.stopPropagation(); // Empêche la propagation du clic
    }
    setSelectedDossier(dossier);
    setIsFileUploadModalOpen(true);
  };

    const toggleMenu = (e, dossierId, position = 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu?.id === dossierId ? null : { id: dossierId, position });
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

  // Handlers pour la toolbar du contenu des dossiers
  const handleToggleFolderSelection = () => {
    setFolderSelectionMode(!folderSelectionMode);
    if (folderSelectionMode) {
      setSelectedFolderItems([]);
    }
  };

  const handleFolderBatchDelete = async () => {
    // Ouvrir le modal de confirmation comme sur FilesPage
    if (selectedFolderItems.length > 0) {
      setIsBatchDeleteModalOpen(true);
    }
  };

  const handleConfirmFolderBatchDelete = async () => {
    setBatchDeleteLoading(true);
    setDeleteProgress(0);
    
    try {
      // Simuler la progression pendant la suppression
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) return prev;
          return Math.round(prev + Math.random() * 15);
        });
      }, 200);
      
      // Supprimer chaque fichier sélectionné
      for (const item of selectedFolderItems) {
        if (item.mimetype) { // C'est un fichier
          await api.delete(`/files/${item.id}`);
        }
      }
      
      // Compléter la progression
      clearInterval(progressInterval);
      setDeleteProgress(100);
      
      // Recharger le contenu du dossier
      if (selectedFolder) {
        const response = await dossierService.getDossierById(selectedFolder.id);
        setSelectedFolder(response.data);
      }
      
      // Réinitialiser la sélection après un délai
      setTimeout(() => {
        setFolderSelectionMode(false);
        setSelectedFolderItems([]);
        setIsBatchDeleteModalOpen(false);
        setBatchDeleteLoading(false);
        setDeleteProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setBatchDeleteLoading(false);
      setDeleteProgress(0);
    }
  };

  const handleFolderBatchDownload = async () => {
    if (selectedFolderItems.length > 0) {
      // Filtrer seulement les fichiers (pas les dossiers)
      const selectedFiles = selectedFolderItems.filter(item => item.mimetype);
      
      if (selectedFiles.length === 0) {
        return;
      }

      try {
        await handleDownloadZip(selectedFiles, 
          (result) => {
            // Réinitialiser la sélection
            setFolderSelectionMode(false);
            setSelectedFolderItems([]);
          },
          (error) => {
            console.error('❌ Erreur téléchargement:', error);
          }
        );
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
      }
    }
  };

  const handleDossierRenamed = (updatedDossier) => {
    setDossiers(dossiers.map(d => d.id === updatedDossier.id ? updatedDossier : d));
    setDossierToRename(null);
  };

  const handleDossierDeleted = (deletedDossierId) => {
    setDossiers(dossiers.filter(d => d.id !== deletedDossierId));
    setDossierToDelete(null);
  };

  const handleFileRenamed = () => {
    // Recharger le dossier sélectionné pour voir les changements
    if (selectedFolder) {
      handleFolderSelect(selectedFolder);
    }
    setIsRenameModalOpen(false);
    setFileToRename(null);
  };

  const handleFileDeleted = () => {
    // Recharger le dossier sélectionné pour voir les changements
    if (selectedFolder) {
      handleFolderSelect(selectedFolder);
    }
    setIsDeleteModalOpen(false);
    setFileToDelete(null);
  };

  const handleBatchDelete = () => {
    if (selectedDossiers.length === 0) return;
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    setBatchDeleteLoading(true);
    setDeleteProgress(0);
    
    try {
      const totalDossiers = selectedDossiers.length;
      
      // Supprimer tous les dossiers sélectionnés avec progression
      for (let i = 0; i < selectedDossiers.length; i++) {
        const dossierId = selectedDossiers[i];
        await dossierService.deleteDossier(dossierId);
        
        // Mettre à jour la progression
        const progress = Math.round(((i + 1) / totalDossiers) * 100);
        setDeleteProgress(progress);
        
        // Petite pause pour voir la progression
        if (i < selectedDossiers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Attendre un peu pour montrer 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mettre à jour la liste des dossiers
      setDossiers(dossiers.filter(d => !selectedDossiers.includes(d.id)));
      setSelectedDossiers([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
    } finally {
      setBatchDeleteLoading(false);
      setDeleteProgress(0);
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handleUploadFinished = () => {
    setIsUploadModalOpen(false);
    fetchDossiers(); // Rafraîchit la liste pour mettre à jour le compteur de fichiers
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedDossiers([]); // Réinitialiser la sélection en changeant de mode
  };

  const handleSelectDossier = (dossierId) => {
    setSelectedDossiers(prevSelected =>
      prevSelected.includes(dossierId)
        ? prevSelected.filter(id => id !== dossierId)
        : [...prevSelected, dossierId]
    );
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

  if (loading) return <div className="dossiers-loading">Chargement...</div>;
  if (error) return <div className="dossiers-error">{error}</div>;

  return (
    <BulkActionsManager
      isSelectionMode={isSelectionMode}
      selectedItems={selectedDossiers}
      itemType="dossier"
      onSelectionModeChange={setIsSelectionMode}
      onItemsUpdated={() => fetchDossiers()}
      onSelectAll={handleSelectAll}
      totalItems={dossiers.length}
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
            <button 
              className="btn btn-secondary mobile-tree-toggle"
              onClick={() => setShowTreePanel(!showTreePanel)}
            >
              <FaFolder /> Dossiers
            </button>

            <ContentToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              storageKey="dossiersPageViewMode"
              showPagination={false}
              showViewSwitcher={true}
              className="inline-toolbar"
              onToggleSelection={handleToggleFolderSelection}
              onBatchDelete={handleFolderBatchDelete}
              onBatchDownload={handleFolderBatchDownload}
              isSelectionMode={folderSelectionMode}
              selectedCount={selectedFolderItems.length}
              showSelectionTools={true}
            />
          </div>
        </div>

        {/* Nouvelle interface arborescence + contenu */}
        <div className="folders-split-view" onClick={(e) => {
          // Désélectionner le dossier si on clique en dehors de l'arborescence
          if (e.target === e.currentTarget) {
            setSelectedFolderId(null);
            setSelectedFolder(null);
          }
        }}>
          {/* Overlay pour fermer le drawer sur mobile */}
          {showTreePanel && (
            <div 
              className="tree-overlay" 
              onClick={() => setShowTreePanel(false)}
            ></div>
          )}
          
          <div className={`folders-tree-panel ${showTreePanel ? 'mobile-visible' : ''}`}>
            <FolderTreeView
              folders={dossiers}
              selectedFolderId={selectedFolderId}
              onFolderSelect={handleFolderSelect}
              expandedFolders={expandedFolders}
              onToggleExpand={handleToggleExpand}
              onFolderRename={handleOpenRenameModal}
              onFolderUpload={handleOpenUploadModal}
              onFolderDelete={handleOpenDeleteModal}
            />
          </div>
          
          <div className="folders-content-panel" onClick={(e) => {
            // Désélectionner le dossier si on clique dans la zone de contenu vide
            if (e.target === e.currentTarget || e.target.classList.contains('folder-content-empty')) {
              setSelectedFolderId(null);
              setSelectedFolder(null);
            }
          }}>
            <FolderContentView
              selectedFolder={selectedFolder}
              onFileDownload={handleFileDownload}
              onFileRename={handleFileRename}
              onFileDelete={handleFileDelete}
              onFileShare={handleFileShare}
              onFileUpload={handleOpenUploadModal}
              onFolderAction={handleFolderAction}
              isSelectionMode={folderSelectionMode}
              selectedItems={selectedFolderItems}
              onSelectionChange={setSelectedFolderItems}
              onToggleSelection={handleToggleFolderSelection}
              onBatchDelete={handleFolderBatchDelete}
              onBatchDownload={handleFolderBatchDownload}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>
        </div>
        <CreateDossierModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDossierCreated={handleDossierCreated}
          parentId={selectedFolderId}
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

        <DeleteBatchModal
          isOpen={isBatchDeleteModalOpen}
          onClose={() => setIsBatchDeleteModalOpen(false)}
          onConfirm={handleConfirmFolderBatchDelete}
          imageCount={selectedFolderItems.length}
          itemType="file"
          selectedItems={selectedFolderItems}
        />

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
      </div>
    </BulkActionsManager>
  );
};

export default DossiersPage;
