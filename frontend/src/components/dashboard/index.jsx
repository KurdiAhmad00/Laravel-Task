import React from 'react';
import DashboardLayout from './DashboardLayout';
import CitizenDashboard from './CitizenDashboard';
const OperatorDashboard = () => <div>Operator overview</div>;
const AgentDashboard = () => <div>Agent overview</div>;
const AdminDashboard = () => <div>Admin overview</div>;

const RoleDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user.role || 'citizen').toLowerCase();

  let content = <CitizenDashboard />;
  if (role === 'operator' || role === 'admin') content = <OperatorDashboard />;
  if (role === 'agent') content = <AgentDashboard />;
  if (role === 'admin') content = <AdminDashboard />;

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default RoleDashboard;


