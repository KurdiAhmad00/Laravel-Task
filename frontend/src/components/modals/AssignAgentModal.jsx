import React, { useState, useEffect } from 'react';
import { incidentAPI, adminAPI } from '../../services/api';
import './AssignAgentModal.css';

const AssignAgentModal = ({ open, onClose, incidentId, onUpdated }) => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [incident, setIncident] = useState(null);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);

  useEffect(() => {
    if (!open || !incidentId) return;

    // Reset form when modal opens
    setSelectedAgent('');
    setError('');
    setLoading(false);
    setIncident(null);
    setShowUnassignConfirm(false);

    // Fetch incident details and agents
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch incident details
        const incidentResponse = await incidentAPI.getIncident(incidentId);
        setIncident(incidentResponse.data.incident);
        
        // Fetch available agents
        const agentsResponse = await adminAPI.getAgents();
        setAgents(agentsResponse.data.agents || []);
        
        // Pre-select current assigned agent if any
        if (incidentResponse.data.incident.assigned_agent_id) {
          setSelectedAgent(incidentResponse.data.incident.assigned_agent_id.toString());
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, incidentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      setError('Please select an agent');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await incidentAPI.assignIncident(incidentId, parseInt(selectedAgent));
      
      // Call the callback to refresh the parent component
      if (onUpdated) {
        onUpdated();
      }
      
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign agent');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleUnassignClick = () => {
    setShowUnassignConfirm(true);
  };

  const handleUnassignConfirm = async () => {
    try {
      setLoading(true);
      setError('');
      
      await incidentAPI.assignIncident(incidentId, null);
      
      if (onUpdated) {
        onUpdated();
      }
      
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to unassign incident');
    } finally {
      setLoading(false);
      setShowUnassignConfirm(false);
    }
  };

  const handleUnassignCancel = () => {
    setShowUnassignConfirm(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content assign-agent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Agent</h3>
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
                  <div className="incident-meta">
                    <span className="meta-item">
                      <strong>Priority:</strong> {incident.priority}
                    </span>
                    <span className="meta-item">
                      <strong>Status:</strong> {incident.status}
                    </span>
                    {incident.assigned_agent && (
                      <span className="meta-item current-assignment">
                        <strong>Currently assigned to:</strong> {incident.assigned_agent.name || incident.assigned_agent.email}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="agent">Select Agent</label>
                  <select
                    id="agent"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="agent-select"
                    disabled={loading}
                    required
                  >
                    <option value="">Choose an agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name || agent.email}
                      </option>
                    ))}
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
                  
                  {incident?.assigned_agent && (
                    <button
                      type="button"
                      onClick={handleUnassignClick}
                      
                      className="unassign-btn"
                      disabled={loading}
                    >
                      Unassign
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || !selectedAgent}
                  >
                    {loading ? 'Assigning...' : 'Assign Agent'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Unassign Confirmation Modal */}
      {showUnassignConfirm && (
        <div className="modal-overlay" onClick={handleUnassignCancel}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Unassign</h3>
              <button 
                className="modal-close-btn"
                onClick={handleUnassignCancel}
                disabled={loading}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-message">
                <p>Are you sure you want to unassign this incident from <strong>{incident?.assigned_agent?.name || incident?.assigned_agent?.email}</strong>?</p>
                <p className="confirm-warning">This will change the incident status back to "New" and remove the agent assignment.</p>
              </div>
              <div className="modal-actions">
                <button
                  onClick={handleUnassignCancel}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnassignConfirm}
                  className="confirm-unassign-btn"
                  disabled={loading}
                >
                  {loading ? 'Unassigning...' : 'Yes, Unassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignAgentModal;
