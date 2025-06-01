import React, { useState } from 'react';
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
    Button,
    IconButton
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CalendarToday as CalendarTodayIcon,
    SmartToy as SmartToyIcon,
    Menu as MenuIcon,
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../notifications/NotificationPanel';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 240;

const NavItem = ({ active, icon, label, onClick, isDark }) => (
    <Box
        onClick={onClick}
        sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            borderRadius: 2,
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            color: active ? (isDark ? '#3fc8e0' : '#4361ee') : (isDark ? '#e3e6f3' : '#212529'),
            background: active ? (isDark ? '#23263a' : '#e9f0ff') : 'transparent',
            boxShadow: active ? (isDark ? '0 2px 8px #23263a' : '0 2px 8px #4361ee11') : 'none',
            transition: 'background 0.18s, color 0.18s',
            '&:hover': {
                background: isDark ? '#23263a' : '#f8f9fa',
                color: isDark ? '#3fc8e0' : '#4361ee'
            }
        }}
    >
        {icon}
        <span style={{ marginLeft: 12 }}>{label}</span>
    </Box>
);

const Navigation = ({ activeTab, onTabChange, isMobile }) => {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });
    const theme = useTheme();
    const isDark = darkMode || theme.palette.mode === 'dark';

    const handleLogout = () => {
        logout();
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleThemeToggle = () => {
        setDarkMode((prev) => {
            const newMode = !prev;
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
            document.body.setAttribute('data-theme', newMode ? 'dark' : 'light');
            return newMode;
        });
    };

    const drawerContent = (
        <Box sx={{
            overflow: 'auto',
            p: 2,
            background: isDark ? '#23263a' : '#fff', // Sáng hơn cho dark mode
            borderRadius: 3,
            fontFamily: "'Quicksand', Arial, sans-serif",
            boxShadow: isDark ? '0 2px 12px #3fc8e044' : '0 2px 12px #4361ee11',
            border: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #e9f0ff'
        }}>
            <NavItem
                active={activeTab === 'tasks'}
                icon={<AssignmentIcon sx={{ color: activeTab === 'tasks' ? (isDark ? '#3fc8e0' : '#4361ee') : '#b0b0b0' }} />}
                label="Tasks"
                onClick={() => { onTabChange('tasks'); if (isMobile) setMobileOpen(false); }}
                isDark={isDark}
            />
            <NavItem
                active={activeTab === 'calendar'}
                icon={<CalendarTodayIcon sx={{ color: activeTab === 'calendar' ? '#4361ee' : '#b0b0b0' }} />}
                label="Calendar"
                onClick={() => { onTabChange('calendar'); if (isMobile) setMobileOpen(false); }}
                isDark={isDark}
            />
            <NavItem
                active={activeTab === 'sync'}
                icon={<CalendarTodayIcon color="secondary" sx={{ color: activeTab === 'sync' ? '#06d6a0' : '#b0b0b0' }} />}
                label="Calendar Sync"
                onClick={() => { onTabChange('sync'); if (isMobile) setMobileOpen(false); }}
                isDark={isDark}
            />
            <NavItem
                active={activeTab === 'ai'}
                icon={<SmartToyIcon sx={{ color: activeTab === 'ai' ? '#4361ee' : '#b0b0b0' }} />}
                label="AI Assistant"
                onClick={() => { onTabChange('ai'); if (isMobile) setMobileOpen(false); }}
                isDark={isDark}
            />
            <NavItem
                active={activeTab === 'events'}
                icon={<CalendarTodayIcon color="secondary" sx={{ color: activeTab === 'events' ? '#06d6a0' : '#b0b0b0' }} />}
                label="Events"
                onClick={() => { onTabChange('events'); if (isMobile) setMobileOpen(false); }}
                isDark={isDark}
            />
        </Box>
    );

    return (
        <>
            <AppBar position="fixed" sx={{
                zIndex: theme.zIndex.drawer + 1,
                background: isDark ? '#23263a' : '#4361ee',
                color: isDark ? '#f8f9fa' : '#fff',
                fontFamily: "'Quicksand', Arial, sans-serif",
                boxShadow: isDark ? '0 2px 12px #23263a' : '0 2px 12px #4361ee11'
            }}>
                <Toolbar sx={isMobile ? { minHeight: 56, px: 1, display: 'flex', justifyContent: 'space-between' } : {}}>
                    {isMobile ? (
                        <>
                            {/* Left: Hamburger */}
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                                <IconButton
                                    color="inherit"
                                    aria-label="open drawer"
                                    edge="start"
                                    onClick={handleDrawerToggle}
                                    sx={{ mr: 1 }}
                                >
                                    <MenuIcon />
                                </IconButton>
                            </Box>
                            {/* Center: Title */}
                            <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography
                                    variant="h6"
                                    noWrap
                                    component="div"
                                    sx={{ textAlign: 'center', width: '100%', fontWeight: 700, letterSpacing: 1, color: isDark ? '#fff' : '#212529', fontFamily: "'Quicksand', sans-serif" }}
                                >
                                    Smart Schedule
                                </Typography>
                            </Box>
                            {/* Right: Notification + Theme Toggle + Logout */}
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', gap: 1 }}>
                                <NotificationPanel isMobile={isMobile} />
                                <IconButton
                                    color="inherit"
                                    onClick={handleThemeToggle}
                                    sx={{
                                        ml: 1,
                                        background: darkMode ? '#212529' : '#e9f0ff',
                                        color: darkMode ? '#ffe066' : '#4361ee',
                                        borderRadius: 2,
                                        transition: 'background 0.18s'
                                    }}
                                    title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
                                >
                                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                                <Button color="inherit" onClick={handleLogout} sx={{ minWidth: 0, px: 1, fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
                                    Logout
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                <img
                                    src="/logo192.png"
                                    alt="TaskFlow Logo"
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        marginRight: 14,
                                        boxShadow: '0 2px 8px #fff2'
                                    }}
                                />
                                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: 1, fontFamily: "'Quicksand', sans-serif" }}>
                                    Smart Schedule
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <NotificationPanel isMobile={isMobile} />
                                <IconButton
                                    color="inherit"
                                    onClick={handleThemeToggle}
                                    sx={{
                                        ml: 1,
                                        background: darkMode ? '#212529' : '#e9f0ff',
                                        color: darkMode ? '#ffe066' : '#4361ee',
                                        borderRadius: 2,
                                        transition: 'background 0.18s'
                                    }}
                                    title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
                                >
                                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                                <Typography variant="body1" sx={{ color: isDark ? '#fff' : '#212529', fontWeight: 600, fontFamily: "'Quicksand', sans-serif", display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Hello, <span style={{ fontWeight: 700 }}>{user?.email}</span>
                                </Typography>
                                <Button color="inherit" onClick={handleLogout} sx={{ fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
                                    LOGOUT
                                </Button>
                            </Box>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            background: isDark ? '#181c2a' : '#fff',
                            borderRadius: 3,
                            boxShadow: isDark ? '0 2px 12px #23263a' : '0 2px 12px #4361ee11'
                        },
                    }}
                >
                    <Toolbar />
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            background: isDark ? '#23263a' : '#fff', // Sáng hơn cho dark mode
                            borderRadius: 3,
                            boxShadow: isDark ? '0 2px 12px #3fc8e044' : '0 2px 12px #4361ee11',
                            border: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #e9f0ff'
                        },
                    }}
                    open
                >
                    <Toolbar />
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
};

export default Navigation;