import { useState } from 'react'
import { Alert, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material'
import { Eye, EyeOff } from 'lucide-react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Auth } from '@/api/services/auth.service'

import { ArrowLeftCircleIcon } from '@/components/ui/ArrowLeftCircleIcon'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})
type LoginValues = z.infer<typeof loginSchema>

const dashboardPaths = {
  ADMIN: '/admin/dashboard',
  WIL_HANDLER: '/handler/dashboard',
  MENTOR: '/mentor/dashboard',
  INTERN: '/intern/project'
} as const

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  // Back to the previous page in the app; opened directly (e.g. from an email link) there is none, so go home.
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))
  const [requestError, setRequestError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setRequestError('')
    try {
      const data = await Auth.login(values)
      setSession(data.token, data.user)
      navigate(dashboardPaths[data.user.role.toUpperCase() as keyof typeof dashboardPaths], { replace: true })
    } catch {
      setRequestError('Incorrect email or password. Please try again.')
    }
  })

  return (
    <Stack className="auth-form auth-login-form" component="form" spacing={0} onSubmit={onSubmit} noValidate>
      <button type="button" className="auth-back alc-trigger" onClick={goBack} aria-label="Go back"><ArrowLeftCircleIcon size={22} /><span>Back</span></button>
      <Stack className="auth-login-main" spacing={0}>
        <Typography className="auth-heading" component="h1">Login</Typography>
        {requestError && <Alert severity="error" role="alert">{requestError}</Alert>}
        <TextField className="auth-field" variant="outlined" placeholder="Email" type="email" autoComplete="email" {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message} slotProps={{ htmlInput: { 'aria-label': 'Email' } }} />
        <TextField
          className="auth-field"
          variant="outlined"
          placeholder="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          {...register('password')}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          slotProps={{
            htmlInput: { 'aria-label': 'Password' },
            input: {
              endAdornment: <InputAdornment position="end">
                <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} edge="end" size="small"><span className="password-visibility-icon">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</span></IconButton>
                <Link className="auth-forgot-link" component={RouterLink} to="/forgot-password">Forgot password?</Link>
              </InputAdornment>
            },
          }}
        />
        <Button className="auth-submit" type="submit" fullWidth disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Login'}</Button>
      </Stack>
      <Stack className="auth-login-footer" direction="row" spacing={0}>
        <span>Don&apos;t have an account?</span>
        <Link className="auth-footer-link" component={RouterLink} to="/careers">Apply here</Link>
      </Stack>
    </Stack>
  )
}
export default LoginPage
