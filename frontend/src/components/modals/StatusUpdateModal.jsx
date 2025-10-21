import React, { useState, useEffect } from 'react';
import { incidentAPI } from '../../services/api';
import './StatusUpdateModal.css';

const StatusUpdateModal = ({ open, onClose, incidentId, onStatusUpdated }) => {
  const [incident, setIncident] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Unresolved', label: 'Unresolved' }
  ];

  useEffect(() => {
    if (open && incidentId) {
      loadIncident();
    } else {
      // Reset form when modal closes
      setIncident(null);
      setStatus('');
      setError('');
      setSubmitting(false);
    }
  }, [open, incidentId]);

  const loadIncident = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentAPI.getIncident(incidentId);
      setIncident(data.incident);
      
      // Set default status to a valid option for agents
      const currentStatus = data.incident.status;
      if (['In Progress', 'Resolved', 'Unresolved'].includes(currentStatus)) {
        setStatus(currentStatus);
      } else {
        setStatus('In Progress'); // Default to In Progress for new/assigned incidents
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) return;

    setSubmitting(true);
    setError('');
    try {
      await incidentAPI.updateStatus(incidentId, status);
      onStatusUpdated?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content status-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Incident Status</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading incident details...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadIncident} className="retry-btn">Try Again</button>
            </div>
          ) : incident ? (
            <>
              <div className="incident-info">
                <h3>Incident #{incident.id}</h3>
                <div className="incident-meta">
                  <div className="incident-field">
                    <strong>Title:</strong> {incident.title}
                  </div>
                  <div className="incident-field">
                    <strong>Current Status:</strong> 
                    <span className="current-status">{incident.status || 'New'}</span>
                  </div>
                  <div className="incident-field">
                    <strong>Priority:</strong> {incident.priority || 'Low'}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="status">New Status *</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="status-select"
                    required
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting || !status}
                  >
                    {submitting ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
