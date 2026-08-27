import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    LinearProgress,
    useTheme,
    Checkbox,
    FormControlLabel,
    Stack,
    Divider,
    Chip,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    LocalShipping,
    Dashboard,
    Analytics,
    CloudUpload,
    TrendingUp,
    CheckCircleOutline,
    PersonOutline,
    LockOutlined,
} from '@mui/icons-material';

const features = [
    { icon: <Dashboard sx={{ fontSize: 18 }} />, text: 'Real-time Fleet Dashboard' },
    { icon: <Analytics sx={{ fontSize: 18 }} />, text: 'Advanced Analytics & Reports' },
    { icon: <CloudUpload sx={{ fontSize: 18 }} />, text: 'CSV/Excel Bulk Upload' },
    { icon: <TrendingUp sx={{ fontSize: 18 }} />, text: 'Revenue Trend Predictions' },
];

const Login = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword: '' });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(username, password);
                navigate('/');
            } else {
                if (signupData.password !== signupData.confirmPassword) {
                    setError("Passwords don't match");
                    return;
                }
                await api.post('/auth/signup', {
                    username: signupData.username,
                    email: signupData.email,
                    password: signupData.password,
                });
                await login(signupData.username, signupData.password);
                navigate('/');
            }
        } catch (err) {
            const msg = err.response?.data?.detail || 'Authentication failed. Please try again.';
            setError(msg);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex' }}>

            {/* ── Left Panel: Branding ── */}
            <Box
                sx={{
                    flex: 1,
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    px: { md: 8, lg: 12 },
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: 'rgba(59,130,246,0.15)',
                        top: -100,
                        left: -100,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: 350,
                        height: 350,
                        borderRadius: '50%',
                        background: 'rgba(147,51,234,0.1)',
                        bottom: -80,
                        right: -80,
                    },
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            <LocalShipping sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            FRAS
                        </Typography>
                    </Box>

                    <Typography
                        variant="h3"
                        sx={{ color: '#fff', fontWeight: 900, letterSpacing: '-0.03em', mb: 1.5, lineHeight: 1.15 }}
                    >
                        Fleet Reporting
                        <br />
                        & Analytics System
                    </Typography>

                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, maxWidth: 420, lineHeight: 1.6 }}>
                        The all-in-one platform for tracking fleet revenue, remittances, and performance insights in real time.
                    </Typography>

                    <Stack spacing={2}>
                        {features.map((f, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <CheckCircleOutline sx={{ color: '#60a5fa', fontSize: 20 }} />
                                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                                    {f.text}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Box>

            {/* ── Right Panel: Form ── */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                    bgcolor: isDarkMode ? 'grey.900' : 'grey.50',
                }}
            >
                <Box sx={{ width: '100%', maxWidth: 420 }}>
                    {/* Mobile-only logo */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
                        <LocalShipping sx={{ color: 'primary.main', fontSize: 28 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>FRAS</Typography>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                        Welcome back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {isLogin ? 'Sign in to your account to continue' : 'Create a new account'}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2.5}>
                            {isLogin ? (
                                <>
                                    <TextField
                                        label="Username"
                                        fullWidth
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutline color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <TextField
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlined color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <FormControlLabel
                                            control={<Checkbox size="small" />}
                                            label={<Typography variant="body2">Remember me</Typography>}
                                        />
                                        <Button
                                            size="small"
                                            onClick={() => navigate('/forgot-password')}
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Forgot Password?
                                        </Button>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <TextField
                                        label="Username"
                                        fullWidth
                                        value={signupData.username}
                                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                                        required
                                    />
                                    <TextField
                                        label="Email Address"
                                        type="email"
                                        fullWidth
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                        required
                                    />
                                    <TextField
                                        label="Password"
                                        type="password"
                                        fullWidth
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        required
                                    />
                                    {signupData.password && (
                                        <Box sx={{ mt: -1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">Strength</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 600 }} color={
                                                    signupData.password.length < 6 ? 'error' :
                                                        signupData.password.length < 10 ? 'warning.main' : 'success.main'
                                                }>
                                                    {signupData.password.length < 6 ? 'Weak' :
                                                        signupData.password.length < 10 ? 'Fair' : 'Strong'}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(100, (signupData.password.length / 12) * 100)}
                                                color={
                                                    signupData.password.length < 6 ? 'error' :
                                                        signupData.password.length < 10 ? 'warning' : 'success'
                                                }
                                                sx={{ height: 4, borderRadius: 2 }}
                                            />
                                        </Box>
                                    )}
                                    <TextField
                                        label="Confirm Password"
                                        type="password"
                                        fullWidth
                                        value={signupData.confirmPassword}
                                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                sx={{
                                    py: 1.4,
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                    boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                                        boxShadow: '0 6px 20px rgba(37,99,235,0.5)',
                                    },
                                }}
                            >
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </Button>
                        </Stack>
                    </form>

                    <Divider sx={{ my: 3 }}>
                        <Chip label="or" size="small" variant="outlined" />
                    </Divider>

                    <Typography variant="body2" align="center" color="text.secondary">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <Button
                            size="small"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            sx={{ textTransform: 'none', fontWeight: 700, p: 0 }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
