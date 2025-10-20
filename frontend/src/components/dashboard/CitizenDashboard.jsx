import React, { useEffect, useState } from 'react';
import { incidentAPI } from '../../services/api';
import ReportIncidentModal from '../modals/ReportIncidentModal';

const formatDate = (iso) => new Date(iso).toLocaleString();

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await incidentAPI.getMyIncidents();
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data?.incidents) ? data.incidents : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.results) ? data.results : []))));
        if (mounted) setIncidents(list);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load your incidents');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
          // refresh list after creation
          (async () => {
            try {
              const { data } = await incidentAPI.getMyIncidents();
              const list = Array.isArray(data)
                ? data
                : (Array.isArray(data?.incidents) ? data.incidents : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.results) ? data.results : []))));
              setIncidents(list);
            } catch (_) {}
          })();
        }}
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
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Description</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Lat</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Lng</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(incidents) ? incidents : []).map((i) => (
                <tr key={i.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 16px' }}>{i.title}</td>
                  <td style={{ padding: '12px 16px', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.description || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{i.category?.name || i.category_name || i.category || i.category_id || '-'}</td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <PriorityDot priority={i.priority} />
                    <span style={{ textTransform: 'capitalize' }}>{i.priority || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={i.status} /></td>
                  <td style={{ padding: '12px 16px' }}>{i.location_lat ?? '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{i.location_lng ?? '-'}</td>
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
    </div>
  );
};

export default CitizenDashboard;


