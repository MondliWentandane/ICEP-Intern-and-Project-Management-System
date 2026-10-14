import { AppBar, Toolbar, Typography } from '@mui/material'
import { useAuth } from '@/hooks/useAuth'
export function Topbar() { const { user } = useAuth(); return <AppBar position="static" color="inherit" elevation={0}><Toolbar><Typography sx={{ flexGrow: 1 }}>ICEP workspace</Typography><Typography color="text.secondary">{user?.name ?? user?.role}</Typography></Toolbar></AppBar> }
