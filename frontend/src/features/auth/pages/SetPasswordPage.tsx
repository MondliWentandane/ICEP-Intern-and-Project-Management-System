import { Button, Stack, TextField, Typography } from '@mui/material'

export function SetPasswordPage() {
  return (
    <Stack className="auth-card" component="form" spacing={2}>
      <Typography variant="h4" component="h1">Create your password</Typography>
      <Typography color="text.secondary">Choose a secure password for your ICEP account.</Typography>
      <TextField label="New password" type="password" autoComplete="new-password" />
      <TextField label="Confirm password" type="password" autoComplete="new-password" />
      <Button variant="contained" size="large">Save and continue</Button>
    </Stack>
  )
}
