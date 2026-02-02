import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography, Grid, Paper, Box, CircularProgress, Alert,
    List, ListItem, ListItemText, ListItemIcon, Divider, Button,
    Skeleton, Avatar, useTheme
} from '@mui/material';
import { TrendingUp, Description, LocalShipping, History, AutoGraph, NorthEast, SouthEast } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

import { PageSkeleton } from '../components/common/PageSkeleton';

const StatCard = ({ title, value, icon, color, loading, trend }) => {
    const theme = useTheme();
    return (
        <Paper sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.palette.mode === 'dark' ? '0 12px 30px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.1)',
            }
        }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, transform: 'rotate(15deg)' }}>
                {React.cloneElement(icon, { sx: { fontSize: 100, color: color } })}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </Typography>
                <Avatar sx={{ bgcolor: color + '20', color: color, width: 40, height: 40 }}>
                    {React.cloneElement(icon, { sx: { fontSize: 20 } })}
                </Avatar>
            </Box>

            <Box sx={{ mt: 3, zIndex: 1 }}>
                {loading ? (
                    <Skeleton width="80%" height={60} />
                ) : (
                    <Box component="span" sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                            {value}
                        </Typography>
                    </Box>
                )}
            </Box>

            {trend && !loading && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, zIndex: 1 }}>
                    {trend > 0 ? <NorthEast sx={{ fontSize: 16, color: 'success.main' }} /> : <SouthEast sx={{ fontSize: 16, color: 'error.main' }} />}
                    <Typography variant="caption" sx={{ color: trend > 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                        {Math.abs(trend)}% from yesterday
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const fetchPromises = [api.get('/analytics/dashboard-stats')];
            const isAdmin = user?.role === 'admin';

            if (isAdmin) {
                fetchPromises.push(api.get('/audit', { params: { limit: 5 } }));
            }

            const results = await Promise.all(fetchPromises);

            setStats(results[0].data);
            if (isAdmin && results[1]) {
                setRecentLogs(results[1].data);
            } else {
                setRecentLogs([]);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to load dashboard data';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0).replace('NGN', '₦');
    };

    if (loading) return <PageSkeleton />;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Overview of your fleet performance
                </Typography>
            </Box>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error} - Showing default values.
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats?.total_revenue || 0)}
                        icon={<TrendingUp />}
                        color="#2563eb"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Records"
                        value={stats?.total_records || 0}
                        icon={<Description />}
                        color="#7c3aed"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Predicted / Day"
                        value={formatCurrency(stats?.predicted_revenue || 0)}
                        icon={<AutoGraph />}
                        color="#0891b2"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Top Fleet"
                        value={stats?.top_performing_fleet || 'N/A'}
                        icon={<LocalShipping />}
                        color="#059669"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                {/* Recent Activity Feed */}
                {user?.role === 'admin' && (
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                            Recent System Activity
                        </Typography>
                        <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <List disablePadding>
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((log, index) => (
                                        <React.Fragment key={log.id}>
                                            <ListItem sx={{ py: 1.5 }}>
                                                <ListItemIcon sx={{ minWidth: 46 }}>
                                                    <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: 1.5, display: 'flex', color: 'primary.main' }}>
                                                        <History fontSize="small" />
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={log.action.replace(/_/g, ' ')}
                                                    secondary={`${log.username} • ${log.details || 'No additional details'} `}
                                                    primaryTypographyProps={{ fontWeight: 600, textTransform: 'capitalize', variant: 'body2' }}
                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                />
                                                <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </ListItem>
                                            {index < recentLogs.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography color="textSecondary">No recent activity found</Typography>
                                    </Box>
                                )}
                            </List>
                            <Box sx={{ p: 1.5, bgcolor: 'action.hover', textAlign: 'center' }}>
                                <Button size="small" onClick={() => navigate('/audit-logs')} sx={{ textTransform: 'none' }}>View All Logs</Button>
                            </Box>
                        </Paper>
                    </Grid>
                )}

                {/* Quick Actions Column */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                        Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[
                            { title: 'Upload Data', icon: <Description />, path: '/upload', desc: 'Import new records' },
                            { title: 'Generate Reports', icon: <TrendingUp />, path: '/reports', desc: 'View detailed logs' },
                            { title: 'View Analytics', icon: <TrendingUp />, path: '/analytics', desc: 'Visualize performance' }
                        ].map((action, i) => (
                            <Paper
                                key={i}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    borderRadius: 3,
                                    '&:hover': { bgcolor: 'action.hover', transform: 'translateX(4px)' },
                                    transition: '0.2s'
                                }}
                                onClick={() => navigate(action.path)}
                            >
                                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.main', display: 'flex' }}>
                                    {React.cloneElement(action.icon, { fontSize: 'small' })}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{action.title}</Typography>
                                    <Typography variant="caption" color="textSecondary">{action.desc}</Typography>
                                </Box>
                            </Paper>
                        ))}
                        {/* Security Widget */}
                        <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 700, color: 'text.primary' }}>
                            Security & System
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{ p: 2.5, borderRadius: 3, bgcolor: 'success.light', border: 'none' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Box sx={{ width: 10, height: 10, bgcolor: 'success.main', borderRadius: '50%' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                                    Account Secure
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'success.dark', display: 'block', mb: 2 }}>
                                {user?.is_locked ? 'Your account is currently restricted.' : 'Multi-factor authentication is recommended for higher security.'}
                            </Typography>
                            <Divider sx={{ mb: 1.5, borderColor: 'rgba(0,0,0,0.05)' }} />
                            <Typography variant="caption" color="textSecondary">
                                Last Login: {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Just now'}
                            </Typography>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
