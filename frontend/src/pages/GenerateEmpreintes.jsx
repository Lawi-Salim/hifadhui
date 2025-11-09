import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiRefreshCw, 
  FiCopy, 
  FiCheckCircle, 
  FiPackage, 
  FiXCircle, 
  FiClock,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { FaFingerprint, FaTrash, FaEye } from 'react-icons/fa';
import api from '../services/api';
import QRCodeDisplay from '../components/Common/QRCodeDisplay';
import EmpreinteCard from '../components/Empreintes/EmpreinteCard';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Common/ToastContainer';
import './GenerateEmpreintes.css';

const GenerateEmpreintes = () => {
  const [empreintes, setEmpreintes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    disponibles: 0,
    utilisees: 0,
    expirees: 0,
    tauxUtilisation: 0
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedEmpreinte, setSelectedEmpreinte] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [qrCodeCache, setQrCodeCache] = useState({}); // Cache des QR Codes par ID d'empreinte
  const [count, setCount] = useState(10);
  const [expirationDays, setExpirationDays] = useState(30);
  const [filter, setFilter] = useState('all');
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();
  const [selectedEmpreintes, setSelectedEmpreintes] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [empreinteToDelete, setEmpreinteToDelete] = useState(null);

  // Charger les empreintes et statistiques
  useEffect(() => {
    fetchEmpreintes();
    fetchStats();
  }, [filter]);

  const fetchEmpreintes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/empreintes', {
        params: { 
          status: filter === 'all' ? undefined : filter,
          limit: 100,
          sortBy: 'sequence_number',
          sortOrder: 'DESC'
        }
      });
      setEmpreintes(response.data.data);
    } catch (error) {
      console.error('Erreur chargement empreintes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/empreintes/stats/summary');
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleGenerate = async () => {
    if (count < 1 || count > 100) {
      showWarning('Le nombre d\'empreintes doit être entre 1 et 100');
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post('/empreintes/generate', { 
        count, 
        expirationDays 
      });

      fetchEmpreintes();
      fetchStats();
    } catch (error) {
      console.error('Erreur génération:', error);
      showError('Erreur lors de la génération des empreintes');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (empreintes.length === 0) {
      showWarning('Aucune empreinte à exporter');
      return;
    }

    const csvContent = [
      ['Product ID', 'Hash SHA-256', 'Signature', 'QR Code URL', 'Statut', 'Date Génération', 'Date Expiration'].join(','),
      ...empreintes.map(e => [
        e.productId,
        e.hash,
        e.signature,
        e.qrCodeData,
        e.status,
        new Date(e.generatedAt).toLocaleDateString('fr-FR'),
        e.expiresAt ? new Date(e.expiresAt).toLocaleDateString('fr-FR') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `empreintes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleView = (empreinte) => {
    setSelectedEmpreinte(empreinte);
    setShowModal(true);
  };

  const handleDelete = (empreinte) => {
    setEmpreinteToDelete(empreinte);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/empreintes/${empreinteToDelete.id}`);
      setShowDeleteModal(false);
      setEmpreinteToDelete(null);
      fetchEmpreintes();
      fetchStats();
    } catch (error) {
      console.error('Erreur suppression:', error);
      showError('Erreur lors de la suppression de l\'empreinte');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedEmpreintes.length === 0) return;

    try {
      await Promise.all(
        selectedEmpreintes.map(id => api.delete(`/empreintes/${id}`))
      );
      setSelectedEmpreintes([]);
      fetchEmpreintes();
      fetchStats();
    } catch (error) {
      console.error('Erreur suppression en lot:', error);
      showError('Erreur lors de la suppression des empreintes');
    }
  };

  const toggleSelectEmpreinte = (empreinteId) => {
    setSelectedEmpreintes(prev => 
      prev.includes(empreinteId)
        ? prev.filter(id => id !== empreinteId)
        : [...prev, empreinteId]
    );
  };

  const toggleSelectAll = () => {
    const availableEmpreintes = empreintes.filter(e => e.status === 'disponible');
    if (selectedEmpreintes.length === availableEmpreintes.length) {
      setSelectedEmpreintes([]);
    } else {
      setSelectedEmpreintes(availableEmpreintes.map(e => e.id));
    }
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copié dans le presse-papiers`);
    } catch (error) {
      console.error('Erreur copie:', error);
      showError('Erreur lors de la copie');
    }
  };


  const handleExportJSON = () => {
    if (empreintes.length === 0) {
      showWarning('Aucune empreinte à exporter');
      return;
    }

    const jsonContent = JSON.stringify(empreintes, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `empreintes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const getStatusBadge = (empreinte) => {
    if (empreinte.status === 'disponible') {
      return <span className="status-badge status-disponible"><FiCheckCircle /> Disponible</span>;
    } else if (empreinte.status === 'utilise') {
      return <span className="status-badge status-utilise"><FiPackage /> Utilisée</span>;
    } else {
      return <span className="status-badge status-expire"><FiXCircle /> Expirée</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="empreintes-page">
      <div className="empreintes-header">
        <div className="header-content">
          <h1><FaFingerprint /> Gestion des Empreintes</h1>
          <p className="subtitle">Générez et gérez vos empreintes de propriété pour vos fichiers</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon files">
            <FaFingerprint />
          </div>
          <div className="metric-content">
            <h3>Total</h3>
            <div className="metric-value">{stats.total}</div>
            <div className="metric-subtitle">Toutes les empreintes</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon shares">
            <FiCheckCircle />
          </div>
          <div className="metric-content">
            <h3>Disponibles</h3>
            <div className="metric-value">{stats.disponibles}</div>
            <div className="metric-subtitle">Prêtes à l'emploi</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon users">
            <FiPackage />
          </div>
          <div className="metric-content">
            <h3>Utilisées</h3>
            <div className="metric-value">{stats.utilisees}</div>
            <div className="metric-subtitle">Liées aux fichiers</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon storage">
            <FiClock />
          </div>
          <div className="metric-content">
            <h3>Expirées</h3>
            <div className="metric-value">{stats.expirees}</div>
            <div className="metric-subtitle">Hors délai</div>
          </div>
        </div>
      </div>

      {/* Formulaire de génération */}
      <div className="generate-section">
        <h2>Générer de nouvelles empreintes</h2>
        <div className="generate-form">
          <div className="form-group">
            <label htmlFor="count">Nombre d'empreintes</label>
            <input
              type="number"
              id="count"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={generating}
            />
            <small>Entre 1 et 50 empreintes</small>
          </div>

          <div className="form-group">
            <label htmlFor="expiration">Expiration (jours)</label>
            <input
              type="number"
              id="expiration"
              min="1"
              max="14"
              value={expirationDays}
              onChange={(e) => setExpirationDays(Math.min(14, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={generating}
            />
            <small>Entre 1 et 14 jours</small>
          </div>

          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <FiRefreshCw className="spinning" /> Génération...
              </>
            ) : (
              <>
                <FaFingerprint  /> Générer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Actions et filtres */}
      <div className="actions-bar">
        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes
          </button>
          <button
            className={`filter-btn ${filter === 'disponible' ? 'active' : ''}`}
            onClick={() => setFilter('disponible')}
          >
            Disponibles
          </button>
          <button
            className={`filter-btn ${filter === 'utilise' ? 'active' : ''}`}
            onClick={() => setFilter('utilise')}
          >
            Utilisées
          </button>
          <button
            className={`filter-btn ${filter === 'expire' ? 'active' : ''}`}
            onClick={() => setFilter('expire')}
          >
            Expirées
          </button>
        </div>

        <div className="export-buttons">
          {selectedEmpreintes.length > 0 && (
            <button className="btn-delete-batch" onClick={handleBatchDelete}>
              <FaTrash /> Supprimer ({selectedEmpreintes.length})
            </button>
          )}
          <button className="btn-export" onClick={handleExportCSV}>
            <FiDownload /> Export CSV
          </button>
          <button className="btn-export" onClick={handleExportJSON}>
            <FiDownload /> Export JSON
          </button>
          <button className="btn-refresh" onClick={fetchEmpreintes}>
            <FiRefreshCw className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Tableau des empreintes */}
      <div className="empreintes-table-container">
        {loading ? (
          <div className="loading-state">
            <FiRefreshCw className="spinning" />
            <p>Chargement des empreintes...</p>
          </div>
        ) : empreintes.length === 0 ? (
          <div className="empty-state">
            <FaFingerprint size={48} />
            <h3>Aucune empreinte</h3>
            <p>Générez vos premières empreintes pour commencer</p>
          </div>
        ) : (
          <table className="empreintes-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedEmpreintes.length === empreintes.filter(e => e.status === 'disponible').length && empreintes.filter(e => e.status === 'disponible').length > 0}
                      onChange={toggleSelectAll}
                      disabled={empreintes.filter(e => e.status === 'disponible').length === 0}
                    />
                    <span className="checkmark"></span>
                  </label>
                </th>
                <th>Product ID</th>
                <th>Hash SHA-256</th>
                <th>Signature</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {empreintes.map((empreinte) => (
                <tr key={empreinte.id} className={selectedEmpreintes.includes(empreinte.id) ? 'selected' : ''}>
                  <td className="checkbox-cell">
                    {empreinte.status === 'disponible' && (
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={selectedEmpreintes.includes(empreinte.id)}
                          onChange={() => toggleSelectEmpreinte(empreinte.id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    )}
                  </td>
                  <td className="product-id">
                    <code>{empreinte.productId}</code>
                  </td>
                  <td className="hash">
                    <code title={empreinte.hash}>
                      {empreinte.hash.substring(0, 16)}...
                    </code>
                  </td>
                  <td className="signature">
                    <code title={empreinte.signature}>
                      {empreinte.signature.substring(0, 16)}...
                    </code>
                  </td>
                  <td>
                    {empreinte.status === 'disponible' && (
                      <span className="status-badge status-disponible">
                        <FiCheckCircle /> Disponible
                      </span>
                    )}
                    {empreinte.status === 'utilise' && (
                      <span className="status-badge status-utilise">
                        <FiPackage /> Utilisé
                      </span>
                    )}
                    {empreinte.status === 'expire' && (
                      <span className="status-badge status-expire">
                        <FiXCircle /> Expiré
                      </span>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleView(empreinte)}
                      title="Voir les détails"
                    >
                      <FaEye />
                    </button>
                    {empreinte.status === 'disponible' && (
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(empreinte)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && selectedEmpreinte && (
        <div className="modal-overlay modal-detail-empreinte" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de l'empreinte</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Product ID:</strong>
                <div className="copy-container">
                  <code>{selectedEmpreinte.productId}</code>
                  <button 
                    className="btn-copy" 
                    onClick={() => handleCopy(selectedEmpreinte.productId, 'Product ID')}
                    title="Copier"
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
              <div className="detail-row">
                <strong>Hash SHA-256:</strong>
                <div className="copy-container">
                  <code className="hash-full">{selectedEmpreinte.hash}</code>
                  <button 
                    className="btn-copy" 
                    onClick={() => handleCopy(selectedEmpreinte.hash, 'Hash SHA-256')}
                    title="Copier"
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
              <div className="detail-row">
                <strong>Signature:</strong>
                <div className="copy-container">
                  <code className="hash-full">{selectedEmpreinte.signature}</code>
                  <button 
                    className="btn-copy" 
                    onClick={() => handleCopy(selectedEmpreinte.signature, 'Signature')}
                    title="Copier"
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
              <div className="detail-row">
                <strong>Statut:</strong>
                {getStatusBadge(selectedEmpreinte)}
              </div>
              <div className="detail-row">
                <strong>Généré le:</strong>
                <span>{formatDate(selectedEmpreinte.generatedAt)}</span>
              </div>
              <div className="detail-row">
                <strong>Expire le:</strong>
                <span>{formatDate(selectedEmpreinte.expiresAt)}</span>
              </div>
              {selectedEmpreinte.usedAt && (
                <div className="detail-row">
                  <strong>Utilisé le:</strong>
                  <span>{formatDate(selectedEmpreinte.usedAt)}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>URL de vérification:</strong>
                <div className="copy-container">
                  <code className="hash-full">{selectedEmpreinte.qrCodeData}</code>
                  <button 
                    className="btn-copy" 
                    onClick={() => handleCopy(selectedEmpreinte.qrCodeData, 'URL de vérification')}
                    title="Copier"
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>

              {/* Carte d'identité de l'empreinte */}
              <div className="empreinte-card-section">
                <h3 className="section-title">Carte d'identité de l'empreinte</h3>
                <EmpreinteCard 
                  empreinte={{
                    product_id: selectedEmpreinte.productId,
                    qr_code_data: selectedEmpreinte.qrCodeData,
                    generated_at: selectedEmpreinte.generatedAt
                  }}
                  onDownload={() => {
                    console.log('Carte téléchargée:', selectedEmpreinte.productId);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && empreinteToDelete && (
        <div className="modal-overlay admin-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content admin-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-delete-header">
              <div className="admin-delete-title">
                <FiAlertTriangle className="admin-delete-icon" />
                <h3>Confirmation de suppression</h3>
              </div>
              <button 
                className="admin-delete-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <FiX />
              </button>
            </div>
            
            <div className="admin-delete-body">
              <p>
                Êtes-vous sûr de vouloir supprimer l'empreinte{' '}
                <code className="product-id-highlight">{empreinteToDelete.productId}</code> ?
              </p>
              <p className="admin-delete-warning">
                Cette action est irréversible.
              </p>
            </div>
            
            <div className="admin-delete-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                <FaTrash />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default GenerateEmpreintes;
