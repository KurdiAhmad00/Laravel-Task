import React, { useEffect, useState } from 'react';
import { incidentAPI } from '../../services/api';
import './ViewIncidentModal.css';

const getStorageUrl = (storageKey) => {
  return `http://localhost:8000/storage/${storageKey}`;
};

const ViewIncidentModal = ({ open, onClose, incidentId, userRole = 'citizen' }) => {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !incidentId) return;

    const fetchIncident = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await incidentAPI.getIncident(incidentId);
        setIncident(data.incident);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [open, incidentId]);

  const formatDate = (iso) => new Date(iso).toLocaleString();

  const getRoleColor = (role) => {
    switch ((role || 'citizen').toLowerCase()) {
      case 'citizen': return '#3B82F6'; // Blue
      case 'operator': return '#8B5CF6'; // Purple
      case 'agent': return '#F59E0B'; // Orange
      case 'admin': return '#EF4444'; // Red
      default: return '#10B981'; // Green fallback
    }
  };

  const handleDownload = async (attachment) => {
    try {
      // Get the token for authentication
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/attachments/${attachment.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'new': return '#3B82F6';
      case 'in progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#8B5CF6';
    }
  };

  if (!open) return null;

  return (
    <div className="view-modal-overlay" onClick={onClose}>
      <div className="view-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="view-modal-header">
          <h2 className="view-modal-title">Incident Details</h2>
          <button className="view-modal-close" onClick={onClose}>×</button>
        </div>

        {loading && (
          <div className="view-modal-loading">
            <div className="spinner"></div>
            <p>Loading incident details...</p>
          </div>
        )}

        {error && (
          <div className="view-modal-error">
            <p>{error}</p>
          </div>
        )}

        {incident && !loading && (
          <div className="view-modal-body">
            <div className="incident-field">
              <label>Title</label>
              <div className="incident-value">{incident.title}</div>
            </div>

            <div className="incident-field">
              <label>Description</label>
              <div className="incident-value incident-description">{incident.description}</div>
            </div>

            <div className="incident-row">
              <div className="incident-field">
                <label>Category</label>
                <div className="incident-value">{incident.category?.name || incident.category_name || incident.category || '-'}</div>
              </div>
              <div className="incident-field">
                <label>Priority</label>
                <div className="incident-value">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(incident.priority) }}
                  >
                    {incident.priority || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="incident-row">
              <div className="incident-field">
                <label>Status</label>
                <div className="incident-value">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(incident.status) }}
                  >
                    {incident.status || '—'}
                  </span>
                </div>
              </div>
              <div className="incident-field">
                <label>Created</label>
                <div className="incident-value">{incident.created_at ? formatDate(incident.created_at) : '-'}</div>
              </div>
            </div>

            <div className="incident-row">
              <div className="incident-field">
                <label>Latitude</label>
                <div className="incident-value">{incident.location_lat || 'N/A'}</div>
              </div>
              <div className="incident-field">
                <label>Longitude</label>
                <div className="incident-value">{incident.location_lng || 'N/A'}</div>
              </div>
            </div>

            {incident.attachments && incident.attachments.length > 0 && (
              <div className="incident-field">
                <label>Attachments</label>
                <div className="attachments-list">
                  {incident.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <span className="attachment-name">{attachment.filename}</span>
                        <span className="attachment-size">({(attachment.size_bytes / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="attachment-actions">
                        <button 
                          className="download-btn"
                          onClick={() => handleDownload(attachment)}
                          title="Download file"
                          style={{ backgroundColor: getRoleColor(userRole) }}
                        >
                          Download
                        </button>
                        {attachment.content_type?.startsWith('image/') && (
                          <div className="attachment-preview">
                            <img 
                              src={getStorageUrl(attachment.storage_key)}
                              alt={attachment.filename}
                              className="preview-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div style={{ display: 'none', padding: '10px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                              Preview not available
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incident.updated_at && incident.updated_at !== incident.created_at && (
              <div className="incident-field">
                <label>Last Updated</label>
                <div className="incident-value">{formatDate(incident.updated_at)}</div>
              </div>
            )}
          </div>
        )}

        <div className="view-modal-footer">
          <button className="view-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewIncidentModal;
