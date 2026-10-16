import { useState } from 'react'
import { Alert, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Auth } from '@/api/services/auth.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'

const emailSchema = z.object({ email: z.string().trim().email('Enter a valid email address.') })
type EmailValues = z.infer<typeof emailSchema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<EmailValues>({ resolver: zodResolver(emailSchema) })

  const sendLink = async (email: string) => {
    setRequestError('')
    try {
      await Auth.forgotPassword(email)
      setSent(true)
    } catch {
      setRequestError('We could not send the reset link. Check your connection and try again.')
    }
  }
  const onSubmit = handleSubmit(({ email }) => sendLink(email))

  return (
    <Stack className="auth-form auth-forgot-form" component="form" spacing={0} onSubmit={onSubmit} noValidate>
      {sent ? <>
        <Typography className="auth-heading" component="h1">Check your email</Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>If an ICEP account matches that address, a password reset link is on its way.</Typography>
        {requestError && <Alert severity="error" role="alert">{requestError}</Alert>}
        <Button type="button" appearance="secondary" fullWidth disabled={isSubmitting} onClick={() => sendLink(getValues('email'))}>{isSubmitting ? 'Sending…' : 'Resend reset link'}</Button>
        <Link component={RouterLink} to="/login" underline="hover" sx={{ textAlign: 'center', mt: 2 }}>Back to Login</Link>
      </> : <>
        <Typography className="auth-heading" component="h1">Forgot password?</Typography>
        <Typography className="auth-subtitle">Enter your email address and we’ll send a reset link.</Typography>
        {requestError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{requestError}</Alert>}
        <Input className="auth-field" label="Email address" type="email" autoComplete="email" {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message} />
        <Button className="auth-submit" type="submit" fullWidth disabled={isSubmitting} sx={{ mt: 4 }}>{isSubmitting ? 'Sending…' : 'Send reset link'}</Button>
        <Link component={RouterLink} to="/login" underline="hover" sx={{ textAlign: 'center', mt: 2 }}>Back to Login</Link>
      </>}
    </Stack>
  )
}
export default ForgotPasswordPage
