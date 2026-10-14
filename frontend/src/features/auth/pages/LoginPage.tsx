import { Button, Link, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function LoginPage() {
  return (
    <Stack className="auth-card" component="form" spacing={2}>
      <Typography variant="h4" component="h1">Welcome back</Typography>
      <Typography color="text.secondary">Sign in to your ICEP account.</Typography>
      <TextField label="Email address" type="email" autoComplete="email" />
      <TextField label="Password" type="password" autoComplete="current-password" />
      <Link component={RouterLink} to="/forgot-password" align="right">Forgot password?</Link>
      <Button variant="contained" size="large">Log in</Button>
    </Stack>
  )
}
