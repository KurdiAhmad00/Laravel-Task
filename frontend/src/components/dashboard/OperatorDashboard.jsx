import React, { useEffect, useState, useRef } from 'react';
import { incidentAPI, adminAPI, categoriesAPI } from '../../services/api';
import ViewIncidentModal from '../modals/ViewIncidentModal';
import PriorityModal from '../modals/PriorityModal';
import AssignAgentModal from '../modals/AssignAgentModal';
import './OperatorDashboard.css';

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
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: getPriorityColor(priority),
        marginRight: '8px'
      }}
    />
  );
};

const OperatorDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    hasMorePages: false
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    agent: '',
    search: ''
  });
  
  // Modal states
  const [viewModal, setViewModal] = useState({ visible: false, incidentId: null });
  const [assignModal, setAssignModal] = useState({ visible: false, incidentId: null });
  const [priorityModal, setPriorityModal] = useState({ visible: false, incidentId: null });
  const [auditModal, setAuditModal] = useState({ visible: false, incidentId: null });
  const [importModal, setImportModal] = useState({ visible: false });
  
  // Data for dropdowns
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  
  // Prevent duplicate API calls with ref
  const hasLoadedRef = useRef(false);

  const loadIncidents = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentAPI.getAllIncidents(page, 10);
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
      setError(e.response?.data?.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const loadAgents = async () => {
    try {
      const { data } = await adminAPI.getAgents();
      setAgents(data?.agents || []);
    } catch (e) {
      console.error('Failed to load agents:', e);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasLoadedRef.current) {
      return;
    }
    
    hasLoadedRef.current = true;
    
    const loadData = async () => {
      await Promise.all([
        loadIncidents(1),
        loadCategories(),
        loadAgents()
      ]);
    };
    
    loadData();
  }, []); // Empty dependency array - only run once

  const handleView = (incidentId) => {
    setViewModal({ visible: true, incidentId });
  };

  const handleAssign = (incidentId) => {
    setAssignModal({ visible: true, incidentId });
  };

  const handleAssignmentUpdated = () => {
    // Refresh the incidents list after assignment update
    loadIncidents(pagination.currentPage);
  };

  const handlePriority = (incidentId) => {
    setPriorityModal({ visible: true, incidentId });
  };

  const handlePriorityUpdated = () => {
    // Refresh the incidents list after priority update
    loadIncidents(1);
  };

  const handleAudit = (incidentId) => {
    setAuditModal({ visible: true, incidentId });
  };

  const handleImport = () => {
    setImportModal({ visible: true });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesCategory = !filters.category || incident.category?.name === filters.category;
    const matchesStatus = !filters.status || incident.status === filters.status;
    const matchesAgent = !filters.agent || incident.assigned_agent?.name === filters.agent;
    const matchesSearch = !filters.search || 
      incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.description.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesAgent && matchesSearch;
  });

  return (
    <div>
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">All Incidents</h2>
        <button className="import-btn" onClick={handleImport}>
          Import CSV
        </button>
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
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filters.agent}
            onChange={(e) => handleFilterChange('agent', e.target.value)}
            className="filter-select"
          >
            <option value="">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.name}>{agent.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert" style={{ maxWidth: 680 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="dashboard-table table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Assigned Agent</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Citizen</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Created</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => (
                <tr 
                  key={incident.id} 
                  style={{ borderTop: '1px solid #E5E7EB' }}
                >
                  <td style={{ padding: '12px 16px' }}>{incident.title}</td>
                  <td style={{ padding: '12px 16px' }}>{incident.category?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <PriorityDot priority={incident.priority} />
                    <span style={{ textTransform: 'capitalize' }}>{incident.priority || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={incident.status} /></td>
                  <td style={{ padding: '12px 16px' }}>{incident.assigned_agent?.name || 'Unassigned'}</td>
                  <td style={{ padding: '12px 16px' }}>{incident.citizen?.name || incident.citizen?.email || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{incident.created_at ? formatDate(incident.created_at) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleView(incident.id)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="action-btn assign-btn"
                        onClick={() => handleAssign(incident.id)}
                        title="Assign Agent"
                      >
                        👤
                      </button>
                      <button 
                        className="action-btn priority-btn"
                        onClick={() => handlePriority(incident.id)}
                        title="Update Priority"
                      >
                        ⚡
                      </button>
                      <button 
                        className="action-btn audit-btn"
                        onClick={() => handleAudit(incident.id)}
                        title="View Audit Log"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ height: '100%' }}>
                    <div className="dashboard-empty">
                      No incidents found matching your filters.
                    </div>
                  </td>
                </tr>
              )}
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
        userRole="operator"
      />

      <PriorityModal
        open={priorityModal.visible}
        onClose={() => setPriorityModal({ visible: false, incidentId: null })}
        incidentId={priorityModal.incidentId}
        onUpdated={handlePriorityUpdated}
      />

      <AssignAgentModal
        open={assignModal.visible}
        onClose={() => setAssignModal({ visible: false, incidentId: null })}
        incidentId={assignModal.incidentId}
        onUpdated={handleAssignmentUpdated}
      />

      {/* TODO: Add other modals */}
      {/* AuditModal, ImportModal */}
    </div>
  );
};

export default OperatorDashboard;
