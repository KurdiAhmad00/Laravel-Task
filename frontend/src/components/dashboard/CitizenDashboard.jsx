import React, { useEffect, useState } from 'react';
import { incidentAPI } from '../../services/api';
import ReportIncidentModal from '../modals/ReportIncidentModal';
import ViewIncidentModal from '../modals/ViewIncidentModal';
import EditIncidentModal from '../modals/EditIncidentModal';

const formatDate = (iso) => new Date(iso).toLocaleDateString();

const StatusBadge = ({ status }) => (
  <span className="status-badge status-badge--indigo">
    {status}
  </span>
);

const PriorityDot = ({ priority }) => {
  const cls = {
    high: 'priority-dot priority-high',
    medium: 'priority-dot priority-medium',
    low: 'priority-dot priority-low',
  }[(priority || '').toLowerCase()] || 'priority-dot';
  return <span className={cls} />;
};

const CitizenDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, incidentId: null });
  const [confirmDelete, setConfirmDelete] = useState({ visible: false, incidentId: null, title: '' });
  const [confirmDeleteAll, setConfirmDeleteAll] = useState({ visible: false });
  const [editModal, setEditModal] = useState({ visible: false, incidentId: null });
  const [viewModal, setViewModal] = useState({ visible: false, incidentId: null });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    hasMorePages: false
  });
  
  const handleDeleteClick = (incidentId) => {
    const incident = incidents.find(i => i.id === incidentId);
    setConfirmDelete({
      visible: true,
      incidentId: incidentId,
      title: incident?.title || 'this incident'
    });
    setContextMenu({ visible: false, x: 0, y: 0, incidentId: null });
  }

  const handleDeleteConfirm = async () => {
    const { incidentId } = confirmDelete;
    setDeletingId(incidentId);
    setError('');
    try{
      await incidentAPI.deleteIncident(incidentId);
      // Refresh current page after deletion
      loadIncidents(pagination.currentPage);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete incident');
    } finally {
      setDeletingId(null);
    }
    setConfirmDelete({ visible: false, incidentId: null, title: '' });
  }

  const handleDeleteCancel = () => {
    setConfirmDelete({ visible: false, incidentId: null, title: '' });
  }

  const handleDeleteAllClick = () => {
    setConfirmDeleteAll({ visible: true });
  }

  const handleDeleteAllConfirm = async () => {
    setError('');
    try {
      await incidentAPI.deleteAllIncidents();
      // Refresh the list - go to page 1
      loadIncidents(1);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete all incidents');
    }
    setConfirmDeleteAll({ visible: false });
  }

  const handleDeleteAllCancel = () => {
    setConfirmDeleteAll({ visible: false });
  }
  const handleEdit = (incidentId) => {
    if (incidentId && typeof incidentId === 'number') {
        setEditModal({ visible: true, incidentId: incidentId });
    } else {
        return;
    }
    
    setContextMenu({ visible: false, x: 0, y: 0, incidentId: null });
}

  const handleView = (incidentId) => {
    setViewModal({ visible: true, incidentId: incidentId });
    setContextMenu({ visible: false, x: 0, y: 0, incidentId: null });
  }

  const handleContextMenu = (e, incidentId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      incidentId: incidentId
    });
  }

  const handleClickOutside = () => {
    setContextMenu({ visible: false, x: 0, y: 0, incidentId: null });
  }

  const loadIncidents = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentAPI.getMyIncidents(page, 10);
      const list = Array.isArray(data?.incidents) ? data.incidents : [];
      
      setIncidents(list);
      if (data?.pagination) {
        // Convert snake_case to camelCase
        setPagination({
          currentPage: data.pagination.current_page,
          lastPage: data.pagination.last_page,
          perPage: data.pagination.per_page,
          total: data.pagination.total,
          hasMorePages: data.pagination.has_more_pages
        });
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load your incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents(1);
  }, []);

  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);


  return (
    <div>
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">My Incidents</h2>
        <button className="Report-Incident-btn" onClick={() => setIsModalOpen(true)}>
          Report New Incident
        </button>
      </div>

      {loading && (
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}

      <ReportIncidentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          loadIncidents(1);
        }}
      />
      <EditIncidentModal
          open={editModal.visible}
          onClose={() => setEditModal({ visible: false, incidentId: null })}
          incidentId={editModal.incidentId}
          onUpdated={() => {
            // refresh current page after update
            loadIncidents(pagination.currentPage);
          }}
        />

      <ViewIncidentModal
        open={viewModal.visible}
        onClose={() => setViewModal({ visible: false, incidentId: null })}
        incidentId={viewModal.incidentId}
        userRole="citizen"
      />

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
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(incidents) ? incidents : []).map((i) => (
                <tr 
                  key={i.id} 
                  style={{ borderTop: '1px solid #E5E7EB', cursor: 'context-menu' }}
                  onContextMenu={(e) => handleContextMenu(e, i.id)}
                  title="Right-click for options"
                >
                  <td style={{ padding: '12px 16px' }}>{i.title}</td>
                  <td style={{ padding: '12px 16px' }}>{i.category?.name || i.category_name || i.category || i.category_id || '-'}</td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <PriorityDot priority={i.priority} />
                    <span style={{ textTransform: 'capitalize' }}>{i.priority || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={i.status} /></td>
                  <td style={{ padding: '12px 16px' }}>{i.created_at ? formatDate(i.created_at) : '-'}</td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ height: '100%' }}>
                    <div className="dashboard-empty">
                      No incidents yet. Click "Report New Incident" to create one.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Delete All Button */}
      {!loading && !error && incidents.length > 0 && (
        <div className="delete-all-container">
          <button 
            className="delete-all-btn"
            onClick={handleDeleteAllClick}
          >
            Delete All Incidents
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '120px',
          }}
        >
          <button
            onClick={() => handleView(contextMenu.incidentId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
            }}
            onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            👁️ View
          </button>
          <button
            onClick={() => handleEdit(contextMenu.incidentId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
            }}
            onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => handleDeleteClick(contextMenu.incidentId)}
            disabled={deletingId === contextMenu.incidentId}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: deletingId === contextMenu.incidentId ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: deletingId === contextMenu.incidentId ? '#9CA3AF' : '#DC2626',
            }}
            onMouseEnter={(e) => {
              if (deletingId !== contextMenu.incidentId) {
                e.target.style.background = '#FEF2F2';
              }
            }}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {deletingId === contextMenu.incidentId ? '⏳ Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.visible && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <h3 className="delete-modal-title">
              Confirm Delete
            </h3>
            <p className="delete-modal-message">
              Are you sure you want to delete <strong>"{confirmDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button
                onClick={handleDeleteCancel}
                className="delete-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === confirmDelete.incidentId}
                className="delete-modal-delete-btn"
              >
                {deletingId === confirmDelete.incidentId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {confirmDeleteAll.visible && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-header">
              <h3>Delete All Incidents</h3>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to delete <strong>ALL</strong> your incidents? This action cannot be undone.</p>
              <p>This will also delete all attachments associated with these incidents.</p>
            </div>
            <div className="delete-modal-actions">
              <button
                onClick={handleDeleteAllCancel}
                className="delete-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllConfirm}
                className="delete-modal-delete-btn"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;


