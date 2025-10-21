import React, { useState, useEffect } from 'react';
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
      </div>
    </div>
  );
};

export default Configuration;
