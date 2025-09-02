import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import dossierService from '../../services/dossierService';
import api from '../../services/api';
import { FaArrowLeft, FaFolder, FaFileAlt, FaTh, FaList, FaEllipsisV, FaPlus, FaUpload } from 'react-icons/fa';
import Breadcrumb from '../Common/Breadcrumb';
import ItemList from '../Common/ItemList';
import CreateDossierModal from './CreateDossierModal';
import RenameDossierModal from './RenameDossierModal';
import DeleteDossierModal from './DeleteDossierModal';
import UploadZipModal from './UploadZipModal';
import RenameFileModal from '../Common/RenameFileModal';
import DeleteFileModal from '../Common/DeleteFileModal';
import FileUploadModal from '../Files/FileUploadModal';
import { useViewMode } from '../../contexts/ViewModeContext';
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
      setActiveMenu(activeMenu === id ? null : id);
    } else {
      // e est en fait l'id dans ce cas
      setActiveMenu(activeMenu === e ? null : e);
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
    e.preventDefault();
    e.stopPropagation();
    setDossierToUpload(dossier);
    setActiveMenu(null);
  };

  const handleDossierCreated = (newDossier) => {
    fetchDossierDetails();
  };

  // Construire le chemin hiérarchique pour l'URL et le breadcrumb
  const buildHierarchicalPath = (ancestors, currentName) => {
    const pathParts = [...(ancestors || []).map(a => a.name), currentName].filter(Boolean);
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
          <h1 className="text-2xl font-bold">{dossier.name}</h1>
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

      <div className="folder-bar">
        <div className="view-mode-switcher">
          <button onClick={() => setViewMode('grid')} className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}>
            <FaTh />
          </button>
          <button onClick={() => setViewMode('list')} className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}>
            <FaList />
          </button>
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
      />

      {/* {(dossier.subDossiers || []).length === 0 && (dossier.dossierFiles || []).length === 0 && (
        <p className="mt-4">Ce dossier est vide.</p>
      )} */}

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
    </div>
  );
};

export default DossierDetailsPage;
