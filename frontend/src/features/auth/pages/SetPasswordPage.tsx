import { useState } from 'react'
import { Alert, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material'
import { Eye, EyeOff } from 'lucide-react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Auth } from '@/api/services/auth.service'
import { Button } from '@/components/ui/Button'

const passwordSchema = z.object({
  password: z.string().min(8, 'Min 8 characters, 1 number, 1 capital letter').regex(/[0-9]/, 'Min 8 characters, 1 number, 1 capital letter').regex(/[A-Z]/, 'Min 8 characters, 1 number, 1 capital letter'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
type PasswordValues = z.infer<typeof passwordSchema>

export function SetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [complete, setComplete] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!token) { setRequestError('This password setup link is invalid. Ask your administrator for a new invitation.'); return }
    setRequestError('')
    try { await Auth.createPassword(token, password); setComplete(true) }
    catch { setRequestError('We could not set your password. The link may have expired; ask for a new one and try again.') }
  })

  const visibilityAdornment = (visible: boolean, toggle: () => void, label: string) => <InputAdornment position="end"><IconButton aria-label={visible ? `Hide ${label}` : `Show ${label}`} onClick={toggle} edge="end" size="small"><span className="password-visibility-icon">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</span></IconButton></InputAdornment>

  return (
    <Stack className="auth-form auth-create-password-form" component="form" spacing={0} onSubmit={onSubmit} noValidate>
      {complete ? <>
        <Typography className="auth-heading" component="h1">Password set!</Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>Your ICEP account is ready. You can now sign in with your new password.</Typography>
        <Button className="auth-submit" type="button" onClick={() => navigate('/login')} fullWidth>Continue to Login</Button>
      </> : <>
        <Typography className="auth-heading" component="h1">Create your password</Typography>
        <Typography className="auth-subtitle">Welcome to ICEP! Set a password to<br className="desktop-break" /> activate your account.</Typography>
        {requestError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{requestError}</Alert>}
        <TextField className="auth-field auth-password-field" variant="outlined" placeholder="New Password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password')} error={Boolean(errors.password)} helperText={errors.password?.message} slotProps={{ htmlInput: { 'aria-label': 'New Password' }, input: { endAdornment: visibilityAdornment(showPassword, () => setShowPassword((v) => !v), 'password') } }} />
        <TextField className="auth-field auth-password-field" variant="outlined" placeholder="Confirm Password" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" {...register('confirmPassword')} error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword?.message} slotProps={{ htmlInput: { 'aria-label': 'Confirm Password' }, input: { endAdornment: visibilityAdornment(showConfirmation, () => setShowConfirmation((v) => !v), 'password') } }} />
        <Typography className="auth-password-helper">Min 8 characters, 1 number, 1 capital letter</Typography>
        <Button className="auth-submit auth-password-submit" type="submit" fullWidth disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save & Continue'}</Button>
        <Link component={RouterLink} to="/login" underline="hover" sx={{ textAlign: 'center', mt: 2 }}>Back to Login</Link>
      </>}
    </Stack>
  )
}
export default SetPasswordPage