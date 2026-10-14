import { Button, Link, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function ForgotPasswordPage() {
  return (
    <Stack className="auth-card" component="form" spacing={2}>
      <Typography variant="h4" component="h1">Forgot password?</Typography>
      <Typography color="text.secondary">Enter your email address and we’ll send a reset link.</Typography>
      <TextField label="Email address" type="email" autoComplete="email" />
      <Button variant="contained" size="large">Send reset link</Button>
      <Link component={RouterLink} to="/login" align="center">Back to Login</Link>
    </Stack>
  )
}
