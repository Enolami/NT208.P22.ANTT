import React, { useState, useEffect } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Badge,
    Button,
    Paper,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { notificationsAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

const NotificationPanel = ({ isMobile }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const response = await notificationsAPI.getNotifications();
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => n.status === 'unread').length);
        } catch (error) {
            console.error('Error fetching notifications:', error.response || error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationsAPI.markAsRead(notificationId);
            setNotifications(notifications.map(notification =>
                notification.notification_id === notificationId
                    ? { ...notification, status: 'read' }
                    : notification
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error.response || error);
        }
    };

    const handleDismiss = async (notificationId) => {
        try {
            const response = await notificationsAPI.dismiss(notificationId);
            if (response.data.status === 'success') {
                setNotifications(notifications.filter(notification =>
                    notification.notification_id !== notificationId
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error dismissing notification:', error.response || error);
            // Optionally show an error message to the user
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(notifications.map(notification => ({
                ...notification,
                status: 'read'
            })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error.response || error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error.main';
            case 'medium':
                return 'warning.main';
            case 'low':
                return 'info.main';
            default:
                return 'text.primary';
        }
    };

    const formatDate = (dateString) => {
        try {
            return dayjs(dateString).fromNow();
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    };

    return (
        <Box sx={{ position: 'relative', fontFamily: "'Inter', Arial, sans-serif", fontSize: '1.08rem', color: '#23272f', fontWeight: 700 }}>
            <Tooltip title="Thông báo">
                <IconButton
                    color="inherit"
                    onClick={() => setIsOpen(!isOpen)}
                    sx={{
                        position: 'relative',
                        background: isOpen ? '#3fc8e0' : 'transparent',
                        transition: 'background 0.2s',
                        borderRadius: 2,
                        boxShadow: isOpen ? '0 4px 16px 0 #23272f33' : 'none',
                        '&:hover': { background: '#3fc8e0' }
                    }}
                >
                    <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '1rem', minWidth: 22, height: 22, fontWeight: 800 } }}>
                        <NotificationsIcon sx={{ color: isOpen ? '#fff' : '#3fc8e0', fontSize: '2.1rem', fontWeight: 800 }} />
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Mobile: Dialog */}
            {isMobile && (
                <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="xs">
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Notifications
                        <IconButton onClick={() => setIsOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}>
                        <Box sx={{ p: 2 }}>
                            {unreadCount > 0 && (
                                <Button
                                    startIcon={<DoneAllIcon />}
                                    onClick={handleMarkAllAsRead}
                                    size="small"
                                    sx={{ mb: 1 }}
                                    fullWidth
                                >
                                    Đánh dấu tất cả là đã đọc
                                </Button>
                            )}
                            <List>
                                {notifications.length === 0 ? (
                                    <ListItem>
                                        <ListItemText primary="Không có thông báo" />
                                    </ListItem>
                                ) : (
                                    notifications.map((notification) => (
                                        <ListItem
                                            key={notification.notification_id}
                                            sx={{
                                                bgcolor: notification.status === 'unread' ? 'action.hover' : 'inherit',
                                                borderLeft: 4,
                                                borderColor: getPriorityColor(notification.priority),
                                            }}
                                        >
                                            <ListItemText
                                                primary={notification.title}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            {notification.message}
                                                        </Typography>
                                                        <br />
                                                        <Typography component="span" variant="caption" color="text.secondary">
                                                            {formatDate(notification.created_at)}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            <Box>
                                                {notification.status === 'unread' && (
                                                    <Tooltip title="Mark as read">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleMarkAsRead(notification.notification_id)}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Dismiss">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDismiss(notification.notification_id)}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsOpen(false)} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Desktop: Dropdown Panel */}
            {!isMobile && isOpen && (
                <Paper
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        width: 370,
                        maxHeight: 520,
                        overflow: 'auto',
                        zIndex: 1000,
                        mt: 1,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px 0 #23272f33',
                        p: 0,
                        background: '#fafdff'
                    }}
                >
                    <Box
                        sx={{
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(90deg, #3fc8e0 0%, #b2ebf2 100%)',
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12,
                            color: '#23272f',
                            fontWeight: 800,
                            boxShadow: '0 2px 8px 0 #23272f22'
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <NotificationsIcon sx={{ color: '#23272f', fontSize: '1.5rem', fontWeight: 800 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.5, color: '#23272f' }}>
                                <strong>Thông báo mới</strong>
                            </Typography>
                        </Box>
                        {unreadCount > 0 && (
                            <Button
                                startIcon={<DoneAllIcon />}
                                onClick={handleMarkAllAsRead}
                                size="small"
                                sx={{
                                    background: '#fff',
                                    color: '#3fc8e0',
                                    borderRadius: 2,
                                    fontWeight: 800,
                                    px: 2,
                                    py: 0.5,
                                    boxShadow: 'none',
                                    fontSize: '1.05rem',
                                    '&:hover': { background: '#e0f7fa', color: '#3fc8e0' }
                                }}
                            >
                                Đọc tất cả
                            </Button>
                        )}
                    </Box>
                    <Divider />
                    <List sx={{ p: 0 }}>
                        {notifications.length === 0 ? (
                            <ListItem>
                                <ListItemText primary={<span style={{ fontWeight: 700, color: '#23272f' }}>Không có thông báo nào</span>} />
                            </ListItem>
                        ) : (
                            notifications.map((notification) => (
                                <ListItem
                                    key={notification.notification_id}
                                    sx={{
                                        bgcolor: notification.status === 'unread'
                                            ? '#e0f7fa'
                                            : '#fff',
                                        borderLeft: 4,
                                        borderColor: getPriorityColor(notification.priority),
                                        alignItems: 'flex-start',
                                        py: 2.2,
                                        px: 2,
                                        mb: 0.5,
                                        borderRadius: 2,
                                        boxShadow: notification.status === 'unread' ? '0 2px 8px 0 #23272f22' : 'none',
                                        transition: 'background 0.2s, box-shadow 0.2s'
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography sx={{ fontWeight: notification.status === 'unread' ? 800 : 700, color: '#23272f', fontSize: '1.08rem' }}>
                                                {notification.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" sx={{ fontSize: '1.05rem', color: '#23272f', fontWeight: 700 }}>
                                                    {notification.message}
                                                </Typography>
                                                <br />
                                                <Typography component="span" variant="caption" sx={{ fontSize: '1rem', color: '#23272f', fontWeight: 700 }}>
                                                    {formatDate(notification.created_at)}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    <Box>
                                        {notification.status === 'unread' && (
                                            <Tooltip title="Đánh dấu đã đọc">
                                                <IconButton
                                                    size="small"

                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    sx={{ color: '#3fc8e0', background: '#e0f7fa', fontWeight: 800, '&:hover': { background: '#b2ebf2' } }}

                                                >
                                                    <CheckIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Ẩn thông báo">
                                            <IconButton
                                                size="small"
                                       onClick={() => handleDismiss(notification.id)}
                                                sx={{ color: '#bdbdbd', background: '#f8f9fb', fontWeight: 800, '&:hover': { background: '#e0e0e0' } }}
     >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default NotificationPanel;
