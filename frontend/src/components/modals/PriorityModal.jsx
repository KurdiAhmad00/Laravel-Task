import React, { useState, useEffect } from 'react';
import { incidentAPI } from '../../services/api';
import './PriorityModal.css';

const PriorityModal = ({ open, onClose, incidentId, onUpdated }) => {
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    if (!open || !incidentId) return;

    // Reset form when modal opens
    setPriority('');
    setError('');
    setLoading(false);
    setIncident(null);

    // Fetch incident details to get current priority
    const fetchIncident = async () => {
      try {
        setLoading(true);
        const { data } = await incidentAPI.getIncident(incidentId);
        setIncident(data.incident);
        setPriority(data.incident.priority || '');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [open, incidentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!priority) {
      setError('Please select a priority');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await incidentAPI.updatePriority(incidentId, priority);
      
      // Call the callback to refresh the parent component
      if (onUpdated) {
        onUpdated();
      }
      
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content priority-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update Priority</h3>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading && !incident ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading incident details...</p>
            </div>
          ) : (
            <>
              {incident && (
                <div className="incident-info">
                  <h4>{incident.title}</h4>
                  <p className="incident-description">{incident.description}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="priority">Priority Level</label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="priority-select"
                    disabled={loading}
                    required
                  >
                    <option value="">Select Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || !priority}
                  >
                    {loading ? 'Updating...' : 'Update Priority'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriorityModal;
