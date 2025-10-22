import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import NotificationModal from './modals/NotificationModal';
import './NotificationButton.css';

const NotificationButton = ({ role, theme, refreshTrigger }) => {
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadNotifications();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // Load unread notifications for citizen, agent, operator
  useEffect(() => {
    // Only load for citizen, agent, operator (not admin)
    if (['citizen', 'agent', 'operator'].includes(role)) {
      loadUnreadCount();
    }
  }, [role]);

  // Refresh when refreshTrigger changes (when actions happen)
  useEffect(() => {
    if (['citizen', 'agent', 'operator'].includes(role)) {
      loadUnreadCount();
    }
  }, [refreshTrigger, role]);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    if (!['citizen', 'agent', 'operator'].includes(role)) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [role]);

  // Don't render for admin
  if (role === 'admin') return null;

  return (
    <>
      <button 
        className="notification-btn"
        onClick={() => setNotificationModalOpen(true)}
        title="Notifications"
        style={{ color: theme.accent }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge" style={{ backgroundColor: theme.accent }}>
            {unreadCount}
          </span>
        )}
      </button>

      <NotificationModal 
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />
    </>
  );
};

export default NotificationButton;
