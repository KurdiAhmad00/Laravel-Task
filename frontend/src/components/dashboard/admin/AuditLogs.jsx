import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import './AuditLogs.css';

const AuditLogs = ({ initialAuditLogs = [], onDataUpdate }) => {
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    actor: ''
  });

  useEffect(() => {
    setAuditLogs(initialAuditLogs);
  }, [initialAuditLogs]);

  useEffect(() => {
    if (currentPage !== 1 || Object.values(filters).some(value => value !== '')) {
      loadAuditLogs();
    }
  }, [currentPage, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminAPI.getAuditLogs(currentPage, filters);
      setAuditLogs(data.audit_logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError('Failed to load audit logs');
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      actor: ''
    });
    setCurrentPage(1);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return '➕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'cascade_deleted': return '💥';
      case 'assigned': return '👤';
      case 'status_changed': return '🔄';
      case 'priority_changed': return '⚡';
      case 'note_added': return '📝';
      case 'attachment_uploaded': return '📎';
      case 'attachment_removed': return '📎❌';
      default: return '📋';
    }
  };

  const getEntityTypeColor = (entityType) => {
    switch (entityType) {
      case 'user': return '#3b82f6';
      case 'incident': return '#ef4444';
      case 'attachment': return '#8b5cf6';
      case 'note': return '#10b981';
      case 'category': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const parseValues = (values) => {
    if (!values) return null;
    try {
      return typeof values === 'string' ? JSON.parse(values) : values;
    } catch {
      return values;
    }
  };

  const renderValueChanges = (oldValues, newValues) => {
    const old = parseValues(oldValues);
    const new_ = parseValues(newValues);
    
    if (!old && !new_) return null;
    
    return (
      <div className="value-changes">
        {old && (
          <div className="old-values">
            <strong>Before:</strong>
            <pre>{JSON.stringify(old, null, 2)}</pre>
          </div>
        )}
        {new_ && (
          <div className="new-values">
            <strong>After:</strong>
            <pre>{JSON.stringify(new_, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="audit-log-viewer">
      <div className="audit-header">
        <div>
          <h2>System Audit Logs</h2>
          <p>Track all system activities and changes</p>
        </div>
        <button 
          className="refresh-btn"
          onClick={onDataUpdate}
          disabled={loading}
          title="Refresh audit logs"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-group">
          <label>Action:</label>
          <select 
            value={filters.action} 
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="cascade_deleted">Cascade Deleted</option>
            <option value="assigned">Assigned</option>
            <option value="status_changed">Status Changed</option>
            <option value="priority_changed">Priority Changed</option>
            <option value="note_added">Note Added</option>
            <option value="attachment_uploaded">Attachment Uploaded</option>
            <option value="attachment_removed">Attachment Removed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Entity Type:</label>
          <select 
            value={filters.entityType} 
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="user">User</option>
            <option value="incident">Incident</option>
            <option value="attachment">Attachment</option>
            <option value="note">Note</option>
            <option value="category">Category</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Actor:</label>
          <input
            type="text"
            placeholder="Search by actor name or email"
            value={filters.actor}
            onChange={(e) => handleFilterChange('actor', e.target.value)}
          />
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="audit-logs-container">
        {loading ? (
          <div className="loading">Loading audit logs...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : auditLogs.length === 0 ? (
          <div className="no-logs">No audit logs found</div>
        ) : (
          <div className="audit-logs-table">
            {auditLogs.map((log) => (
              <div key={log.id} className="audit-log-item">
                <div className="log-header">
                  <div className="log-action">
                    <span className="action-icon">{getActionIcon(log.action)}</span>
                    <span className="action-text">{log.action.replace('_', ' ').toUpperCase()}</span>
                    {log.entity_type && (
                      <span 
                        className="entity-type"
                        style={{ color: getEntityTypeColor(log.entity_type) }}
                      >
                        {log.entity_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="log-timestamp">
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>
                
                <div className="log-details">
                  <div className="log-actor">
                    <strong>Actor:</strong> {log.actor?.name || 'Unknown'} ({log.actor?.email || 'N/A'})
                  </div>
                  
                  {log.incident && (
                    <div className="log-incident">
                      <strong>Incident:</strong> {log.incident.title} (ID: {log.incident.id})
                    </div>
                  )}
                  
                  {log.entity_id && (
                    <div className="log-entity">
                      <strong>Entity ID:</strong> {log.entity_id}
                    </div>
                  )}
                </div>

                {renderValueChanges(log.old_values, log.new_values)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
