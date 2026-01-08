import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    LinearProgress,
    useTheme
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, PersonOutline } from '@mui/icons-material';

const Login = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Registration State
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
                    password: signupData.password
                });
                // Auto login after signup
                await login(signupData.username, signupData.password);
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || 'Authentication failed. Please try again.';
            setError(msg);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDarkMode
                    ? 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                p: 2
            }}
        >
            <Card
                sx={{
                    maxWidth: 400,
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: isDarkMode
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    background: isDarkMode
                        ? 'rgba(30, 41, 59, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}`,
                }}
            >
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 1 }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#1e293b', fontWeight: 800, letterSpacing: '-0.03em' }}>
                            FRAS
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {isLogin ? 'Fleet Reporting & Analytics System' : 'Create a New Account'}
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {isLogin ? (
                            <>
                                <TextField
                                    label="Username"
                                    variant="outlined"
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
                                    variant="outlined"
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
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Box sx={{ mt: -2, textAlign: 'right' }}>
                                    <Button
                                        color="primary"
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
                                    variant="outlined"
                                    fullWidth
                                    value={signupData.username}
                                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                                    required
                                />
                                <TextField
                                    label="Email Address"
                                    type="email"
                                    variant="outlined"
                                    fullWidth
                                    value={signupData.email}
                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                    required
                                />
                                <TextField
                                    label="Password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={signupData.password}
                                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                    required
                                />
                                {signupData.password && (
                                    <Box sx={{ mt: -1, mb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : 'text.secondary' }}>Strength</Typography>
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
                                    variant="outlined"
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
                                mt: 1,
                                py: 1.5,
                                fontSize: '1rem',
                                background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                                '&:hover': {
                                    background: 'linear-gradient(to right, #1d4ed8, #6d28d9)',
                                }
                            }}
                        >
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Button
                            color="primary"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
