import React, { useEffect, useState, useRef } from 'react';
import { incidentAPI } from '../../services/api';
import ViewIncidentModal from '../modals/ViewIncidentModal';
import './AgentDashboard.css';

const formatDate = (iso) => new Date(iso).toLocaleDateString();

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'new': return '#3B82F6';
      case 'in progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#8B5CF6';
    }
  };

  return (
    <span 
      className="status-badge"
      style={{ 
        backgroundColor: getStatusColor(status),
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}
    >
      {status || '—'}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <span 
      className="priority-dot"
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getPriorityColor(priority),
        marginRight: '8px'
      }}
    />
  );
};

const AgentDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    hasMorePages: false
  });
  
  // Modal states
  const [viewModal, setViewModal] = useState({ visible: false, incidentId: null });
  const [statusModal, setStatusModal] = useState({ visible: false, incidentId: null });
  const [notesModal, setNotesModal] = useState({ visible: false, incidentId: null });
  
  // Prevent duplicate API calls with ref
  const hasLoadedRef = useRef(false);

  const loadIncidents = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentAPI.getAssignedIncidents(page, 10);
      const list = Array.isArray(data?.incidents) ? data.incidents : [];
      
      setIncidents(list);
      if (data?.pagination) {
        setPagination({
          currentPage: data.pagination.current_page,
          lastPage: data.pagination.last_page,
          perPage: data.pagination.per_page,
          total: data.pagination.total,
          hasMorePages: data.pagination.has_more_pages
        });
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load assigned incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasLoadedRef.current) {
      return;
    }
    
    hasLoadedRef.current = true;
    loadIncidents(1);
  }, []);

  const handleView = (incidentId) => {
    setViewModal({ visible: true, incidentId });
  };

  const handleStatusUpdate = (incidentId) => {
    setStatusModal({ visible: true, incidentId });
  };

  const handleAddNote = (incidentId) => {
    setNotesModal({ visible: true, incidentId });
  };

  const handleIncidentUpdated = () => {
    // Refresh the incidents list after any update
    loadIncidents(pagination.currentPage);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your assigned incidents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Error Loading Incidents</h3>
        <p>{error}</p>
        <button onClick={() => loadIncidents(1)} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="agent-dashboard">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">My Assigned Incidents</h2>
        <div className="incident-count">
          {pagination.total} incident{pagination.total !== 1 ? 's' : ''} assigned
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="dashboard-empty">
          <div className="empty-icon">📋</div>
          <h3>No Incidents Assigned</h3>
          <p>You don't have any incidents assigned to you yet. Check back later or contact your operator.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>#{incident.id}</td>
                  <td className="title-cell">
                    <div className="incident-title">{incident.title}</div>
                    <div className="incident-description">
                      {incident.description?.substring(0, 100)}
                      {incident.description?.length > 100 ? '...' : ''}
                    </div>
                  </td>
                  <td>{incident.category?.name || '—'}</td>
                  <td>
                    <div className="priority-cell">
                      <PriorityDot priority={incident.priority} />
                      {incident.priority || '—'}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={incident.status} />
                  </td>
                  <td>{incident.citizen?.name || incident.citizen?.email || '—'}</td>
                  <td>{formatDate(incident.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleView(incident.id)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="action-btn status-btn"
                        onClick={() => handleStatusUpdate(incident.id)}
                        title="Update Status"
                      >
                        🔄
                      </button>
                      <button 
                        className="action-btn notes-btn"
                        onClick={() => handleAddNote(incident.id)}
                        title="Add Note"
                      >
                        📝
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.lastPage > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of {pagination.total} incidents
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => loadIncidents(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-page ${page === pagination.currentPage ? 'active' : ''}`}
                  onClick={() => loadIncidents(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              className="pagination-btn"
              onClick={() => loadIncidents(pagination.currentPage + 1)}
              disabled={!pagination.hasMorePages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewIncidentModal
        open={viewModal.visible}
        onClose={() => setViewModal({ visible: false, incidentId: null })}
        incidentId={viewModal.incidentId}
      />

      {/* TODO: Add Status Update Modal and Notes Modal */}
    </div>
  );
};

export default AgentDashboard;
