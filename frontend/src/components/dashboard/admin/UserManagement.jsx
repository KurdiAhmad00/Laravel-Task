import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
    // Get current user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(data.users || []);
    } catch (e) {
      setError('Failed to load users');
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    // Check if trying to change own role
    if (currentUser && currentUser.id === userId) {
      setError('You cannot change your own role');
      return;
    }
    
    // Check if trying to assign admin role
    if (newRole === 'admin') {
      setError('You cannot assign admin role to other users');
      return;
    }
    
    try {
      await adminAPI.updateUserRole(userId, newRole);
      await loadUsers(); // Reload users
      setError(''); // Clear any previous errors
    } catch (e) {
      const errorMessage = e.response?.data?.message || 'Failed to update user role';
      setError(errorMessage);
      console.error('Error updating role:', e);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#EF4444';
      case 'operator': return '#8B5CF6';
      case 'agent': return '#F59E0B';
      case 'citizen': return '#3B82F6';
      default: return '#6B7280';
    }
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
  
  const handleDeleteUser = async (userId) => {
    try{
      await adminAPI.deleteUser(userId);
      await loadUsers();
    } catch (e) {
      const errorMessage = e.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', e);
    }
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button 
          className="create-user-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="btn-icon">➕</span>
          Create User
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadUsers} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr 
                key={user.id}
                className={currentUser && currentUser.id === user.id ? 'current-user-row' : ''}
              >
                <td className="user-info">
                  <div className="user-avatar">
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name || 'No Name'}</div>
                    <div className="user-id">ID: {user.id}</div>
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td>
                  <select
                    className="role-select"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{ 
                      borderColor: getRoleColor(user.role),
                      opacity: currentUser && currentUser.id === user.id ? 0.6 : 1,
                      cursor: currentUser && currentUser.id === user.id ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentUser && currentUser.id === user.id}
                    title={currentUser && currentUser.id === user.id ? 'You cannot change your own role' : ''}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="agent">Agent</option>
                    <option value="operator">Operator</option>
                    <option value="admin" disabled>Admin (Restricted)</option>
                  </select>
                </td>
                <td className="user-created">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td>
                  <span className={`status-badge ${user.email_verified_at ? 'active' : 'inactive'}`}>
                    {user.email_verified_at ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="user-actions">
                  <button 
                    className="action-btn delete"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        handleDeleteUser(user.id);
                      }
                    }}
                    title="Delete User"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="no-users">
          <p>No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
