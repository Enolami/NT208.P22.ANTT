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
    DialogActions,
    Avatar,
    Stack,
    Fade,
    Slide,
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
import { useTheme } from '@mui/material/styles';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

const NotificationPanel = ({ isMobile }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

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

    // Modern color for unread notification border
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return '#ff5252';
            case 'medium':
                return '#ffb300';
            case 'low':
                return '#3fc8e0';
            default:
                return isDark ? '#23263a' : '#e0e0e0';
        }
    };

    // Modern icon for notification
    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high':
                return <i className="fa fa-exclamation-circle" style={{ color: '#ff5252', fontSize: 18 }} />;
            case 'medium':
                return <i className="fa fa-bolt" style={{ color: '#ffb300', fontSize: 18 }} />;
            case 'low':
                return <i className="fa fa-info-circle" style={{ color: '#3fc8e0', fontSize: 18 }} />;
            default:
                return <i className="fa fa-bell" style={{ color: '#b0b0b0', fontSize: 18 }} />;
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
        <Box sx={{
            position: 'relative',
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: '1.08rem',
            color: isDark ? '#e3e6f3' : '#23272f',
            fontWeight: 700
        }}>
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
                        border: isOpen ? '2px solid #3fc8e0' : '2px solid transparent'
                    }}
                >
                    <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '1rem', minWidth: 22, height: 22, fontWeight: 800 } }}>
                        <NotificationsIcon sx={{ color: isOpen ? '#fff' : '#3fc8e0', fontSize: '2.1rem', fontWeight: 800 }} />
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Mobile: Dialog */}
            {isMobile && (
                <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="xs" TransitionComponent={Slide} TransitionProps={{ direction: "down" }}>
                    <DialogTitle sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        background: 'linear-gradient(90deg, #3fc8e0 0%, #b2ebf2 100%)',
                        color: '#23272f',
                        fontWeight: 800,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        pb: 1
                    }}>
                        <NotificationsIcon sx={{ color: '#23272f', fontSize: 22, mr: 1 }} />
                        Thông báo mới
                        <Box flex={1} />
                        <IconButton onClick={() => setIsOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 0, background: isDark ? '#23263a' : '#fafdff' }}>
                        <Box sx={{ p: 2 }}>
                            {unreadCount > 0 && (
                                <Button
                                    startIcon={<DoneAllIcon />}
                                    onClick={handleMarkAllAsRead}
                                    size="small"
                                    sx={{
                                        mb: 1,
                                        background: '#fff',
                                        color: '#3fc8e0',
                                        borderRadius: 2,
                                        fontWeight: 700,
                                        px: 2,
                                        py: 0.5,
                                        boxShadow: 'none',
                                        fontSize: '1.05rem',
                                        '&:hover': { background: '#e0f7fa', color: '#3fc8e0' }
                                    }}
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
                                                bgcolor: notification.status === 'unread' ? (isDark ? '#23263a' : '#e0f7fa') : (isDark ? '#181c2a' : '#fff'),
                                                borderLeft: 4,
                                                borderColor: getPriorityColor(notification.priority),
                                                alignItems: 'flex-start',
                                                mb: 1,
                                                borderRadius: 2,
                                                boxShadow: notification.status === 'unread'
                                                    ? (isDark ? '0 2px 8px 0 #23263a' : '0 2px 8px 0 #23272f22')
                                                    : 'none',
                                                transition: 'background 0.2s, box-shadow 0.2s'
                                            }}
                                        >
                                            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ width: '100%' }}>
                                                <Avatar sx={{
                                                    bgcolor: '#fff',
                                                    color: getPriorityColor(notification.priority),
                                                    width: 38,
                                                    height: 38,
                                                    boxShadow: '0 2px 8px #3fc8e022',
                                                    border: `2px solid ${getPriorityColor(notification.priority)}`
                                                }}>
                                                    {getPriorityIcon(notification.priority)}
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Typography sx={{ fontWeight: 700, color: '#23272f', fontSize: '1.08rem', mb: 0.5 }}>
                                                        {notification.title}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" sx={{ fontSize: '1.05rem', color: '#23272f', fontWeight: 500 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <br />
                                                    <Typography component="span" variant="caption" sx={{ fontSize: '1rem', color: '#888', fontWeight: 500 }}>
                                                        {formatDate(notification.created_at)}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    {notification.status === 'unread' && (
                                                        <Tooltip title="Đánh dấu đã đọc">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleMarkAsRead(notification.notification_id)}
                                                                sx={{ color: '#3fc8e0', background: '#e0f7fa', fontWeight: 800, '&:hover': { background: '#b2ebf2' } }}
                                                            >
                                                                <CheckIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Ẩn thông báo">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDismiss(notification.notification_id)}
                                                            sx={{ color: '#bdbdbd', background: '#f8f9fb', fontWeight: 800, '&:hover': { background: '#e0e0e0' } }}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Stack>
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsOpen(false)} color="primary">
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Desktop: Dropdown Panel */}
            {!isMobile && isOpen && (
                <Fade in={isOpen}>
                    <Paper
                        sx={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            width: 390,
                            maxHeight: 540,
                            overflow: 'auto',
                            zIndex: 1000,
                            mt: 1,
                            borderRadius: 4,
                            boxShadow: isDark ? '0 8px 32px 0 #23263a' : '0 8px 32px 0 #23272f33',
                            p: 0,
                            background: isDark ? '#23263a' : '#fafdff',
                            border: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #e0f7fa'
                        }}
                    >
                        <Box
                            sx={{
                                p: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'linear-gradient(90deg, #3fc8e0 0%, #b2ebf2 100%)',
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                                color: '#23272f',
                                fontWeight: 800,
                                boxShadow: isDark ? '0 2px 8px 0 #23263a' : '0 2px 8px 0 #23272f22'
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
                        <Divider sx={{ borderColor: isDark ? '#23263a' : undefined }} />
                        <List sx={{ p: 0 }}>
                            {notifications.length === 0 ? (
                                <ListItem>
                                    <ListItemText primary={
                                        <span style={{ fontWeight: 700, color: isDark ? '#e3e6f3' : '#23272f' }}>
                                            No notifications
                                        </span>
                                    } />
                                </ListItem>
                            ) : (
                                notifications.map((notification) => (
                                    <ListItem
                                        key={notification.notification_id}
                                        sx={{
                                            bgcolor: notification.status === 'unread'
                                                ? (isDark ? '#23263a' : '#e0f7fa')
                                                : (isDark ? '#181c2a' : '#fff'),
                                            borderLeft: 4,
                                            borderColor: getPriorityColor(notification.priority),
                                            alignItems: 'flex-start',
                                            py: 2.2,
                                            px: 2,
                                            mb: 1,
                                            borderRadius: 3,
                                            boxShadow: notification.status === 'unread'
                                                ? (isDark ? '0 2px 8px 0 #23263a' : '0 2px 8px 0 #23272f22')
                                                : 'none',
                                            transition: 'background 0.2s, box-shadow 0.2s'
                                        }}
                                    >
                                        <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ width: '100%' }}>
                                            <Avatar sx={{
                                                bgcolor: '#fff',
                                                color: getPriorityColor(notification.priority),
                                                width: 38,
                                                height: 38,
                                                boxShadow: '0 2px 8px #3fc8e022',
                                                border: `2px solid ${getPriorityColor(notification.priority)}`
                                            }}>
                                                {getPriorityIcon(notification.priority)}
                                            </Avatar>
                                            <Box flex={1}>
                                                <Typography sx={{ fontWeight: 700, color: '#23272f', fontSize: '1.08rem', mb: 0.5 }}>
                                                    {notification.title}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ fontSize: '1.05rem', color: '#23272f', fontWeight: 500 }}>
                                                    {notification.message}
                                                </Typography>
                                                <br />
                                                <Typography component="span" variant="caption" sx={{ fontSize: '1rem', color: '#888', fontWeight: 500 }}>
                                                    {formatDate(notification.created_at)}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                {notification.status === 'unread' && (
                                                    <Tooltip title="Đánh dấu đã đọc">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleMarkAsRead(notification.notification_id)}
                                                            sx={{ color: '#3fc8e0', background: '#e0f7fa', fontWeight: 800, '&:hover': { background: '#b2ebf2' } }}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Ẩn thông báo">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDismiss(notification.notification_id)}
                                                        sx={{ color: '#bdbdbd', background: '#f8f9fb', fontWeight: 800, '&:hover': { background: '#e0e0e0' } }}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Stack>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Fade>
            )}
        </Box>
    );
};

export default NotificationPanel;
