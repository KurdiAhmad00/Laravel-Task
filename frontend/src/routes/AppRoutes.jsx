import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import PrivateRoute from './PrivateRoute';
import RoleDashboard from '../components/dashboard';

const AppRoutes = ({ onLogin, onRegistered, initialEmail }) => {
  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={onLogin} onSwitchToRegister={() => {}} initialEmail={initialEmail} />} />
      <Route path="/register" element={<Register onRegistered={onRegistered} onSwitchToLogin={() => {}} />} />
      <Route path="/dashboard/*" element={
        <PrivateRoute>
          <RoleDashboard />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;


