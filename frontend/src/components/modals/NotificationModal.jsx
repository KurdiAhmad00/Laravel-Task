import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen, currentPage]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data || []);
      setHasMore(response.data.next_page_url !== null);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadNotifications();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="notification-modal-overlay">
      <div className="notification-modal">
        <div className="notification-header">
          <h3>Notifications ({unreadCount} unread)</h3>
          <div className="notification-actions">
            <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
              Mark All Read
            </button>
            <button onClick={handleClearAll} className="clear-all-btn">
              Clear All
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>
        
        <div className="notification-list">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">No notifications</div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
                onClick={() => !notification.read_at && handleMarkAsRead(notification.id)}
              >
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-date">
                    {formatDate(notification.created_at)}
                  </span>
                </div>
                {!notification.read_at && <div className="unread-indicator"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;