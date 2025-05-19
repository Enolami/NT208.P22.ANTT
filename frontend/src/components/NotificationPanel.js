import React from 'react';

function NotificationPanel({ notifications, setNotifications }) {
  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Thông báo</h3>
        <span className="notification-count">{unreadCount} mới</span>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">Không có thông báo nào</div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-time">{notification.time}</div>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="button button-secondary"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="delete-button"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPanel; 