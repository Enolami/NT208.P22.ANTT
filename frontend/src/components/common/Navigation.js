import React, { useState } from 'react';
import {
    AppBar,
    Box,
    Drawer,
    Toolbar,
    Typography,
    IconButton,
    Button
} from '@mui/material';
import {
    Menu as MenuIcon,
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../notifications/NotificationPanel';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../../context/ThemeContext';

const drawerWidth = 260;

const NavItem = ({ active, icon, label, onClick }) => {
    const { darkMode } = useThemeContext();
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: "'Quicksand', 'Inter', sans-serif",
                fontSize: 18,
                color: active
                    ? (darkMode ? '#6ee7b7' : '#fff')
                    : (darkMode ? '#e3e6f3' : '#d1fae5'),
                background: active
                    ? (darkMode ? '#166534' : '#22c55e')
                    : (darkMode ? 'transparent' : 'transparent'),
                boxShadow: active
                    ? (darkMode ? '0 2px 8px #166534' : '0 2px 8px #22c55e33')
                    : 'none',
                mb: 1.5,
                transition: 'background 0.18s, color 0.18s',
                '&:hover': {
                    background: darkMode ? '#14532d' : '#16a34a',
                    color: '#fff'
                }
            }}
        >
            <span style={{ fontSize: 22, marginRight: 14 }}>{icon}</span>
            <span>{label}</span>
        </Box>
    );
};

const Navigation = ({ activeTab, onTabChange, isMobile }) => {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { darkMode, toggleTheme } = useThemeContext();
    const theme = useTheme();

    const handleLogout = () => {
        logout();
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawerContent = (
        <Box sx={{
            overflow: 'auto',
            p: 3,
            background: darkMode ? '#1e293b' : '#166534', // #1e293b cho sidebar dark
            borderRadius: 4,
            fontFamily: "'Quicksand', Arial, sans-serif",
            boxShadow: darkMode ? '0 2px 12px #0f172a88' : '0 2px 12px #22c55e33',
            border: darkMode ? '2px solid #22c55e' : '2px solid #bbf7d0',
            minHeight: '100vh'
        }}>
            <NavItem
                active={activeTab === 'tasks'}
                icon={<i className="fas fa-tasks"></i>}
                label="Công việc"
                onClick={() => { onTabChange('tasks'); if (isMobile) setMobileOpen(false); }}
            />
            <NavItem
                active={activeTab === 'calendar'}
                icon={<i className="fas fa-calendar-alt"></i>}
                label="Lịch"
                onClick={() => { onTabChange('calendar'); if (isMobile) setMobileOpen(false); }}
            />
            <NavItem
                active={activeTab === 'sync'}
                icon={<i className="fas fa-sync"></i>}
                label="Đồng bộ"
                onClick={() => { onTabChange('sync'); if (isMobile) setMobileOpen(false); }}
            />
            <NavItem
                active={activeTab === 'ai'}
                icon={<i className="fas fa-robot"></i>}
                label="Trợ lý AI"
                onClick={() => { onTabChange('ai'); if (isMobile) setMobileOpen(false); }}
            />
            <NavItem
                active={activeTab === 'events'}
                icon={<i className="fas fa-calendar-day"></i>}
                label="Sự kiện"
                onClick={() => { onTabChange('events'); if (isMobile) setMobileOpen(false); }}
            />
        </Box>
    );

    return (
        <>
        <AppBar position="fixed" sx={{
                zIndex: theme.zIndex.drawer + 1,
                background: darkMode ? '#166534' : '#22c55e',
                color: '#fff',
                fontFamily: "'Quicksand', Arial, sans-serif",
                boxShadow: darkMode ? '0 2px 12px #166534' : '0 2px 12px #22c55e33',
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24
            }}>
                <Toolbar sx={isMobile ? { minHeight: 56, px: 1, display: 'flex', justifyContent: 'space-between' } : {}}>
                    {isMobile ? (
                        <>
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
                            <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography
                                    variant="h6"
                                    noWrap
                                    component="div"
                                    sx={{
                                        textAlign: 'center',
                                        width: '100%',
                                        fontWeight: 800,
                                        letterSpacing: 1,
                                        color: '#fff',
                                        fontFamily: "'Quicksand', sans-serif"
                                    }}
                                >
                                    Smart Scheduler
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', gap: 1 }}>
                                <NotificationPanel isMobile={isMobile} />
                                <IconButton
                                    color="inherit"
                                    onClick={toggleTheme}
                                    sx={{
                                        ml: 1,
                                        background: darkMode ? '#14532d' : '#bbf7d0',
                                        color: darkMode ? '#bbf7d0' : '#166534',
                                        borderRadius: 2,
                                        transition: 'background 0.18s'
                                    }}
                                    title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
                                >
                                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                                <Button color="inherit" onClick={handleLogout} sx={{
                                    minWidth: 0,
                                    px: 2,
                                    fontWeight: 700,
                                    fontFamily: "'Quicksand', sans-serif",
                                    background: darkMode ? '#22c55e' : '#bbf7d0',
                                    color: darkMode ? '#1e293b' : '#166534',
                                    borderRadius: 2,
                                    '&:hover': {
                                        background: darkMode ? '#16a34a' : '#6ee7b7',
                                        color: '#fff'
                                    }
                                }}>
                                    Đăng xuất
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
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        marginRight: 18,
                                        boxShadow: '0 2px 8px #22c55e44'
                                    }}
                                />
                                <Typography variant="h5" noWrap component="div" sx={{
                                    fontWeight: 800,
                                    letterSpacing: 1,
                                    fontFamily: "'Quicksand', sans-serif",
                                    color: '#fff'
                                }}>
                                    Smart Scheduler
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <NotificationPanel isMobile={isMobile} />
                                <IconButton
                                    color="inherit"
                                    onClick={toggleTheme}
                                    sx={{
                                        ml: 1,
                                        background: darkMode ? '#14532d' : '#bbf7d0',
                                        color: darkMode ? '#bbf7d0' : '#166534',
                                        borderRadius: 2,
                                        transition: 'background 0.18s'
                                    }}
                                    title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
                                >
                                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                                <Typography variant="body1" sx={{
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontFamily: "'Quicksand', sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    Xin chào, <span style={{ fontWeight: 800 }}>{user?.lastName || user?.last_name || ''}</span>
                                </Typography>
                                <Button color="inherit" onClick={handleLogout} sx={{
                                    fontWeight: 700,
                                    fontFamily: "'Quicksand', sans-serif",
                                    background: darkMode ? '#22c55e' : '#bbf7d0',
                                    color: darkMode ? '#1e293b' : '#166534',
                                    borderRadius: 2,
                                    px: 4,
                                    py: 1.5,
                                    boxShadow: '0 2px 8px #22c55e33',
                                    '&:hover': {
                                        background: darkMode ? '#16a34a' : '#6ee7b7',
                                        color: '#fff'
                                    }
                                }}>
                                    Đăng xuất
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
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            background: darkMode ? '#1e293b' : '#166534', // #1e293b cho sidebar dark
                            borderRadius: 4,
                            boxShadow: darkMode ? '0 2px 12px #0f172a88' : '0 2px 12px #22c55e33'
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
                            background: darkMode ? '#1e293b' : '#166534', // #1e293b cho sidebar dark
                            borderRadius: 4,
                            boxShadow: darkMode ? '0 2px 12px #0f172a88' : '0 2px 12px #22c55e33',
                            border: darkMode ? '2px solid #22c55e' : '2px solid #bbf7d0'
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