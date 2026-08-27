import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';

import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import ForgotPassword from './pages/ForgotPassword';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

import { ColorModeProvider } from './context/ColorModeContext';

function App() {
  return (
    <Router>
      <ColorModeProvider>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="upload" element={<Upload />} />
                <Route path="reports" element={<Reports />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="audit-logs" element={<AuditLogs />} />
              </Route>
            </Routes>
          </AuthProvider>
        </SnackbarProvider>
      </ColorModeProvider>
    </Router>
  );
}

export default App;
