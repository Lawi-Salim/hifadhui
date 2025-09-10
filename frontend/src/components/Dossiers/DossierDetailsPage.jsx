import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import dossierService from '../../services/dossierService';
import api from '../../services/api';
import Breadcrumb from '../Common/Breadcrumb';
import ItemList from '../Common/ItemList';
import CreateDossierModal from './CreateDossierModal';
import RenameDossierModal from './RenameDossierModal';
import DeleteDossierModal from './DeleteDossierModal';
import UploadZipModal from './UploadZipModal';
import RenameFileModal from '../Common/RenameFileModal';
import DeleteFileModal from '../Common/DeleteFileModal';
import FileUploadModal from '../Files/FileUploadModal';
import FormattedText from '../Common/FormattedText';
import ContentToolbar from '../Common/ContentToolbar';
import BulkActionsManager from '../Common/BulkActionsManager';
import { useViewMode } from '../../contexts/ViewModeContext';
import { createSlug, fixEncoding } from '../../utils/textUtils';
import { useDownloadZip, DownloadProgressIndicator } from '../Common/DownloadZip';
import { FaUpload, FaPlus } from 'react-icons/fa';
import './DossiersPage.css';
import '../Files/FileList.css';

const DossierDetailsPage = () => {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const id = params.id || params['*'];
  const location = useLocation();
  const { viewMode, setViewMode } = useViewMode();
  const [activeMenu, setActiveMenu] = useState(null);
  const [isFileRenameModalOpen, setIsFileRenameModalOpen] = useState(false);
  const [isFileDeleteModalOpen, setIsFileDeleteModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dossierToDelete, setDossierToDelete] = useState(null);
  const [dossierToUpload, setDossierToUpload] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dossierToRename, setDossierToRename] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pagination] = useState({ page: 1, totalPages: 1 });
  
  // Hook pour le téléchargement ZIP
  const {
    progressBar,
    handleDownloadZip,
    clearError
  } = useDownloadZip();

  const fetchDossierDetails = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      // Déterminer si c'est un ID UUID ou un chemin hiérarchique
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        // C'est un ID UUID, utiliser l'ancienne méthode
        response = await dossierService.getDossierById(id);
      } else {
        // C'est un chemin hiérarchique, utiliser la nouvelle méthode
        response = await dossierService.getDossierByPath(id);
      }
      
      setDossier(response.data.dossier);
    } catch (err) {
      console.error('Erreur lors du chargement du dossier:', err);
      setError('Erreur lors du chargement du dossier');
    } finally {
      setLoading(false);
    }
  }, [id, location.pathname]);

  useEffect(() => {
    fetchDossierDetails();
  }, [fetchDossierDetails]);

  // Réinitialiser la sélection lors du changement de dossier
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedItems([]);
    setActiveMenu(null);
  }, [id]);

  const handleDossierUpdated = () => {
    fetchDossierDetails();
  };

  const toggleMenu = (e, id) => {
    // Si e est null, fermer tous les menus
    if (e === null) {
      setActiveMenu(null);
      return;
    }
    
    // Si e est un événement, on l'utilise, sinon e est l'id
    if (e && typeof e === 'object' && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      setActiveMenu(activeMenu?.id === id ? null : { id, position: 'bottom' });
    } else {
      // e est en fait l'id dans ce cas
      setActiveMenu(activeMenu?.id === e ? null : { id: e, position: 'bottom' });
    }
  };

  const handleOpenFile = async (file) => {
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
      // Optionnel: afficher un message d'erreur à l'utilisateur
    }
  };

  const handleOpenFileRenameModal = (file) => {
    setSelectedFile(file);
    setIsFileRenameModalOpen(true);
    setActiveMenu(null);
  };

  const handleOpenFileDeleteModal = (fileId) => {
    setSelectedFile({ id: fileId });
    setIsFileDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const handleFileRenamed = () => {
    fetchDossierDetails();
  };

  const handleFileDeleted = () => {
    fetchDossierDetails();
  };

  const handleOpenRenameModal = (e, dossier) => {
    e.preventDefault();
    e.stopPropagation();
    setDossierToRename(dossier);
    setActiveMenu(null);
  };

  const handleOpenDeleteModal = (e, dossier) => {
    e.preventDefault();
    e.stopPropagation();
    setDossierToDelete(dossier);
    setActiveMenu(null);
  };

  const handleOpenUploadModal = (e, dossier) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsUploadModalOpen(true);
    setActiveMenu(null);
  };

  const handleDossierCreated = (newDossier) => {
    fetchDossierDetails();
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]);
  };

  const handleBatchDelete = () => {
    // Logique de suppression en lot si nécessaire
    console.log('Suppression en lot:', selectedItems);
  };

  const handleSelectItem = (item) => {
    if (isSelectionMode) {
      const isSelected = selectedItems.some(selected => selected.id === item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  // Fonction pour gérer le téléchargement ZIP
  const handleBatchDownload = async () => {
    console.log('🎯 handleBatchDownload appelé - DossierDetailsPage');
    console.log('📋 selectedItems:', selectedItems);
    console.log('📊 selectedItems.length:', selectedItems.length);
    
    if (selectedItems.length === 0) {
      console.warn('⚠️ Aucun élément sélectionné, arrêt');
      return;
    }

    // Filtrer seulement les fichiers (pas les dossiers) pour le téléchargement
    const selectedFiles = selectedItems.filter(item => item.mimetype);
    console.log('📂 Fichiers filtrés (avec mimetype):', selectedFiles);
    console.log('📂 Nombre de fichiers filtrés:', selectedFiles.length);

    if (selectedFiles.length === 0) {
      console.warn('⚠️ Aucun fichier sélectionné pour le téléchargement (pas de mimetype)');
      return;
    }

    console.log('🚀 Appel de handleDownloadZip avec', selectedFiles.length, 'fichiers');
    try {
      await handleDownloadZip(selectedFiles, 
        (result) => {
          console.log('✅ Succès callback:', result);
          console.log(`${result.fileCount} fichier(s) téléchargé(s) dans ${result.fileName}`);
          // Optionnel: quitter le mode sélection après téléchargement
          setIsSelectionMode(false);
          setSelectedItems([]);
        },
        (error) => {
          console.error('❌ Erreur callback:', error);
          console.error(`Erreur lors du téléchargement: ${error}`);
        }
      );
    } catch (error) {
      console.error('❌ Erreur téléchargement ZIP (catch):', error);
    }
  };

  // Construire le chemin hiérarchique pour l'URL et le breadcrumb avec slugs
  const buildHierarchicalPath = (ancestors, currentName) => {
    const pathParts = [...(ancestors || []).map(a => createSlug(fixEncoding(a.name))), currentName ? createSlug(fixEncoding(currentName)) : ''].filter(Boolean);
    return pathParts.join('/');
  };

  const breadcrumbItems = [
    { name: 'Mes Dossiers', path: '/dossiers' },
    ...(dossier?.ancestors || []).map((ancestor, index) => {
      const pathToAncestor = buildHierarchicalPath((dossier?.ancestors || []).slice(0, index + 1), '');
      return { name: ancestor.name, path: `/dossiers/${pathToAncestor}` };
    }),
    { name: dossier?.name || '', path: '' },
  ];

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="dossiers-error">{error}</div>;
  if (!dossier) return <div className="dossiers-error">Dossier non trouvé.</div>;

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Breadcrumb items={breadcrumbItems} />
          <h1 className="text-2xl font-bold">
            <FormattedText text={dossier.name_original || dossier.name} type="encoding" />
          </h1>
          <p className="text-secondary">{(dossier.subDossiers || []).length} sous-dossier(s) et {(dossier.dossierFiles || []).length} fichier(s)</p>
        </div>
        <div className="flex items-center gap-4">
                    <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-secondary">
            <FaUpload className="mr-2"/> Téléverser un fichier
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <FaPlus className="mr-2"/> Nouveau Dossier
          </button>
        </div>
      </div>

      <div className="file-list-header">
        <div className="header-left">
          <h2 className="text-lg font-semibold">Contenu du dossier</h2>
        </div>
        <div className="header-right">
          <div className="text-sm text-secondary">
            Page {pagination.page} sur {pagination.totalPages}
          </div>
          
          <ContentToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            storageKey="dossierDetailsViewMode"
            showPagination={false}
            showViewSwitcher={true}
            className="inline-toolbar"
            onToggleSelection={toggleSelectionMode}
            onBatchDelete={handleBatchDelete}
            onBatchDownload={() => {
              console.log('🔄 onBatchDownload wrapper appelé');
              console.log('🔗 handleBatchDownload exists:', !!handleBatchDownload);
              if (handleBatchDownload) {
                handleBatchDownload();
              } else {
                console.error('❌ handleBatchDownload non défini!');
              }
            }}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedItems.length}
            showSelectionTools={true}
          />
        </div>
      </div>

      <ItemList 
        items={[...(dossier.subDossiers || []), ...(dossier.dossierFiles || [])]}
        viewMode={viewMode}
        activeMenu={activeMenu}
        toggleMenu={toggleMenu}
        handleOpenRenameModal={handleOpenRenameModal}
        handleOpenUploadModal={handleOpenUploadModal}
        handleOpenDeleteModal={handleOpenDeleteModal}
        handleOpenFile={handleOpenFile}
        handleOpenFileRenameModal={handleOpenFileRenameModal}
        handleOpenFileDeleteModal={handleOpenFileDeleteModal}
        handleOpenPreviewModal={setSelectedFile}
        handleShare={(file) => console.log('Partager:', file)}
        isSelectionMode={isSelectionMode}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        onItemsUpdated={fetchDossierDetails}
        handleSelectItem={handleSelectItem}
      />

      {dossierToRename && (
        <RenameDossierModal
          isOpen={!!dossierToRename}
          onClose={() => setDossierToRename(null)}
          dossier={dossierToRename}
          onDossierRenamed={handleDossierUpdated}
        />
      )}
      {dossierToDelete && (
        <DeleteDossierModal
          isOpen={!!dossierToDelete}
          onClose={() => setDossierToDelete(null)}
          dossier={dossierToDelete}
          onDossierDeleted={handleDossierUpdated}
        />
      )}
      {dossierToUpload && (
        <UploadZipModal
          isOpen={!!dossierToUpload}
          onClose={() => setDossierToUpload(null)}
          dossierId={dossierToUpload.id}
          onUploadComplete={handleDossierUpdated}
        />
      )}
      <CreateDossierModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDossierCreated={handleDossierCreated}
        parentId={dossier?.id}
      />
      <RenameFileModal 
        isOpen={isFileRenameModalOpen}
        onClose={() => setIsFileRenameModalOpen(false)}
        file={selectedFile}
        onFileRenamed={handleFileRenamed}
      />
      <DeleteFileModal 
        isOpen={isFileDeleteModalOpen}
        onClose={() => setIsFileDeleteModalOpen(false)}
        file={selectedFile}
        onFileDeleted={handleFileDeleted}
      />
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleDossierUpdated}
        dossierId={id}
      />

      {/* Bulk Actions Manager */}
      <BulkActionsManager
        isSelectionMode={isSelectionMode}
        selectedItems={selectedItems}
        itemType="file"
        onSelectionModeChange={(mode) => {
          setIsSelectionMode(mode);
          if (!mode) setSelectedItems([]);
        }}
        onItemsUpdated={fetchDossierDetails}
        onSelectAll={() => {
          const allItems = [...(dossier.subDossiers || []), ...(dossier.dossierFiles || [])];
          if (selectedItems.length === allItems.length) {
            setSelectedItems([]);
          } else {
            setSelectedItems(allItems);
          }
        }}
        totalItems={((dossier?.subDossiers || []).length + (dossier?.dossierFiles || []).length)}
      />

      {/* Indicateur de progrès pour le téléchargement ZIP */}
      <DownloadProgressIndicator
        progressBar={progressBar}
        onClose={clearError}
      />

    </div>
  );
};

export default DossierDetailsPage;
