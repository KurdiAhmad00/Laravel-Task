import React from 'react';
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

  return (
    <div className={"dashboard-root"}>
      <main className="dashboard-main">
        <div className="dashboard-card">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;


