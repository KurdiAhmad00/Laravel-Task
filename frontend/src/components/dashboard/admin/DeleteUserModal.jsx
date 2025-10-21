import React, { useState } from 'react';
import './DeleteUserModal.css';

const DeleteUserModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onConfirmDelete, 
  onDeleteWithCascade,
  loading = false 
}) => {
  const [deleteMode, setDeleteMode] = useState('safe');

  const hasConstraints = (constraints) => {
    return constraints && (
      constraints.incidents > 0 || 
      constraints.assignedIncidents > 0 || 
      constraints.auditLogs > 0 ||
      constraints.attachments > 0 ||
      constraints.incidentAuditLogs > 0 ||
      constraints.incidentNotes > 0
    );
  };

  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    if (deleteMode === 'cascade') {
      onDeleteWithCascade(user.id);
    } else {
      onConfirmDelete(user.id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="delete-user-modal">
        <div className="modal-header">
          <h3>Delete User: {user.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {hasConstraints(user.constraints) ? (
            <div className="warning-section">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <p><strong>This user cannot be deleted safely</strong></p>
                <p>This user has associated data that prevents deletion:</p>
              </div>
            </div>
          ) : (
            <div className="confirmation-section">
              <div className="confirmation-icon">❓</div>
              <div className="confirmation-text">
                <p><strong>Confirm User Deletion</strong></p>
                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              </div>
            </div>
          )}

          {hasConstraints(user.constraints) && (
            <>
              <div className="constraints-list">
                {user.constraints?.incidents > 0 && (
                  <div className="constraint-item">
                    <span className="constraint-icon">📋</span>
                    <span className="constraint-text">
                      {user.constraints.incidents} incident(s) reported by this user
                    </span>
                  </div>
                )}
                {user.constraints?.assignedIncidents > 0 && (
                  <div className="constraint-item">
                    <span className="constraint-icon">👤</span>
                    <span className="constraint-text">
                      {user.constraints.assignedIncidents} incident(s) assigned to this user
                    </span>
                  </div>
                )}
                {user.constraints?.auditLogs > 0 && (
                  <div className="constraint-item">
                    <span className="constraint-icon">📝</span>
                    <span className="constraint-text">
                      {user.constraints.auditLogs} audit log(s) created by this user
                    </span>
                  </div>
                )}
                {user.constraints?.attachments > 0 && (
                  <div className="constraint-item">
                    <span className="constraint-icon">📎</span>
                    <span className="constraint-text">
                      {user.constraints.attachments} attachment(s) uploaded by this user
                    </span>
                  </div>
                )}
                {user.constraints?.incidentAuditLogs > 0 && (
                  <div className="constraint-item">
                    <span className="constraint-icon">📋</span>
                    <span className="constraint-text">
                      {user.constraints.incidentAuditLogs} audit log(s) for incidents created by this user
                    </span>
                  </div>
                )}
                {user.constraints?.incidentNotes > 0 && (
                  <div className="constraint-item">
                    <span className="constraint-icon">📝</span>
                    <span className="constraint-text">
                      {user.constraints.incidentNotes} note(s) for incidents created by this user
                    </span>
                  </div>
                )}
              </div>

              <div className="deletion-options">
                <h4>Choose deletion method:</h4>
                
                <div className="option-group">
                  <label className="option-label">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="safe"
                      checked={deleteMode === 'safe'}
                      onChange={(e) => setDeleteMode(e.target.value)}
                    />
                    <span className="option-content">
                      <strong>Safe Delete (Recommended)</strong>
                      <small>Cancel deletion and keep all data intact</small>
                    </span>
                  </label>
                </div>

                <div className="option-group">
                  <label className="option-label">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="cascade"
                      checked={deleteMode === 'cascade'}
                      onChange={(e) => setDeleteMode(e.target.value)}
                    />
                    <span className="option-content">
                      <strong>Cascade Delete (Dangerous)</strong>
                      <small>Delete user and all associated data permanently</small>
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {deleteMode === 'cascade' && (
            <div className="cascade-warning">
              <div className="cascade-icon">🚨</div>
              <div className="cascade-text">
                <p><strong>Warning: This action cannot be undone!</strong></p>
                <p>This will permanently delete:</p>
                <ul>
                  {user.constraints?.incidents > 0 && (
                    <li>All incidents reported by this user</li>
                  )}
                  {user.constraints?.assignedIncidents > 0 && (
                    <li>All incidents assigned to this user (will be unassigned)</li>
                  )}
                  {user.constraints?.auditLogs > 0 && (
                    <li>All audit logs created by this user</li>
                  )}
                  {user.constraints?.attachments > 0 && (
                    <li>All attachments uploaded by this user</li>
                  )}
                  {user.constraints?.incidentAuditLogs > 0 && (
                    <li>All audit logs for incidents created by this user</li>
                  )}
                  {user.constraints?.incidentNotes > 0 && (
                    <li>All notes for incidents created by this user</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          
          {hasConstraints(user.constraints) ? (
            <button 
              className={`btn ${deleteMode === 'cascade' ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : (deleteMode === 'cascade' ? 'Delete Everything' : 'Cancel Deletion')}
            </button>
          ) : (
            <button 
              className="btn btn-danger"
              onClick={() => onConfirmDelete(user.id)}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
