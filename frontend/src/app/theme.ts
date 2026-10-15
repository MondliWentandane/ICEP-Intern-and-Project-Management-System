import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1B3A5C', dark: '#12283F' },
    background: { default: '#F5F6F8', paper: '#FFFFFF' },
    text: { primary: '#1A202C', secondary: '#718096' },
    success: { main: '#16A34A' },
    warning: { main: '#F59E0B' },
    info: { main: '#3B82F6' },
    error: { main: '#DC2626' },
    divider: '#D1D9E2',
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0 2px 10px rgba(26, 32, 44, 0.06)' } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 } } },
  },
})
