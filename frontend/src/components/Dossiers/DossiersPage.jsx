import React, { useState, useEffect } from 'react';
import dossierService from '../../services/dossierService';
import { FaPlus } from 'react-icons/fa';
import ViewModeSwitcher from '../Common/ViewModeSwitcher';
import Pagination from '../Pagination'; // Ajout de l'import du composant Pagination
import CreateDossierModal from './CreateDossierModal';
import UploadZipModal from './UploadZipModal';
import RenameDossierModal from './RenameDossierModal';
import DeleteDossierModal from './DeleteDossierModal';
import DossierList from './DossierList';
import { useViewMode } from '../../contexts/ViewModeContext';
import './DossiersPage.css';

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
  const [selectedDossier, setSelectedDossier] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
  const [dossierToRename, setDossierToRename] = useState(null);
  const [dossierToDelete, setDossierToDelete] = useState(null);
  const { viewMode, setViewMode } = useViewMode();

  useEffect(() => {
    fetchDossiers();
  }, []);

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
    setDossiers(prevDossiers => [...prevDossiers, newDossier].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleOpenUploadModal = (e, dossier) => {
    if (e) {
      e.preventDefault(); // Empêche la navigation
      e.stopPropagation(); // Empêche la propagation du clic
    }
    setSelectedDossier(dossier);
    setIsUploadModalOpen(true);
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

  const handleDossierRenamed = (updatedDossier) => {
    setDossiers(dossiers.map(d => d.id === updatedDossier.id ? updatedDossier : d));
    setDossierToRename(null);
  };

  const handleDossierDeleted = (deletedDossierId) => {
    setDossiers(dossiers.filter(d => d.id !== deletedDossierId));
    setDossierToDelete(null);
  };

  const handleUploadFinished = () => {
    setIsUploadModalOpen(false);
    fetchDossiers(); // Rafraîchit la liste pour mettre à jour le compteur de fichiers
  };

  if (loading) return <div className="dossiers-loading">Chargement...</div>;
  if (error) return <div className="dossiers-error">{error}</div>;

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Dossiers</h1>
          <p className="text-secondary">Vous avez {dossiers.length} dossier(s) dans votre coffre-fort</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <FaPlus className="mr-2"/> Nouveau Dossier
          </button>
        </div>
      </div>

      <div className="file-list-header">
        <h2 className="text-lg font-semibold">Dossiers sécurisés</h2>
        <div className="text-sm text-secondary">
          Page {pagination.page} sur {pagination.totalPages}
        </div>
      </div>

      <div className="folder-bar">
        <ViewModeSwitcher 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
          storageKey="dossiersViewMode" 
        />
      </div>
      
      <DossierList 
        dossiers={dossiers}
        loading={loading}
        error={error}
        viewMode={viewMode}
        activeMenu={activeMenu}
        toggleMenu={toggleMenu}
        handleOpenRenameModal={handleOpenRenameModal}
        handleOpenUploadModal={handleOpenUploadModal}
        handleOpenDeleteModal={handleOpenDeleteModal}
      />
      
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            itemsPerPage={10}
            totalItems={pagination.total}
            paginate={fetchDossiers}
            currentPage={pagination.page}
          />
        </div>
      )}
      <CreateDossierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDossierCreated={handleDossierCreated}
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
    </div>
  );
};

export default DossiersPage;
