import React, { useState } from 'react';
import { adminAPI } from '../../../services/api';
import './Configuration.css';

const Configuration = ({ categories = [], rateLimits = [], onDataUpdate }) => {
  const [config, setConfig] = useState({
    rateLimits: {
      apiCalls: 1000,
      fileUploads: 10,
      loginAttempts: 5
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      alertThreshold: 10
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 30,
      twoFactorEnabled: false,
      ipWhitelist: []
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      maxFileSize: 10
    }
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Rate limits state
  const [rateLimitLoading, setRateLimitLoading] = useState(false);
  const [editingRateLimit, setEditingRateLimit] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [rateLimitSaved, setRateLimitSaved] = useState(false);
  
  // Category management state
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);



  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    setCategoryLoading(true);
    try {
      await adminAPI.createCategory(newCategory);
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      onDataUpdate(); 
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId, updatedData) => {
    setCategoryLoading(true);
    try {
      await adminAPI.updateCategory(categoryId, updatedData);
      setEditingCategory(null);
      onDataUpdate(); 
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    setCategoryLoading(true);
    try {
      await adminAPI.deleteCategory(categoryId);
      onDataUpdate(); 
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setCategoryLoading(false);
    }
  };


  const handleUpdateRateLimit = async (rateLimitId, updatedData) => {
    setRateLimitLoading(true);
    try {
      await adminAPI.updateRateLimit(rateLimitId, updatedData);
      setEditingRateLimit(null);
      onDataUpdate(); 
    } catch (error) {
      console.error('Error updating rate limit:', error);
    } finally {
      setRateLimitLoading(false);
    }
  };

  const handleResetRateLimit = async (rateLimitId) => {
    if (!window.confirm('Are you sure you want to reset this rate limit?')) return;
    
    setRateLimitLoading(true);
    try {
      await adminAPI.resetRateLimit(rateLimitId);
      onDataUpdate(); 
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    } finally {
      setRateLimitLoading(false);
    }
  };

  const startEditing = (rateLimit) => {
    setEditingRateLimit(rateLimit.id);
    setEditingData({
      max_attempts: rateLimit.max_attempts,
      time_unit: rateLimit.time_unit,
      time_value: rateLimit.time_value,
      description: rateLimit.description,
      is_active: rateLimit.is_active
    });
  };

  const cancelEditing = () => {
    setEditingRateLimit(null);
    setEditingData({});
  };

  const saveEditing = async () => {
    if (!editingRateLimit) return;
    
    setRateLimitLoading(true);
    try {
      await adminAPI.updateRateLimit(editingRateLimit, editingData);
      setEditingRateLimit(null);
      setEditingData({});
      setRateLimitSaved(true);
      setTimeout(() => setRateLimitSaved(false), 3000);
      onDataUpdate(); 
    } catch (error) {
      console.error('Error updating rate limit:', error);
      alert('Failed to update rate limit. Please check console for details.');
    } finally {
      setRateLimitLoading(false);
    }
  };

  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call to save configuration
      console.log('Saving configuration:', config);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="configuration">
      <div className="config-header">
        <h2>System Configuration</h2>
        <div className="config-actions">
          <button 
            className="save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner small"></div>
                Saving...
              </>
            ) : (
              <>
                <span className="btn-icon">💾</span>
                Save Changes
              </>
            )}
          </button>
          {saved && (
            <div className="save-success">
              <span className="success-icon">✅</span>
              Configuration saved!
            </div>
          )}
        </div>
      </div>

      <div className="config-sections">
        {/* Rate Limits */}
        <div className="config-section">
          <div className="config-section-header">
            <h3>Rate Limits</h3>
            <div className="header-actions">
              {rateLimitSaved && (
                <div className="save-success">
                  <span className="success-icon">✅</span>
                  Rate limit updated successfully!
                </div>
              )}
              <button 
                className="refresh-btn"
                onClick={onDataUpdate}
                disabled={rateLimitLoading}
                title="Refresh rate limits"
              >
                {rateLimitLoading ? '⏳' : 'Refresh'} 
              </button>
            </div>
          </div>
          <div className="rate-limits-management">
            {rateLimitLoading ? (
              <div className="loading">Loading rate limits...</div>
            ) : rateLimits.length === 0 ? (
              <div className="no-rate-limits">
                <p>No rate limits found. Please check the console for errors.</p>
                <button 
                  className="retry-btn"
                  onClick={onDataUpdate}
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div className="rate-limits-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Max Attempts</th>
                      <th>Time Unit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateLimits.map((rateLimit) => (
                      <tr key={rateLimit.id}>
                        <td>
                          <div className="rate-limit-name">
                            <strong>{rateLimit.name}</strong>
                            {rateLimit.description && (
                              <small>{rateLimit.description}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          {editingRateLimit === rateLimit.id ? (
                            <input
                              type="number"
                              value={editingData.max_attempts}
                              min="1"
                              max="10000"
                              onChange={(e) => setEditingData(prev => ({
                                ...prev,
                                max_attempts: parseInt(e.target.value) || 1
                              }))}
                              autoFocus
                            />
                          ) : (
                            <span>{rateLimit.max_attempts}</span>
                          )}
                        </td>
                        <td>
                          {editingRateLimit === rateLimit.id ? (
                            <select
                              defaultValue={rateLimit.time_unit}
                              onMouseDown={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const newTimeUnit = e.target.value;
                                let newTimeValue = rateLimit.time_value;
                                
                                // Convert time value based on new unit
                                if (rateLimit.time_unit === 'hour' && newTimeUnit === 'minute') {
                                  newTimeValue = rateLimit.time_value * 60;
                                } else if (rateLimit.time_unit === 'minute' && newTimeUnit === 'hour') {
                                  newTimeValue = Math.round(rateLimit.time_value / 60);
                                } else if (rateLimit.time_unit === 'day' && newTimeUnit === 'hour') {
                                  newTimeValue = rateLimit.time_value / 24;
                                } else if (rateLimit.time_unit === 'hour' && newTimeUnit === 'day') {
                                  newTimeValue = rateLimit.time_value * 24;
                                }
                                
                                handleUpdateRateLimit(rateLimit.id, { 
                                  max_attempts: rateLimit.max_attempts,
                                  time_unit: newTimeUnit,
                                  time_value: newTimeValue,
                                  description: rateLimit.description,
                                  is_active: rateLimit.is_active
                                });
                              }}
                            >
                              <option value="minute">Minute</option>
                              <option value="hour">Hour</option>
                              <option value="day">Day</option>
                            </select>
                          ) : (
                            <span className="time-unit">{rateLimit.time_unit}</span>
                          )}
                        </td>
                        
                        <td>
                          {editingRateLimit === rateLimit.id ? (
                            <select
                              value={editingData.is_active ? 'active' : 'inactive'}
                              onChange={(e) => setEditingData(prev => ({
                                ...prev,
                                is_active: e.target.value === 'active'
                              }))}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          ) : (
                            <span className={`status ${rateLimit.is_active ? 'active' : 'inactive'}`}>
                              {rateLimit.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="rate-limit-actions">
                            {editingRateLimit === rateLimit.id ? (
                              <>
                                <button 
                                  className="save-btn small"
                                  onClick={saveEditing}
                                  disabled={rateLimitLoading}
                                >
                                  {rateLimitLoading ? '⏳' : '💾'} Save
                                </button>
                                <button 
                                  className="cancel-btn small"
                                  onClick={cancelEditing}
                                >
                                  ❌ Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="edit-btn"
                                  onClick={() => startEditing(rateLimit)}
                                  title="Click to edit this rate limit"
                                >
                                  Edit
                                </button>
                                <button 
                                  className="reset-btn"
                                  onClick={() => handleResetRateLimit(rateLimit.id)}
                                  title="Reset this rate limit"
                                >
                                  Reset
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* <div className="config-section">
          <h3>Notifications</h3>
          <div className="config-grid">
            <div className="config-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.notifications.emailEnabled}
                  onChange={(e) => handleConfigChange('notifications', 'emailEnabled', e.target.checked)}
                />
                Email Notifications
              </label>
            </div>
            <div className="config-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.notifications.smsEnabled}
                  onChange={(e) => handleConfigChange('notifications', 'smsEnabled', e.target.checked)}
                />
                SMS Notifications
              </label>
            </div>
            <div className="config-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.notifications.pushEnabled}
                  onChange={(e) => handleConfigChange('notifications', 'pushEnabled', e.target.checked)}
                />
                Push Notifications
              </label>
            </div>
            <div className="config-item">
              <label>Alert Threshold (incidents)</label>
              <input
                type="number"
                value={config.notifications.alertThreshold}
                onChange={(e) => handleConfigChange('notifications', 'alertThreshold', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Security</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>Minimum Password Length</label>
              <input
                type="number"
                value={config.security.passwordMinLength}
                onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
                min="6"
                max="32"
              />
            </div>
            <div className="config-item">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                value={config.security.sessionTimeout}
                onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>
            <div className="config-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.security.twoFactorEnabled}
                  onChange={(e) => handleConfigChange('security', 'twoFactorEnabled', e.target.checked)}
                />
                Two-Factor Authentication
              </label>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>⚙️ System</h3>
          <div className="config-grid">
            <div className="config-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.system.maintenanceMode}
                  onChange={(e) => handleConfigChange('system', 'maintenanceMode', e.target.checked)}
                />
                Maintenance Mode
              </label>
            </div>
            <div className="config-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={config.system.debugMode}
                  onChange={(e) => handleConfigChange('system', 'debugMode', e.target.checked)}
                />
                Debug Mode
              </label>
            </div>
            <div className="config-item">
              <label>Log Level</label>
              <select
                value={config.system.logLevel}
                onChange={(e) => handleConfigChange('system', 'logLevel', e.target.value)}
              >
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="config-item">
              <label>Max File Size (MB)</label>
              <input
                type="number"
                value={config.system.maxFileSize}
                onChange={(e) => handleConfigChange('system', 'maxFileSize', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
          </div>
        </div> */}

        {/* Category Management */}
        <div className="config-section">
          <h3>Incident Categories</h3>
          <div className="category-management">
            <div className="category-header">
              <button 
                className="add-category-btn"
                onClick={() => setShowAddCategory(true)}
                disabled={categoryLoading}
              >
                <span className="btn-icon">➕</span>
                Add Category
              </button>
            </div>

            {/* Add Category Form */}
            {showAddCategory && (
              <div className="add-category-form">
                <h4>Add New Category</h4>
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description"
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="save-btn small"
                    onClick={handleAddCategory}
                    disabled={categoryLoading || !newCategory.name.trim()}
                  >
                    {categoryLoading ? 'Adding...' : 'Add Category'}
                  </button>
                  <button 
                    className="cancel-btn small"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory({ name: '', description: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Categories List */}
            <div className="categories-list">
              {categoryLoading ? (
                <div className="loading">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="no-categories">No categories found</div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="category-item">
                    {editingCategory === category.id ? (
                      <div className="edit-category-form">
                        <input
                          type="text"
                          defaultValue={category.name}
                          ref={(input) => {
                            if (input) input.value = category.name;
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const newName = e.target.value.trim();
                              if (newName && newName !== category.name) {
                                handleUpdateCategory(category.id, { name: newName });
                              } else {
                                setEditingCategory(null);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const newName = e.target.value.trim();
                            if (newName && newName !== category.name) {
                              handleUpdateCategory(category.id, { name: newName });
                            } else {
                              setEditingCategory(null);
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="category-content">
                        <div className="category-info">
                          <h4>{category.name}</h4>
                          {category.description && (
                            <p className="category-description">{category.description}</p>
                          )}
                        </div>
                        <div className="category-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => setEditingCategory(category.id)}
                            title="Edit category"
                          >
                            ✏️
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete category"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
