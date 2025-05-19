import React from 'react';
import {
    AppBar,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Button
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CalendarToday as CalendarTodayIcon,
    SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../notifications/NotificationPanel';

const Navigation = ({ activeTab, onTabChange }) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Task Management System
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <NotificationPanel />
                        <Typography variant="body1">
                            Welcome, {user?.email}
                        </Typography>
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: 240,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        <ListItem
                            button
                            selected={activeTab === 'tasks'}
                            onClick={() => onTabChange('tasks')}
                        >
                            <ListItemIcon>
                                <AssignmentIcon />
                            </ListItemIcon>
                            <ListItemText primary="Tasks" />
                        </ListItem>
                        <ListItem
                            button
                            selected={activeTab === 'calendar'}
                            onClick={() => onTabChange('calendar')}
                        >
                            <ListItemIcon>
                                <CalendarTodayIcon />
                            </ListItemIcon>
                            <ListItemText primary="Calendar" />
                        </ListItem>
                        <ListItem
                            button
                            selected={activeTab === 'sync'}
                            onClick={() => onTabChange('sync')}
                        >
                            <ListItemIcon>
                                <CalendarTodayIcon color="secondary" />
                            </ListItemIcon>
                            <ListItemText primary="Calendar Sync" />
                        </ListItem>
                        <ListItem
                            button
                            selected={activeTab === 'ai'}
                            onClick={() => onTabChange('ai')}
                        >
                            <ListItemIcon>
                                <SmartToyIcon />
                            </ListItemIcon>
                            <ListItemText primary="AI Assistant" />
                        </ListItem>
                        <ListItem
                            button
                            selected={activeTab === 'events'}
                            onClick={() => onTabChange('events')}
                        >
                            <ListItemIcon>
                                <CalendarTodayIcon color="secondary" />
                            </ListItemIcon>
                            <ListItemText primary="Events" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default Navigation; 