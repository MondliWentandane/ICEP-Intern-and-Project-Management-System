import { useState } from 'react'
import { Alert, Box, Breadcrumbs, Link, Paper, Typography } from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck, SearchCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { FormField, HelpLine } from '../components/FormBits'
import { findApplication, requestSignInLink, startTrackSession } from '../data/applications'

const lookupSchema = z.object({
  email: z.string().trim().email('Enter the email address you applied with.'),
  reference: z.string().trim().regex(/^ICEP-\d{4}-\d{4,8}$/i, 'Enter your reference number, e.g. ICEP-2026-01428.'),
})
const linkSchema = lookupSchema.pick({ email: true })
type LookupValues = z.infer<typeof lookupSchema>
type LinkValues = z.infer<typeof linkSchema>

const cardSx = { p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0 2px 10px rgba(26,32,44,.06)' } as const

function LookupForm({ onLostReference }: { onLostReference: () => void }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [notFound, setNotFound] = useState(false)
  const [failed, setFailed] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { email: '', reference: params.get('reference') ?? '' },
  })
  const onSubmit = handleSubmit(async ({ email, reference }) => {
    setNotFound(false)
    setFailed(false)
    let application
    try { application = await findApplication(email, reference) } catch { setFailed(true); return }
    if (!application) { setNotFound(true); return }
    startTrackSession({ email: application.email, reference: application.reference })
    navigate(`/track/${application.reference}`)
  })
  return (
    <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'grid', gap: 2.5 }}>
      {failed && <Alert severity="error" role="alert">We couldn't check your application right now. Please try again in a moment.</Alert>}
      {notFound && <Alert severity="error" role="alert">We couldn't find an application with that email address and reference number. Check both and try again.</Alert>}
      <FormField id="track-email" label="Email address" type="email" autoComplete="email" registration={register('email')} errorText={errors.email?.message} />
      <FormField id="track-reference" label="Reference number" placeholder="ICEP-2026-01428" autoComplete="off" registration={register('reference')} errorText={errors.reference?.message}
        hint="You'll find it in your confirmation email and on the page shown after you applied." />
      <Button type="submit" fullWidth disabled={isSubmitting} sx={{ minHeight: 48 }}>{isSubmitting ? 'Checking…' : 'Track application'}</Button>
      <Link component="button" type="button" onClick={onLostReference} underline="hover" sx={{ justifySelf: 'center', fontSize: 14 }}>Lost your reference number? Email me a sign-in link</Link>
    </Box>
  )
}

function SignInLinkForm({ onBack }: { onBack: () => void }) {
  const [sentTo, setSentTo] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LinkValues>({ resolver: zodResolver(linkSchema), defaultValues: { email: '' } })
  const onSubmit = handleSubmit(async ({ email }) => { await requestSignInLink(email); setSentTo(email) })

  if (sentTo) {
    return (
      <Box sx={{ textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 1 }} role="status">
        <Box sx={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'var(--icep-active-tint)', color: 'success.main' }}><MailCheck size={24} aria-hidden="true" /></Box>
        <Typography component="h2" sx={{ fontSize: 20, fontWeight: 700, mt: 1 }}>Check your email</Typography>
        <Typography sx={{ color: 'text.secondary' }}>If an application matches <strong>{sentTo}</strong>, we've sent a sign-in link and your reference number. The link expires in 30 minutes.</Typography>
        <Alert severity="info" sx={{ mt: 1, textAlign: 'left' }}>Demo: emails are not sent until the backend is connected.</Alert>
        <Link component="button" type="button" onClick={onBack} underline="hover" sx={{ mt: 1 }}>Back to track with reference number</Link>
      </Box>
    )
  }
  return (
    <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'grid', gap: 2.5 }}>
      <Typography sx={{ color: 'text.secondary' }}>Enter the email address you applied with and we'll send you a one-time sign-in link.</Typography>
      <FormField id="link-email" label="Email address" type="email" autoComplete="email" registration={register('email')} errorText={errors.email?.message} />
      <Button type="submit" fullWidth disabled={isSubmitting} sx={{ minHeight: 48 }}>{isSubmitting ? 'Sending…' : 'Email me a sign-in link'}</Button>
      <Link component="button" type="button" onClick={onBack} underline="hover" sx={{ justifySelf: 'center', fontSize: 14 }}>I have my reference number</Link>
    </Box>
  )
}

export function TrackLoginPage() {
  const [mode, setMode] = useState<'reference' | 'link'>('reference')
  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', py: { xs: 1, md: 3 } }}>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: 13, mb: 1 }}>
        <Link component={RouterLink} to="/careers" underline="hover" color="primary">Careers</Link>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Track application</Typography>
      </Breadcrumbs>
      <Paper component="section" aria-labelledby="track-title" sx={cardSx}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#E4EBF5', color: 'primary.main', mb: 2 }}><SearchCheck size={24} aria-hidden="true" /></Box>
        <Typography id="track-title" component="h1" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 750 }}>Track your application</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>No need to apply again. Check your progress with the details from your confirmation email.</Typography>
        {mode === 'reference' ? <LookupForm onLostReference={() => setMode('link')} /> : <SignInLinkForm onBack={() => setMode('reference')} />}
      </Paper>
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 14, mt: 3 }}>
        Haven't applied yet? <Link component={RouterLink} to="/careers" underline="hover">Browse open positions</Link>
      </Typography>
      <HelpLine />
    </Box>
  )
}

export default TrackLoginPage
