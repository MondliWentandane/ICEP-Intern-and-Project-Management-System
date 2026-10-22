import { useState } from 'react'
import { Alert, Box, Link, Paper, Tooltip, Typography } from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleHelp, MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { FormField, HelpLine } from '../components/FormBits'
import { findApplication, requestSignInLink, startTrackSession } from '../data/applications'
import { RevealTitle } from '@/features/public-site/story/Reveal'
import { introSx } from '@/features/public-site/story/motion'
import { riseSx, useReveal } from '@/features/public-site/story/useScrollProgress'

const navy = '#1E3A5F'

const lookupSchema = z.object({
  email: z.string().trim().email('Enter the email address you applied with.'),
  reference: z.string().trim().regex(/^ICEP-\d{4}-\d{4,6}$/i, 'Enter your reference number, e.g. ICEP-2026-01428.'),
})
const linkSchema = lookupSchema.pick({ email: true })
type LookupValues = z.infer<typeof lookupSchema>
type LinkValues = z.infer<typeof linkSchema>

const cardSx = { p: { xs: 3, md: 5 }, borderRadius: 3, boxShadow: '0 2px 10px rgba(26,32,44,.06)' } as const

function LookupForm({ onLostReference }: { onLostReference: () => void }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [notFound, setNotFound] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { email: '', reference: params.get('reference') ?? '' },
  })
  
  const onSubmit = handleSubmit(async ({ email, reference }) => {
    setNotFound(false)
    const application = await findApplication(email, reference)
    if (!application) { setNotFound(true); return }
    startTrackSession({ email: application.email, reference: application.reference })
    navigate(`/track/${application.reference}`)
  })
  
  return (
    <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'grid', gap: 3 }}>
      {notFound && <Alert severity="error" role="alert" sx={introSx(450)}>We couldn't find an application with that email address and reference number. Check both and try again.</Alert>}
      
      <Box sx={introSx(500)}>
        <FormField 
          id="track-email" 
          label="Email address" 
          placeholder="name@example.com" 
          type="email" 
          autoComplete="email" 
          registration={register('email')} 
          errorText={errors.email?.message} 
        />
      </Box>
      <Box sx={introSx(600)}>
        <FormField 
          id="track-reference" 
          label={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              Reference number
              <Tooltip title="You'll find it in your confirmation email and on the page shown after you applied." placement="top" arrow>
                <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', cursor: 'help' }}>
                  <CircleHelp size={15} aria-label="Help with reference number" />
                </Box>
              </Tooltip>
            </Box>
          } 
          placeholder="ICEP-2026-01428" 
          autoComplete="off" 
          registration={register('reference')} 
          errorText={errors.reference?.message}
        />
        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary', mr: 0.5 }}>
            Lost your reference number?
          </Typography>
          <Link component="button" type="button" onClick={onLostReference} underline="hover" sx={{ fontSize: 13, fontWeight: 600 }}>
            Email me a sign-in link
          </Link>
        </Box>
      </Box>
      <Box sx={introSx(700)}>
        <Button type="submit" fullWidth disabled={isSubmitting} sx={{ minHeight: 48 }}>{isSubmitting ? 'Checking…' : 'Track'}</Button>
      </Box>
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
        <Box sx={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'var(--icep-active-tint)', color: 'success.main', ...introSx(100) }}>
          <MailCheck size={24} aria-hidden="true" />
        </Box>
        <RevealTitle component="h2" text="Check your email" delay={200} sx={{ fontSize: 20, fontWeight: 700, mt: 1, color: navy }} />
        <Typography sx={{ color: 'text.secondary', ...introSx(400) }}>
          If an application matches <strong>{sentTo}</strong>, we've sent a sign-in link and your reference number. The link expires in 30 minutes.
        </Typography>
        <Alert severity="info" sx={{ mt: 1, textAlign: 'left', ...introSx(500) }}>Demo: emails are not sent until the backend is connected.</Alert>
        <Link component="button" type="button" onClick={onBack} underline="hover" sx={{ mt: 1, ...introSx(600) }}>
          Back to track with reference number
        </Link>
      </Box>
    )
  }
  return (
    <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'grid', gap: 3 }}>
      <Typography sx={{ color: 'text.secondary', ...introSx(450) }}>
        Enter the email address you applied with and we'll send you a one-time sign-in link.
      </Typography>
      
      <Box sx={introSx(550)}>
        <FormField 
          id="link-email" 
          label="Email address" 
          placeholder="name@example.com" 
          type="email" 
          autoComplete="email" 
          registration={register('email')} 
          errorText={errors.email?.message} 
        />
      </Box>
      <Box sx={introSx(650)}>
        <Button type="submit" fullWidth disabled={isSubmitting} sx={{ minHeight: 48 }}>{isSubmitting ? 'Sending…' : 'Email me a sign-in link'}</Button>
      </Box>
      
      <Box sx={{ textAlign: 'center', ...introSx(750) }}>
        <Link component="button" type="button" onClick={onBack} underline="hover" sx={{ fontSize: 14 }}>
          I have my reference number
        </Link>
      </Box>
    </Box>
  )
}

export function TrackLoginPage() {
  const [mode, setMode] = useState<'reference' | 'link'>('reference')
  const { ref, p } = useReveal<HTMLDivElement>()

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto' }}>
      <Paper ref={ref} component="section" aria-labelledby="track-title" sx={{ ...cardSx, ...riseSx(p, 0) }}>
        <RevealTitle 
          id="track-title" 
          component="h1" 
          text="Track your application" 
          delay={150} 
          sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 750, color: navy }} 
        />
        <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 3, ...introSx(350) }}>
          Check your application progress using your email and reference number.
        </Typography>
        
        {mode === 'reference' ? <LookupForm onLostReference={() => setMode('link')} /> : <SignInLinkForm onBack={() => setMode('reference')} />}
      </Paper>
      
      <Box sx={{ mt: 3, ...introSx(900) }}>
        <HelpLine />
      </Box>
    </Box>
  )
}

export default TrackLoginPage