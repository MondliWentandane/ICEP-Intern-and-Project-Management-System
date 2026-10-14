import { AppBar, Button, Toolbar, Typography } from '@mui/material'
import { Link, Outlet } from 'react-router-dom'
export function PublicLayout() { return <><AppBar position="static"><Toolbar><Typography sx={{ flexGrow: 1 }}>ICEP.</Typography><Button color="inherit" component={Link} to="/careers">Careers</Button><Button color="inherit" component={Link} to="/login">Login</Button></Toolbar></AppBar><main className="public-content"><Outlet /></main></> }
export default PublicLayout
