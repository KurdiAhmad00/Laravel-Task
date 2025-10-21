import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import './SystemStats.css';

const SystemStats = () => {
  const [stats, setStats] = useState({
    users: { total: 0, byRole: {} },
    incidents: { total: 0, byStatus: {} },
    performance: { uptime: '99.9%', responseTime: '120ms' },
    storage: { used: '2.3GB', total: '10GB' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, incidentsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getAllIncidents()
      ]);
      
      const users = usersResponse.data?.users || [];
      const incidents = incidentsResponse.data?.incidents || [];
      
      // Calculate user statistics
      const userStats = {
        total: users.length,
        byRole: users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {})
      };
      
      // Calculate incident statistics
      const incidentStats = {
        total: incidents.length,
        byStatus: incidents.reduce((acc, incident) => {
          acc[incident.status] = (acc[incident.status] || 0) + 1;
          return acc;
        }, {})
      };
      
      setStats({
        users: userStats,
        incidents: incidentStats
      });
    } catch (e) {
      console.error('Error loading system stats:', e);
      console.error('Error response:', e.response?.data);
      setError(`Failed to load system statistics: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="system-stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading system statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-stats-error">
        <p>{error}</p>
        <button onClick={loadSystemStats} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="system-stats">
      <div className="stats-header">
        <h2>System Statistics</h2>
        <button onClick={loadSystemStats} className="refresh-btn">
          <span className="btn-icon">🔄</span>
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        {/* User Statistics */}
        <div className="stats-card">
          <div className="stats-card-header">
            <h3>👥 User Statistics</h3>
            <div className="stats-total">{stats.users.total}</div>
          </div>
          <div className="stats-breakdown">
            {Object.entries(stats.users.byRole).map(([role, count]) => (
              <div key={role} className="breakdown-item">
                <div className="breakdown-label">
                  <span className="role-icon">{getRoleIcon(role)}</span>
                  {role.charAt(0).toUpperCase() + role.slice(1)}s
                </div>
                <div className="breakdown-value">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Statistics */}
        <div className="stats-card">
          <div className="stats-card-header">
            <h3>📋 Incident Statistics</h3>
            <div className="stats-total">{stats.incidents.total}</div>
          </div>
          <div className="stats-breakdown">
            {Object.entries(stats.incidents.byStatus).map(([status, count]) => (
              <div key={status} className="breakdown-item">
                <div className="breakdown-label">
                  <span className="status-icon">{getStatusIcon(status)}</span>
                  {status}
                </div>
                <div className="breakdown-value">{count}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

const getRoleIcon = (role) => {
  switch (role) {
    case 'admin': return '👑';
    case 'operator': return '📞';
    case 'agent': return '🛠️';
    case 'citizen': return '👤';
    default: return '❓';
  }
};

const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case 'new': return '🆕';
    case 'assigned': return '👤';
    case 'in progress': return '🔄';
    case 'resolved': return '✅';
    case 'unresolved': return '❌';
    case 'closed': return '🔒';
    default: return '📋';
  }
};

export default SystemStats;
