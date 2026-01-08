import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Avatar,
    Divider,
    Alert,
    LinearProgress
} from '@mui/material';
import { Person, Lock, Save } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import authService from '../services/authService';
import { useSnackbar } from 'notistack';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const handleChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const updatedUser = await authService.updateProfile(profileData);
            updateUser(updatedUser);
            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
            setIsEditingProfile(false);
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to update profile';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            enqueueSnackbar("New passwords don't match", { variant: 'error' });
            return;
        }

        if (passwordData.new_password.length < 6) {
            enqueueSnackbar("Password must be at least 6 characters", { variant: 'error' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            enqueueSnackbar('Password updated successfully', { variant: 'success' });
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to update password';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth="lg" sx={{ mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    My Profile
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Manage your account settings
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Profile Info Card */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 3 }}>
                        <Avatar
                            sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '2.5rem', mb: 2 }}
                        >
                            {(user?.username?.[0] || 'U').toUpperCase()}
                        </Avatar>

                        {isEditingProfile ? (
                            <Box component="form" onSubmit={handleProfileUpdate} sx={{ width: '100%', mt: 1 }}>
                                <TextField
                                    fullWidth
                                    name="username"
                                    label="Username"
                                    value={profileData.username}
                                    onChange={handleProfileChange}
                                    size="small"
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    name="email"
                                    label="Email Address"
                                    value={profileData.email}
                                    onChange={handleProfileChange}
                                    size="small"
                                    sx={{ mb: 2 }}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        type="submit"
                                        disabled={profileLoading}
                                        size="small"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => setIsEditingProfile(false)}
                                        size="small"
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {user?.username}
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setProfileData({ username: user?.username, email: user?.email || '' });
                                        setIsEditingProfile(true);
                                    }}
                                    sx={{ mb: 1 }}
                                >
                                    Edit Profile
                                </Button>
                                {user?.email && (
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        {user.email}
                                    </Typography>
                                )}
                            </>
                        )}

                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textTransform: 'capitalize' }}>
                            {user?.role || 'User'} Role
                        </Typography>

                        <Divider sx={{ width: '100%', my: 2 }} />

                        <Box sx={{ width: '100%', textAlign: 'left' }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Account ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace', mb: 2 }}>
                                {user?.account_id || user?.id}
                            </Typography>

                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Last Login
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'First Session'}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Change Password Card */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 4, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Lock color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Security Settings
                            </Typography>
                        </Box>

                        <form onSubmit={handlePasswordChange}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Current Password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="New Password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handleChange}
                                        required
                                        helperText="Min. 6 characters"
                                    />
                                    {passwordData.new_password && (
                                        <Box sx={{ mt: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption">Strength</Typography>
                                                <Typography variant="caption" color={
                                                    passwordData.new_password.length < 6 ? 'error' :
                                                        passwordData.new_password.length < 10 ? 'warning.main' : 'success.main'
                                                }>
                                                    {passwordData.new_password.length < 6 ? 'Weak' :
                                                        passwordData.new_password.length < 10 ? 'Fair' : 'Strong'}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(100, (passwordData.new_password.length / 12) * 100)}
                                                color={
                                                    passwordData.new_password.length < 6 ? 'error' :
                                                        passwordData.new_password.length < 10 ? 'warning' : 'success'
                                                }
                                                sx={{ height: 4, borderRadius: 2 }}
                                            />
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Confirm New Password"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<Save />}
                                            disabled={loading}
                                            size="large"
                                        >
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Profile;
