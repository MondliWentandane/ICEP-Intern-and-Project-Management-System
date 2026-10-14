import { AppBar, Box, Toolbar, Typography } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <Box className="app-layout">
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar><Typography variant="h6" color="primary">ICEP.</Typography></Toolbar>
      </AppBar>
      <Box component="main" className="app-content"><Outlet /></Box>
    </Box>
  )
}
