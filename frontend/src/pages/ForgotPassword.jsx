import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
    Container,
    Link,
    Divider
} from '@mui/material';
import {
    ArrowBack,
    LockOutlined,
    CheckCircle,
    EmailOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Request, 2: Reset
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/auth/password-reset-request', { email });
            setStep(2);
            setSuccessMsg(res.data.message);
            // In dev, the token is returned in res.data.token
            if (res.data.token) {
                console.log("DEV RESET TOKEN:", res.data.token);
                setToken(res.data.token);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to request password reset');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/password-reset-confirm', {
                token,
                new_password: newPassword
            });
            setStep(3); // Result/Success
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(45deg, #1e3a8a 30%, #3b82f6 90%)'
        }}>
            <Container maxWidth="sm">
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 10 }}>
                    <IconButton
                        onClick={() => step === 2 ? setStep(1) : navigate('/login')}
                        sx={{ mb: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>

                    {step === 1 && (
                        <Box component="form" onSubmit={handleRequest} sx={{ textAlign: 'center' }}>
                            <Box sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                bgcolor: 'primary.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                m: '0 auto 24px'
                            }}>
                                <LockOutlined color="primary" sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800} gutterBottom>
                                Forgot Password?
                            </Typography>
                            <Typography color="textSecondary" sx={{ mb: 4 }}>
                                No problem! Enter your email and we'll send you a password reset token.
                            </Typography>

                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                            <TextField
                                label="Email Address"
                                fullWidth
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailOutlined />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ py: 1.5, borderRadius: 2 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Send Reset Token'}
                            </Button>
                        </Box>
                    )}

                    {step === 2 && (
                        <Box component="form" onSubmit={handleReset} sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={800} gutterBottom>
                                Set New Password
                            </Typography>
                            <Typography color="textSecondary" sx={{ mb: 4 }}>
                                Enter the token received and your new password below.
                            </Typography>

                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Check the browser console (F12) for the dev token.
                            </Alert>

                            <TextField
                                label="Reset Token"
                                fullWidth
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                                sx={{ mb: 3 }}
                            />

                            <TextField
                                label="New Password"
                                fullWidth
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                sx={{ mb: 4 }}
                                helperText="Minimum 6 characters"
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ py: 1.5, borderRadius: 2 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                            </Button>
                        </Box>
                    )}

                    {step === 3 && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                            <Typography variant="h5" fontWeight={800} gutterBottom>
                                Password Updated!
                            </Typography>
                            <Typography color="textSecondary" sx={{ mb: 4 }}>
                                Your password has been successfully reset. You can now log in with your new credentials.
                            </Typography>
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={() => navigate('/login')}
                                sx={{ py: 1.5, borderRadius: 2 }}
                            >
                                Go to Login
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default ForgotPassword;
