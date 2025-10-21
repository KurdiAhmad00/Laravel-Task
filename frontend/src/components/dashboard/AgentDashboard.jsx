import React, { useEffect, useState, useRef, useCallback } from 'react';
import { incidentAPI } from '../../services/api';
import ViewIncidentModal from '../modals/ViewIncidentModal';
import StatusUpdateModal from '../modals/StatusUpdateModal';
import NotesModal from '../modals/NotesModal';
import './AgentDashboard.css';

const formatDate = (iso) => new Date(iso).toLocaleDateString();

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'new': return '#3B82F6';
      case 'assigned': return '#8B5CF6';
      case 'in progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'unresolved': return '#EF4444';
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
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    citizen: ''
  });
  
  // All incidents data (unfiltered)
  const [allIncidents, setAllIncidents] = useState([]);
  
  // Prevent duplicate API calls with ref
  const hasLoadedRef = useRef(false);
  
  // Debounce timer ref
  const searchTimeoutRef = useRef(null);

  const loadIncidents = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentAPI.getAssignedIncidents(page, 10);
      const list = Array.isArray(data?.incidents) ? data.incidents : [];
      
      setAllIncidents(list);
      applyFilters(list);
      
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

  const applyFilters = useCallback((dataToFilter = allIncidents) => {
    let filteredList = [...dataToFilter];
    
    // Apply client-side filtering
    if (filters.search) {
      filteredList = filteredList.filter(incident => 
        incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        incident.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    
    if (filters.citizen) {
      filteredList = filteredList.filter(incident => 
        incident.citizen?.name?.toLowerCase().includes(filters.citizen.toLowerCase()) ||
        incident.citizen?.email?.toLowerCase().includes(filters.citizen.toLowerCase())
      );
    }
    
    setIncidents(filteredList);
  }, [filters, allIncidents]);

  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasLoadedRef.current) {
      return;
    }
    
    hasLoadedRef.current = true;
    loadIncidents(1);
  }, []);

  // Apply filters when allIncidents or filters change
  useEffect(() => {
    if (allIncidents.length > 0) {
      applyFilters();
    }
  }, [allIncidents, applyFilters]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // For search input, use debounced filtering
    if (filterType === 'search') {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        applyFilters();
      }, 300); // 300ms delay
    } else {
      // For dropdowns, apply immediately
      setTimeout(() => applyFilters(), 0);
    }
  };

  const clearFilters = () => {
    const clearedFilters = { search: '', citizen: '' };
    setFilters(clearedFilters);
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Apply filters immediately
    setTimeout(() => applyFilters(), 0);
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
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''} assigned
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search incidents..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        
        
        <div className="filter-group">
          <input
            type="text"
            placeholder="Filter by citizen..."
            value={filters.citizen}
            onChange={(e) => handleFilterChange('citizen', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
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
        userRole="agent"
      />

      <StatusUpdateModal
        open={statusModal.visible}
        onClose={() => setStatusModal({ visible: false, incidentId: null })}
        incidentId={statusModal.incidentId}
        onStatusUpdated={handleIncidentUpdated}
      />

      <NotesModal
        open={notesModal.visible}
        onClose={() => setNotesModal({ visible: false, incidentId: null })}
        incidentId={notesModal.incidentId}
        onNoteAdded={handleIncidentUpdated}
      />
    </div>
  );
};

export default AgentDashboard;
