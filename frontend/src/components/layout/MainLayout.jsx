import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/notificationService';
import {
    Box,
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useTheme,
    useMediaQuery,
    Badge,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {

    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    UploadFile as UploadIcon,
    TableChart as TableIcon,
    Analytics as AnalyticsIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    History as HistoryIcon,
    Brightness4 as DarkIcon,
    Brightness7 as LightIcon,
    Notifications as NotificationsIcon,
    Delete as DeleteIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useColorMode } from '../../context/ColorModeContext';

const drawerWidth = 260;

const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();
    const theme = useTheme();
    const colorMode = useColorMode();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const [isNotifLoading, setIsNotifLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setIsNotifLoading(true);
            const data = await notificationAPI.getNotifications();
            setNotifications(data);
            const countData = await notificationAPI.getUnreadCount();
            setUnreadCount(countData.count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsNotifLoading(false);
        }
    };

    React.useEffect(() => {
        if (user) {
            fetchNotifications();
            // Refresh count every 5 mins
            const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleNotifOpen = (event) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleNotifClose = () => {
        setNotifAnchorEl(null);
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <SuccessIcon color="success" />;
            case 'error': return <ErrorIcon color="error" />;
            case 'warning': return <WarningIcon color="warning" />;
            default: return <InfoIcon color="primary" />;
        }
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Upload Data', icon: <UploadIcon />, path: '/upload' },
        { text: 'Reports', icon: <TableIcon />, path: '/reports' },
        { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ text: 'User Management', icon: <PeopleIcon />, path: '/users' });
        menuItems.push({ text: 'Audit Logs', icon: <HistoryIcon />, path: '/audit-logs' });
    }

    menuItems.push({ text: 'Settings', icon: <SettingsIcon />, path: '/settings' });

    const drawer = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1e293b', // Always dark slate for sidebar
            color: '#f8fafc', // Always light text
            borderRight: '1px solid',
            borderColor: 'rgba(255,255,255,0.1)'
        }}>
            <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    FRAS
                </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                            selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(37, 99, 235, 0.2)', // Blue tint
                                    color: '#60a5fa', // Blue text
                                    '&:hover': {
                                        bgcolor: 'rgba(37, 99, 235, 0.3)',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: '#60a5fa',
                                    }
                                },
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ p: 2 }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{ borderRadius: 2, color: '#f87171', '&:hover': { bgcolor: 'rgba(248, 113, 113, 0.1)' } }}
                >
                    <ListItemIcon sx={{ color: '#f87171', minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.8)',
                    boxShadow: 'none',
                    backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Toggle light/dark theme">
                            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                                {theme.palette.mode === 'dark' ? <LightIcon /> : <DarkIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Notifications">
                            <IconButton color="inherit" onClick={handleNotifOpen}>
                                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorEl={notifAnchorEl}
                            open={Boolean(notifAnchorEl)}
                            onClose={handleNotifClose}
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    width: 340,
                                    maxHeight: 480,
                                    borderRadius: 3,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Notifications</Typography>
                                {unreadCount > 0 && (
                                    <Typography
                                        variant="caption"
                                        sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}
                                        onClick={handleMarkAllRead}
                                    >
                                        Mark all as read
                                    </Typography>
                                )}
                            </Box>
                            <Divider />
                            {isNotifLoading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                            ) : notifications.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography variant="body2">No new notifications</Typography>
                                </Box>
                            ) : (
                                notifications.map((notif) => (
                                    <MenuItem
                                        key={notif.id}
                                        onClick={() => handleMarkAsRead(notif.id)}
                                        sx={{
                                            py: 1.5,
                                            px: 2,
                                            whiteSpace: 'normal',
                                            bgcolor: notif.is_read ? 'transparent' : 'action.hover'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                            <Box sx={{ pt: 0.5 }}>{getIcon(notif.type)}</Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: notif.is_read ? 500 : 700 }}>
                                                    {notif.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    {notif.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))
                            )}
                        </Menu>
                        <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                            {user?.username || 'Admin'}
                        </Typography>
                        <IconButton
                            onClick={handleMenu}
                            size="small"
                            sx={{ ml: 0.5 }}
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.875rem' }}>
                                {(user?.username?.[0] || 'A').toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    minWidth: 160
                                }
                            }}
                        >
                            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: 'background.default' }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;
