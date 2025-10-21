import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import UserManagement from './admin/UserManagement';
import SystemStats from './admin/SystemStats';
import Configuration from './admin/Configuration';
import AuditLogs from './admin/AuditLogs';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active tab from URL search params or default to 'overview'
  const getActiveTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.search]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'stats', label: 'System Stats', icon: '📈' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'audit', label: 'Audit Logs', icon: '🔍' }
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab.id);
    // Update URL with tab parameter without changing the route
    navigate(`/dashboard?tab=${tab.id}`, { replace: true });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'users':
        return <UserManagement />;
      case 'stats':
        return <SystemStats />;
      case 'config':
        return <Configuration />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-subtitle">System Administration & Management</div>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Load basic system statistics
      const [usersResponse, incidentsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getAllIncidents()
      ]);
      
      setSystemStats({
        totalUsers: usersResponse.data?.users?.length || 0,
        totalIncidents: incidentsResponse.data?.incidents?.length || 0,
        // Add more stats as needed
      });
    } catch (e) {
      setError('Failed to load system statistics');
      console.error('Error loading system stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="loading-spinner"></div>
        <p>Loading system overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-error">
        <p>{error}</p>
        <button onClick={loadSystemStats} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{systemStats?.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{systemStats?.totalIncidents || 0}</div>
            <div className="stat-label">Total Incidents</div>
          </div>
        </div>

      </div>

     
    </div>
  );
};

export default AdminDashboard;
