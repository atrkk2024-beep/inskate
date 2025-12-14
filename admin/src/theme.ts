import { defaultTheme } from 'react-admin';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  ...defaultTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a5f', // Dark blue
      light: '#4a6fa5',
      dark: '#0d2137',
      contrastText: '#fff',
    },
    secondary: {
      main: '#c4a962', // Gold
      light: '#f5dc94',
      dark: '#917833',
      contrastText: '#000',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    error: {
      main: '#dc3545',
    },
    success: {
      main: '#28a745',
    },
    warning: {
      main: '#ffc107',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    RaDatagrid: {
      styleOverrides: {
        root: {
          '& .RaDatagrid-headerCell': {
            fontWeight: 600,
            backgroundColor: '#f8f9fa',
          },
        },
      },
    },
  },
});

