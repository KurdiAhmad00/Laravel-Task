import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import './Configuration.css';

const Configuration = () => {
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
  
  // Category management state
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setCategoryLoading(true);
    try {
      const { data } = await adminAPI.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    setCategoryLoading(true);
    try {
      await adminAPI.createCategory(newCategory);
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      await loadCategories();
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
      await loadCategories();
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
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setCategoryLoading(false);
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
          <h3>🚦 Rate Limits</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>API Calls per Hour</label>
              <input
                type="number"
                value={config.rateLimits.apiCalls}
                onChange={(e) => handleConfigChange('rateLimits', 'apiCalls', parseInt(e.target.value))}
                min="1"
                max="10000"
              />
            </div>
            <div className="config-item">
              <label>File Uploads per Hour</label>
              <input
                type="number"
                value={config.rateLimits.fileUploads}
                onChange={(e) => handleConfigChange('rateLimits', 'fileUploads', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
            <div className="config-item">
              <label>Login Attempts per Hour</label>
              <input
                type="number"
                value={config.rateLimits.loginAttempts}
                onChange={(e) => handleConfigChange('rateLimits', 'loginAttempts', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="config-section">
          <h3>🔔 Notifications</h3>
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

        {/* Security */}
        <div className="config-section">
          <h3>🔒 Security</h3>
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

        {/* System */}
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
        </div>

        {/* Category Management */}
        <div className="config-section">
          <h3>📂 Incident Categories</h3>
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
