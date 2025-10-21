import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import './AuditLogs.css';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    action: '',
    actor: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadAuditLogs();
  }, [pagination.currentPage, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminAPI.getAuditLogs(pagination.currentPage, pagination.perPage);
      setAuditLogs(data.audit_logs || []);
      setPagination(prev => ({
        ...prev,
        lastPage: data.pagination?.last_page || 1,
        total: data.pagination?.total || 0
      }));
    } catch (e) {
      setError('Failed to load audit logs');
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      actor: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'created': return '📝';
      case 'updated': return '✏️';
      case 'assigned': return '👤';
      case 'unassigned': return '👤❌';
      case 'status_changed': return '🔄';
      case 'priority_changed': return '⚡';
      case 'resolved': return '✅';
      case 'closed': return '🔒';
      case 'note_added': return '📄';
      case 'attachment_added': return '📎';
      case 'attachment_removed': return '🗑️';
      default: return '📋';
    }
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'created': return '#10B981';
      case 'updated': return '#3B82F6';
      case 'assigned': return '#8B5CF6';
      case 'unassigned': return '#EF4444';
      case 'status_changed': return '#F59E0B';
      case 'priority_changed': return '#EF4444';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      case 'note_added': return '#3B82F6';
      case 'attachment_added': return '#8B5CF6';
      case 'attachment_removed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString();
  };

  const formatValue = (value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return value;
      }
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="audit-logs-loading">
        <div className="loading-spinner"></div>
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="audit-logs">
      <div className="audit-logs-header">
        <h2>Audit Logs</h2>
        <div className="audit-actions">
          <button onClick={loadAuditLogs} className="refresh-btn">
            <span className="btn-icon">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-group">
          <label>Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
            <option value="status_changed">Status Changed</option>
            <option value="priority_changed">Priority Changed</option>
            <option value="note_added">Note Added</option>
            <option value="attachment_added">Attachment Added</option>
            <option value="attachment_removed">Attachment Removed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>

        <button onClick={clearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadAuditLogs} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Audit Logs List */}
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

            <div className="log-details">
              <div className="log-incident">
                <strong>Incident ID:</strong> {log.incident_id}
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
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.lastPage > 1 && (
        <div className="audit-pagination">
          <div className="pagination-info">
            Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of {pagination.total} logs
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    className={`pagination-page ${page === pagination.currentPage ? 'active' : ''}`}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              className="pagination-btn"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.lastPage}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {auditLogs.length === 0 && !loading && (
        <div className="no-logs">
          <p>No audit logs found</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
