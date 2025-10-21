import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './AuditLogModal.css';

const AuditLogModal = ({ open, onClose, incidentId, incidentTitle }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && incidentId) {
      loadAuditLogs();
    } else {
      // Reset when modal closes
      setAuditLogs([]);
      setIncident(null);
      setError('');
    }
  }, [open, incidentId]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminAPI.getIncidentAuditLogs(incidentId);
      setIncident(data.incident);
      setAuditLogs(data.audit_logs || []);
    } catch (e) {
      setError('Failed to load audit logs. Please try again.');
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString();
  };

  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'created':
        return '📝';
      case 'updated':
        return '✏️';
      case 'assigned':
        return '👤';
      case 'status_changed':
        return '🔄';
      case 'priority_changed':
        return '⚡';
      case 'resolved':
        return '✅';
      case 'closed':
        return '🔒';
      case 'note_added':
        return '📄';
      case 'attachment_added':
        return '📎';
      case 'attachment_removed':
        return '🗑️';
      default:
        return '📋';
    }
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'created':
        return '#10B981'; // Green
      case 'updated':
        return '#3B82F6'; // Blue
      case 'assigned':
        return '#8B5CF6'; // Purple
      case 'status_changed':
        return '#F59E0B'; // Orange
      case 'priority_changed':
        return '#EF4444'; // Red
      case 'resolved':
        return '#10B981'; // Green
      case 'closed':
        return '#6B7280'; // Gray
      case 'note_added':
        return '#3B82F6'; // Blue
      case 'attachment_added':
        return '#8B5CF6'; // Purple
      case 'attachment_removed':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If not valid JSON, return as string
        return value;
      }
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content audit-log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Audit Log</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadAuditLogs} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {incident && (
                <div className="incident-info">
                  <h3>{incident.title}</h3>
                  <div className="incident-meta">
                    <div className="incident-field">
                      <strong>Status:</strong> {incident.status}
                    </div>
                    <div className="incident-field">
                      <strong>Priority:</strong> {incident.priority}
                    </div>
                    <div className="incident-field">
                      <strong>Category:</strong> {incident.category?.name || 'N/A'}
                    </div>
                    <div className="incident-field">
                      <strong>Citizen:</strong> {incident.citizen?.name || incident.citizen?.email || 'N/A'}
                    </div>
                    {incident.assigned_agent && (
                      <div className="incident-field">
                        <strong>Assigned Agent:</strong> {incident.assigned_agent?.name || incident.assigned_agent?.email || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="audit-logs-section">
                <h4>Activity History ({auditLogs.length})</h4>
                
                {auditLogs.length === 0 ? (
                  <div className="no-logs">
                    <p>No audit logs found for this incident.</p>
                  </div>
                ) : (
                  <div className="audit-logs-list">
                    {auditLogs.map((log, index) => (
                      <div key={log.id || index} className="audit-log-item">
                        <div className="log-header">
                          <div className="log-action">
                            <span className="action-icon">{getActionIcon(log.action)}</span>
                            <span 
                              className="action-text"
                              style={{ color: getActionColor(log.action) }}
                            >
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="log-meta">
                            <span className="log-actor">
                              by {log.actor?.name || log.actor?.email || 'Unknown User'}
                            </span>
                            <span className="log-date">{formatDate(log.created_at)}</span>
                          </div>
                        </div>
                        
                        {(log.old_values || log.new_values) && (
                          <div className="log-changes">
                            {log.old_values && (() => {
                              try {
                                const parsedOld = typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values;
                                return Object.keys(parsedOld).length > 0 && (
                                  <div className="change-section">
                                    <h5>Previous Values:</h5>
                                    <div className="values-display old-values">
                                      {Object.entries(parsedOld).map(([key, value]) => (
                                        <div key={key} className="value-item">
                                          <strong>{key}:</strong> {formatValue(value)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                            
                            {log.new_values && (() => {
                              try {
                                const parsedNew = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values;
                                return Object.keys(parsedNew).length > 0 && (
                                  <div className="change-section">
                                    <h5>New Values:</h5>
                                    <div className="values-display new-values">
                                      {Object.entries(parsedNew).map(([key, value]) => (
                                        <div key={key} className="value-item">
                                          <strong>{key}:</strong> {formatValue(value)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogModal;
