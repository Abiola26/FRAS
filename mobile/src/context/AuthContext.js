import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { securityService } from '../services/security';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const savedUser = await AsyncStorage.getItem('user');
            const bioEnabled = await AsyncStorage.getItem('biometricEnabled');

            setIsBiometricEnabled(bioEnabled === 'true');

            if (token && savedUser) {
                setIsAuthenticated(true);
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const data = await authAPI.login(username, password);
            await AsyncStorage.setItem('authToken', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            setUser(data.user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Invalid credentials'
            };
        }
    };

    const loginWithBiometrics = async () => {
        try {
            const success = await securityService.authenticate();
            if (!success) return { success: false, error: 'Authentication failed' };

            const creds = await securityService.getCredentials();
            if (!creds) return { success: false, error: 'No stored credentials found' };

            return await login(creds.username, creds.password);
        } catch (error) {
            return { success: false, error: 'Biometric login error' };
        }
    };

    const toggleBiometrics = async (enabled, username, password) => {
        try {
            if (enabled) {
                const available = await securityService.isBiometricAvailable();
                if (!available) {
                    return { success: false, error: 'Biometrics not available on this device' };
                }

                const success = await securityService.authenticate();
                if (!success) return { success: false, error: 'Authentication failed' };

                await securityService.saveCredentials(username, password);
                await AsyncStorage.setItem('biometricEnabled', 'true');
                setIsBiometricEnabled(true);
            } else {
                await securityService.deleteCredentials();
                await AsyncStorage.setItem('biometricEnabled', 'false');
                setIsBiometricEnabled(false);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Error toggling biometrics' };
        }
    };

    const register = async (username, password, email) => {
        try {
            await authAPI.register(username, password, email);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Registration failed. Username or email might be taken.'
            };
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateUser = async (data) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(data));
            setUser(data);
        } catch (error) {
            console.error('Error updating user state:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            isLoading,
            isBiometricEnabled,
            login,
            logout,
            register,
            updateUser,
            loginWithBiometrics,
            toggleBiometrics
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
