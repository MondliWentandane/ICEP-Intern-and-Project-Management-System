import { useState } from 'react'
import { Alert, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Auth } from '@/api/services/auth.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'
import { AuthBackButton } from '../components/AuthBackButton'

// Zod schemas for the two different form steps
const emailSchema = z.object({ email: z.string().trim().email('Enter a valid email address.') })
type EmailValues = z.infer<typeof emailSchema>

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.')
})
type OtpValues = z.infer<typeof otpSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
 
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form handlers
  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) })
  const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema) })

  const onEmailSubmit = async ({ email }: EmailValues) => {
    setRequestError('')
    setSuccessMessage('')
    try {
      await Auth.forgotPassword(email)
      
      setStep('otp')
      setSuccessMessage(`We sent a 6-digit code to ${email}`)
    } catch {
      setRequestError('We could not send the reset code. Check your connection and try again.')
    }
  }

  const onOtpSubmit = async ({ otp, newPassword }: OtpValues) => {
    setRequestError('')
    try {
      await Auth.resetPassword(otp, newPassword)
      navigate('/login', { state: { message: 'Password reset successful. Please log in.' } })
    } catch (error: any) {
      setRequestError(error.response?.data?.message || error.response?.data?.error || 'Invalid or expired OTP.')
    }
  }

  return (
    <Stack className="auth-form auth-forgot-form" component="div" spacing={0}>
      <AuthBackButton fallback="/login" />

      {step === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} noValidate style={{ width: '100%' }}>
          <Typography className="auth-heading" component="h1">Forgot password?</Typography>
          <Typography className="auth-subtitle">Enter your email address and we’ll send a 6-digit reset code.</Typography>

          {requestError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{requestError}</Alert>}

          <Input className="auth-field" label="Email address" type="email" autoComplete="email" {...emailForm.register('email')} error={Boolean(emailForm.formState.errors.email)} helperText={emailForm.formState.errors.email?.message} />
          <Button className="auth-submit" type="submit" fullWidth disabled={emailForm.formState.isSubmitting} sx={{ mt: 4 }}>
            {emailForm.formState.isSubmitting ? 'Sending…' : 'Send reset code'}
          </Button>
          <Link component={RouterLink} to="/login" underline="hover" sx={{ textAlign: 'center', mt: 2, display: 'block' }}>Back to Login</Link>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} noValidate style={{ width: '100%' }}>
          <Typography className="auth-heading" component="h1">Enter Reset Code</Typography>

          {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
          {requestError && <Alert severity="error" role="alert" sx={{ mb: 3 }}>{requestError}</Alert>}

          <Stack spacing={2} sx={{ mb: 4 }}>
            <Input className="auth-field" label="6-Digit Code" type="text" {...otpForm.register('otp')} error={Boolean(otpForm.formState.errors.otp)} helperText={otpForm.formState.errors.otp?.message} />
            <Input className="auth-field" label="New Password" type="password" {...otpForm.register('newPassword')} error={Boolean(otpForm.formState.errors.newPassword)} helperText={otpForm.formState.errors.newPassword?.message} />
          </Stack>

          <Button className="auth-submit" type="submit" fullWidth disabled={otpForm.formState.isSubmitting}>
            {otpForm.formState.isSubmitting ? 'Resetting…' : 'Reset Password'}
          </Button>
          <Button type="button" fullWidth disabled={emailForm.formState.isSubmitting} onClick={() => emailForm.handleSubmit(onEmailSubmit)()} sx={{ mt: 2, border: '1px solid #ccc' }}>
            {emailForm.formState.isSubmitting ? 'Sending...' : 'Resend code'}
          </Button>
        </form>
      )}
    </Stack>
  )
}
export default ForgotPasswordPage