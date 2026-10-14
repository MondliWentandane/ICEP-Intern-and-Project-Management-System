import { createTheme } from '@mui/material/styles'

// Starter tokens from the ICEP design documents; confirm against final Figma styles.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1B3A5C' },
    background: { default: '#F5F6F8', paper: '#FFFFFF' },
    text: { primary: '#1A202C', secondary: '#718096' },
    success: { main: '#16A34A' },
    warning: { main: '#F59E0B' },
    info: { main: '#3B82F6' },
    error: { main: '#DC2626' },
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif' },
  shape: { borderRadius: 8 },
})
