import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('userTheme');
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem('userTheme', newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const theme = {
        dark: isDarkMode,
        colors: isDarkMode ? darkColors : lightColors,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

const lightColors = {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    subtext: '#64748b',
    primary: '#2563eb',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#10b981',
    tabBar: '#ffffff',
    header: '#2563eb',
    headerText: '#ffffff',
    input: '#f1f5f9',
};

const darkColors = {
    background: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    subtext: '#94a3b8',
    primary: '#3b82f6',
    border: '#334155',
    error: '#f87171',
    success: '#34d399',
    tabBar: '#1e293b',
    header: '#1e293b',
    headerText: '#ffffff',
    input: '#334155',
};
