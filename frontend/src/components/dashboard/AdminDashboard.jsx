import React, { useState, useEffect, useRef } from 'react';
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
  
  // Shared data state
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Ref to prevent duplicate API calls in StrictMode
  const hasLoadedRef = useRef(false);

  // Load data once on component mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadSharedData();
    }
  }, []);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.search]);

  const loadSharedData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, incidentsResponse, categoriesResponse, rateLimitsResponse, auditLogsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getAllIncidents(),
        adminAPI.getCategories(),
        adminAPI.getRateLimits(),
        adminAPI.getAuditLogs(1, {}) // Load first page with no filters
      ]);
      
      setUsers(usersResponse.data?.users || []);
      setIncidents(incidentsResponse.data?.incidents || []);
      setCategories(categoriesResponse.data || []);
      setRateLimits(rateLimitsResponse.data || []);
      setAuditLogs(auditLogsResponse.data?.audit_logs || []);
    } catch (e) {
      setError('Failed to load system data');
      console.error('Error loading shared data:', e);
    } finally {
      setLoading(false);
    }
  };

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
        return <OverviewTab users={users} incidents={incidents} loading={loading} error={error} onRefresh={loadSharedData} />;
      case 'users':
        return <UserManagement users={users} onUsersUpdate={loadSharedData} />;
      case 'stats':
        return <SystemStats users={users} incidents={incidents} onRefresh={loadSharedData} />;
      case 'config':
        return <Configuration categories={categories} rateLimits={rateLimits} onDataUpdate={loadSharedData} />;
      case 'audit':
        return <AuditLogs initialAuditLogs={auditLogs} onDataUpdate={loadSharedData} />;
      default:
        return <OverviewTab users={users} incidents={incidents} loading={loading} error={error} onRefresh={loadSharedData} />;
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
const OverviewTab = ({ users, incidents, loading, error, onRefresh }) => {
  const systemStats = {
    totalUsers: users?.length || 0,
    totalIncidents: incidents?.length || 0,
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
        <button onClick={onRefresh} className="retry-btn">
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
