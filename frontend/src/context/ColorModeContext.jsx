/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getDesignTokens } from '../theme/theme';

export const ColorModeContext = createContext({ toggleColorMode: () => { } });

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
    // Check local storage or system preference
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('colorMode');
        return savedMode ? savedMode : 'light';
    });

    useEffect(() => {
        localStorage.setItem('colorMode', mode);
    }, [mode]);

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
            mode,
        }),
        [mode],
    );

    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};
