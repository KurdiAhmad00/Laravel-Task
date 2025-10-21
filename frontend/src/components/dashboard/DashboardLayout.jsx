import React from 'react';
import { authAPI } from '../../services/api';
import './DashboardLayout.css';

const roleToTheme = {
  citizen: { bg: '#ECFDF5', accent: '#10B981', name: 'Citizen' },
  operator: { bg: '#EFF6FF', accent: '#3B82F6', name: 'Operator' },
  agent: { bg: '#FEF3C7', accent: '#F59E0B', name: 'Agent' },
  admin: { bg: '#FEF2F2', accent: '#EF4444', name: 'Admin' },
};

const DashboardLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user.role || 'citizen').toLowerCase();
  const theme = roleToTheme[role] || roleToTheme.citizen;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <div className={"dashboard-root"}>
      <main className="dashboard-main">
        <div 
          className="dashboard-card"
          style={{ borderColor: theme.accent }}
        >
          {/* Welcome Message */}
          <div className="welcome-container">
            <h1 className="welcome-message">
              Welcome, <span 
                className="username" 
                style={{ color: theme.accent }}
              >
                {user.name || user.email || 'User'}
              </span>
            </h1>
          </div>
          
          {/* Logout Button */}
          <div className="logout-container">
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;


