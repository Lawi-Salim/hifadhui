import React, { useState, useEffect } from 'react';
import { getUserActivityDetails } from '../../services/adminService';
import { fixEncoding } from '../../utils/textUtils';
import './UserActivityDetails.css';

const UserActivityDetails = ({ userId }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await getUserActivityDetails(userId);
        setDetails(response.data);
      } catch (err) {
        setError('Erreur lors de la récupération des détails.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId]);

  if (loading) return <p>Chargement des détails...</p>;
  if (error) return <p>{error}</p>;

  const formatActionType = (actionType) => {
    if (!actionType) return 'N/A';
    return actionType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderActivityDetails = (activity) => {
    const { actionType, details } = activity;

    if (actionType === 'FOLDER_RENAME' && details) {
      return <span>{fixEncoding(details.newDossierName)}</span>;
    }

    if (actionType === 'FILE_RENAME' && details) {
      return <span>{fixEncoding(details.newFileName)}</span>;
    }

    if (actionType === 'ZIP_UPLOAD' && details) {
      const { fileName, extractedImageCount, extractedPdfCount } = details;
      const parts = [];
      if (extractedImageCount > 0) {
        parts.push(`${extractedImageCount} image${extractedImageCount > 1 ? 's' : ''}`);
      }
      if (extractedPdfCount > 0) {
        parts.push(`${extractedPdfCount} PDF${extractedPdfCount > 1 ? 's' : ''}`);
      }

      const detailsString = parts.length > 0 
        ? `(${parts.join(', ')})` 
        : `(${details.extractedFileCount || 0} fichiers)`;

      return (
        <span>
          {fixEncoding(fileName)}
          <span className="file-count-badge" style={{ marginLeft: '8px' }}>
            {detailsString}
          </span>
        </span>
      );
    }
    return fixEncoding(details?.dossierName || details?.fileName) || 'N/A';
  };

  return (
    <div className="user-activity-details">
      <div className="stats-container">
        <div className="stat-card">
          <h5>Uploads d'images</h5>
          <p>{details.stats.imageUpload}</p>
        </div>
        <div className="stat-card">
          <h5>Uploads de PDFs</h5>
          <p>{details.stats.pdfUpload}</p>
        </div>
        <div className="stat-card">
          <h5>Uploads de ZIPs</h5>
          <p>{details.stats.zipUpload}</p>
        </div>
        <div className="stat-card">
          <h5>Dossiers créés</h5>
          <p>{details.stats.folderCreate}</p>
        </div>
      </div>

      <div className="recent-activities">
        <div className="info-bar-activity">
          <h4>
            {details.recentActivities.length} activité{details.recentActivities.length > 1 ? 's' : ''} récente{details.recentActivities.length > 1 ? 's' : ''} ces 7 derniers jours
          </h4>
          <span>Eléments supprimés : {details.stats.deletedItems || 0}</span>
        </div>
        <div className="activities-table-container">
          {details.recentActivities.length > 0 ? (
            <table className="activities-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {details.recentActivities.map(activity => (
                <tr key={activity.id}>
                  <td style={{ fontSize: '0.95rem' }}>
                    {new Date(activity.created_at || activity.createdAt)
                      .toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      .replace(',', ' à')}
                  </td>
                  <td>
                    <span 
                      className={`action-type-badge ${
                        activity.actionType.includes('_DELETE')
                          ? 'delete-action'
                          : (activity.actionType.includes('_UPLOAD') || activity.actionType.includes('_CREATE'))
                          ? 'upload-action'
                          : ''
                      }`}>
                      {formatActionType(activity.actionType)}
                    </span>
                  </td>
                  <td>{renderActivityDetails(activity)}</td>
                </tr>
              ))}
              </tbody>
            </table>
          ) : (
            <p>Aucune activité récente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActivityDetails;
