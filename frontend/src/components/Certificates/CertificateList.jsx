import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './CertificateList.css';
import { FiFileText, FiUpload, FiFolder, FiDownload, FiLock, FiShield, FiEye, FiEdit, FiSearch, FiMoreVertical, FiMenu } from 'react-icons/fi';
import ContentToolbar from '../Common/ContentToolbar';
import ItemList from '../Common/ItemList';
import FileDetailModal from '../Common/FileDetailModal';
import Pagination from '../Pagination';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenu, setActiveMenu] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [certificateToPreview, setCertificateToPreview] = useState(null);

  // Fonction pour calculer la position du menu avec hauteur dynamique
  const getMenuPosition = (buttonElement, optionsCount = 2) => {
    if (!buttonElement) return 'bottom';
    
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = optionsCount * 48 + 16; // 48px par option + padding
    const spaceBelow = viewportHeight - rect.bottom;
    
    return spaceBelow < menuHeight ? 'top' : 'bottom';
  };

  useEffect(() => {
    fetchCertificates();

    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu') && !event.target.closest('.btn-menu')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/certificates', {});
      setCertificates(response.data.certificates);
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors du chargement des certificats'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId, filename) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      // Créer un blob URL pour le téléchargement
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificat-${filename}`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors du téléchargement du certificat'
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCertificates = certificates.filter(cert => 
    cert.certificateFile && 
    cert.certificateFile.filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
    cert.pdf_url && 
    cert.pdf_url !== 'pending_generation'
  );

  // Logique de pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCertificates = filteredCertificates.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = pageNumber => setCurrentPage(pageNumber);
  
  // Calculer les informations de pagination
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const pagination = {
    totalPages,
    totalItems: filteredCertificates.length,
    itemsPerPage
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Transformer les certificats pour qu'ils fonctionnent avec ItemList
  const transformedCertificates = currentCertificates.map(certificate => ({
    id: certificate.id,
    filename: certificate.certificateFile.filename,
    // Utiliser le mimetype et l'URL du fichier original pour l'aperçu
    mimetype: certificate.certificateFile.mimetype,
    file_url: certificate.certificateFile.file_url || '',
    // Conserver les autres informations pertinentes
    version: certificate.certificateFile.version,
    date_upload: certificate.date_generated,
    hash: certificate.certificateFile.hash,
    signature: certificate.certificateFile.signature,
    isCertificate: true
  }));

  const handleCertificateDownload = (cert) => {
    const originalCert = certificates.find(c => c.id === cert.id);
    handleDownload(originalCert.id, originalCert.certificateFile.filename);
  };

  const handleCertificateView = (cert) => {
    const originalCert = certificates.find(c => c.id === cert.id);
    window.open(originalCert.pdf_url, '_blank', 'noopener,noreferrer');
  };

  const handleCertificatePreview = (cert) => {
    // Retrouver le certificat original pour avoir toutes les données, notamment `certificateFile`
    const originalCert = certificates.find(c => c.id === cert.id);
    if (originalCert && originalCert.certificateFile) {
      // On passe l'objet `certificateFile` complet au modal
      setCertificateToPreview({
        ...originalCert.certificateFile, // Contient la version, le nom, etc.
        isCertificate: true, // On ajoute cette propriété pour que le modal sache que c'est un certificat
        pdf_url: originalCert.pdf_url // L'URL du PDF à afficher/télécharger
      });
    } else {
      // Fallback au cas où, même si ça ne devrait pas arriver
      setCertificateToPreview(cert);
    }
    setIsPreviewModalOpen(true);
    setActiveMenu(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '400px' }}>
        <div className="loading"></div>
      </div>
    );
  }

  return (
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
            <h1 className="text-2xl font-bold">Mes certificats</h1>
            <p className="text-secondary">
              {filteredCertificates.length} certificat(s) de propriété généré(s) sur {certificates.length} total
            </p>
          </div>
        </div>
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom de fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {filteredCertificates.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-8">
            <div className="text-6xl mb-4"><FiFileText size={64} /></div>
            <h3 className="text-xl font-semibold mb-2">
              {certificates.length === 0 ? 'Aucun certificat généré' : 'Certificats en cours de génération'}
            </h3>
            <p className="text-secondary mb-4">
              {certificates.length === 0 
                ? 'Les certificats sont générés automatiquement lors de l\'upload de fichiers ou manuellement depuis la liste des fichiers'
                : `${certificates.length - filteredCertificates.length} certificat(s) sont en cours de génération et seront bientôt disponibles`
              }
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/upload" className="btn btn-primary">
                <FiUpload /> Uploader un fichier
              </a>
              <a href="/files" className="btn btn-secondary">
                <FiFolder /> Voir mes fichiers
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="file-list-header">
            <div className="header-left">
              <h2 className="text-lg font-semibold">Certificats de propriété</h2>
            </div>
            <div className="header-right">
              <div className="text-sm text-secondary text-page">
                Page {currentPage} sur {Math.ceil(filteredCertificates.length / itemsPerPage)}
              </div>

              <ContentToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                storageKey="certificatesViewMode"
                showPagination={false}
                showViewSwitcher={true}
                className="inline-toolbar"
                showSelectionTools={false}
              />
            </div>
          </div>

          <ItemList
            items={transformedCertificates}
            viewMode={viewMode}
            activeMenu={activeMenu}
            toggleMenu={(e, itemId) => {
              // Vérifier si e est un événement ou un ID direct
              if (e && typeof e === 'object' && e.preventDefault) {
                e.preventDefault();
                e.stopPropagation();
                const position = getMenuPosition(e.currentTarget, 2); // 2 options pour certificats: Aperçu, Télécharger
                setActiveMenu(activeMenu?.id === itemId ? null : { id: itemId, position });
              } else {
                // Si e est en fait l'ID (appel direct)
                const actualItemId = e;
                setActiveMenu(activeMenu?.id === actualItemId ? null : { id: actualItemId, position: 'bottom' });
              }
            }}
            // Handlers pour les actions
            handleOpenFile={handleCertificateView}
            handleOpenPreviewModal={handleCertificatePreview}
            handleOpenFileRenameModal={null} // Pas de renommer pour les certificats
            handleOpenFileDeleteModal={null} // Pas de supprimer pour les certificats
            handleShare={null} // Pas de partage pour les certificats
            // Props pour la sélection multiple (désactivée pour les certificats)
            isSelectionMode={false}
            selectedItems={[]}
            handleSelectItem={() => {}}
            // Handler personnalisé pour les certificats - désactivé
            customActionsMenu={null}
          />
        </>
      )}


      {certificateToPreview && (
        <FileDetailModal
          isOpen={isPreviewModalOpen}
          file={certificateToPreview}
          type="certificate"
          onClose={() => {
            setIsPreviewModalOpen(false);
            setCertificateToPreview(null);
          }}
        />
      )}

      {/* Pagination en bas */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          itemsPerPage={12}
          totalItems={pagination.totalItems || 0}
          paginate={handlePageChange}
          currentPage={currentPage}
        />
      )}

      <div className="card mt-6 footer-info">
        <div className="card-header">
          <h3 className="text-lg font-semibold">À propos des certificats</h3>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 className="font-semibold mb-2 text-primary"><FiShield /> Utilisation</h4>
              <p className="text-sm text-secondary">
                Chaque certificat contient l'empreinte SHA-256 unique du fichier original, 
                garantissant son intégrité et son authenticité.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-success"><FiEdit /> Signature numérique</h4>
              <p className="text-sm text-secondary">
                Une signature numérique unique est générée pour chaque fichier, 
                prouvant votre propriété intellectuelle.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-warning"><FiFileText /> Validité légale</h4>
              <p className="text-sm text-secondary">
                Ces certificats peuvent servir de preuve de propriété et d'antériorité 
                dans un contexte légal ou commercial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateList;
