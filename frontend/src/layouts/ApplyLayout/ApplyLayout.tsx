import { Box, Paper, Typography } from '@mui/material'
import { Outlet } from 'react-router-dom'
export function ApplyLayout() { return <Box className="auth-layout"><Paper className="auth-card"><Typography variant="h5" sx={{ mb: 2 }}>ICEP application</Typography><Outlet /></Paper></Box> }
export default ApplyLayout
