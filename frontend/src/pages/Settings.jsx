import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    Divider,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem
} from '@mui/material';
import { Add, SupervisorAccount, Settings as SettingsIcon, TrendingUp, Shield, Build } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import api from '../services/api';
import { useSnackbar } from 'notistack';

const Settings = () => {
    const { user } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const { enqueueSnackbar } = useSnackbar();

    // User Creation State
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'user'
    });
    const [loading, setLoading] = useState(false);

    // System Settings State
    const [systemSettings, setSystemSettings] = useState({});
    const [settingsLoading, setSettingsLoading] = useState(true);

    const fetchSystemSettings = async () => {
        try {
            const res = await api.get('/settings');
            const settingsObj = {};
            res.data.forEach(s => {
                settingsObj[s.key] = s.value;
            });
            setSystemSettings(settingsObj);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemSettings();
    }, []);

    const updateSystemSetting = async (key, value) => {
        try {
            await api.put(`/settings/${key}`, { key, value });
            enqueueSnackbar(`Setting ${key} updated`, { variant: 'success' });
            fetchSystemSettings();
        } catch (error) {
            enqueueSnackbar('Failed to update setting', { variant: 'error' });
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.username || !newUser.password) {
            enqueueSnackbar('Please fill in all fields', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', newUser);
            enqueueSnackbar(`User ${newUser.username} created successfully`, { variant: 'success' });
            setOpenUserDialog(false);
            setNewUser({ username: '', password: '', role: 'user' });
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to create user';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user?.role === 'admin';

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Settings
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Application configuration and preferences
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Business Rules (Admin Only) */}
                {isAdmin && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <TrendingUp color="primary" />
                                <Typography variant="h6" fontWeight={700}>Calculations & Business Rules</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Remittance Rate - 1xxx Series (%)"
                                        fullWidth
                                        type="number"
                                        value={systemSettings.REMITTANCE_1 || 84}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, REMITTANCE_1: e.target.value })}
                                        onBlur={(e) => updateSystemSetting('REMITTANCE_1', e.target.value)}
                                        helperText="Default 84%"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Remittance Rate - 2xxx Series (%)"
                                        fullWidth
                                        type="number"
                                        value={systemSettings.REMITTANCE_2 || 87.5}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, REMITTANCE_2: e.target.value })}
                                        onBlur={(e) => updateSystemSetting('REMITTANCE_2', e.target.value)}
                                        helperText="Default 87.5%"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Build color="primary" />
                                <Typography variant="h6" fontWeight={700}>System Management</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.MAINTENANCE_MODE === 'true'}
                                        onChange={(e) => updateSystemSetting('MAINTENANCE_MODE', e.target.checked.toString())}
                                        color="warning"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>Maintenance Mode</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            When enabled, standard users will see a maintenance message and cannot access the app.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>
                    </Grid>
                )}

                {/* General Settings */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <SettingsIcon color="primary" />
                            <Typography variant="h6" fontWeight={700}>System Preferences</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Email Notifications (Weekly Report)"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Auto-generate Reports on Upload"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={<Switch checked={mode === 'dark'} onChange={toggleColorMode} />}
                            label="Dark Mode"
                            sx={{ display: 'block', mb: 1 }}
                        />
                    </Paper>
                </Grid>

                {/* User Management (Admin Only) */}
                {isAdmin && (
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <SupervisorAccount color="secondary" />
                                    <Typography variant="h6" fontWeight={700}>User Management</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Typography variant="body2" color="textSecondary" paragraph>
                                Add new administrators or standard users to the system.
                            </Typography>

                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<Add />}
                                onClick={() => setOpenUserDialog(true)}
                                fullWidth
                                sx={{ py: 1.5 }}
                            >
                                Create New User
                            </Button>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Create User Dialog */}
            <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Username"
                            fullWidth
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <TextField
                            select
                            label="Role"
                            fullWidth
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <MenuItem value="user">User (Viewer)</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser} variant="contained" disabled={loading}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Settings;
