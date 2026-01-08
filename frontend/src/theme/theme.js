import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light Mode
                primary: {
                    main: '#2563eb', // Vivid Royal Blue
                    light: '#60a5fa',
                    dark: '#1e40af',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#7c3aed', // Violet
                    light: '#a78bfa',
                    dark: '#5b21b6',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#f1f5f9', // Slate 100
                    paper: '#ffffff',
                },
                text: {
                    primary: '#0f172a', // Slate 900
                    secondary: '#475569', // Slate 600
                },
            }
            : {
                // Dark Mode
                primary: {
                    main: '#3b82f6', // Brighter Blue for dark mode
                    light: '#60a5fa',
                    dark: '#1d4ed8',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#8b5cf6', // Brighter Violet
                    light: '#a78bfa',
                    dark: '#6d28d9',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#0f172a', // Slate 900
                    paper: '#1e293b', // Slate 800
                },
                text: {
                    primary: '#f8fafc', // Slate 50
                    secondary: '#cbd5e1', // Slate 300
                },
            }),
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('Inter'), local('Inter-Regular'), url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2) format('woff2');
        }
      `,
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    textTransform: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
                rounded: { borderRadius: 16 },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    backgroundColor: mode === 'light' ? '#f8fafc' : '#1e293b',
                    color: mode === 'light' ? '#475569' : '#e2e8f0',
                }
            }
        }
    },
});

const theme = createTheme(getDesignTokens('light'));

export default theme;
