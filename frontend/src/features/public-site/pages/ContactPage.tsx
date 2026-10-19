import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert, Box, Button, Container, Paper, TextField, Typography } from '@mui/material'

/**
 * Location: frontend/src/features/public-site/pages/ContactPage.tsx (route /contact already exists in routes/router.tsx)
 * Public page (no app shell, no header/footer). Styling comes from the MUI theme
 * (palette via sx) as described in ICEP_FRONTEND_STYLING_GUIDE.md.
 */

const CAMPUS = {
  name: 'Tshwane University of Technology - Soshanguve South Campus - TUT',
  address: 'Block K, 2 Aubrey Matlakala St, Soshanguve - K, Soshanguve, 0152',
  mapsUrl:
    'https://www.google.com/maps/place/Tshwane+University+of+Technology+-+Soshanguve+South+Campus+-+TUT/@-25.5401753,28.0968938,17z/data=!3m1!4b1!4m6!3m5!1s0x1ebfcf9c4eedb233:0x9e2de5e61f9e48e7!8m2!3d-25.5401753!4d28.0968938!16s%2Fm%2F0dkfwvn?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D' +
    encodeURIComponent('Tshwane University of Technology Soshanguve South Campus'),
}

/* ---------- small inline icons (no extra dependency) ---------- */
const Svg = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
const PinIcon = () => <Svg><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>
const MailIcon = () => <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
const PhoneIcon = () => <Svg><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Svg>
const ExternalIcon = () => <Svg size={18}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Svg>
/* ---------- contact info panel ---------- */
function InfoRow({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
      <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{title}</Typography>
        <Typography component="div" sx={{ color: 'rgba(255,255,255,.85)', fontSize: 16, lineHeight: 1.6 }}>
          {children}
        </Typography>
      </Box>
    </Box>
  )
}

function ContactInfoPanel() {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'primary.main', color: '#fff', borderRadius: 3, p: { xs: 3, md: 4 }, minHeight: 440 }}>
      <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, mb: 4 }}>Contact information</Typography>
      <Box sx={{ display: 'grid', gap: 4, position: 'relative', zIndex: 1 }}>
        <InfoRow icon={<PinIcon />} title="Location">
          02 Aubrey Matlala Road, Block K, Soshanguve<br />
          Building 18, TUT Soshanguve South Campus<br />
          Pretoria, Gauteng<br />
          South Africa
        </InfoRow>
        <InfoRow icon={<MailIcon />} title="Email">admin@icep.co.za</InfoRow>
        <InfoRow icon={<PhoneIcon />} title="Call">012 382 9598</InfoRow>
      </Box>
      {/* decorative circles, bottom right */}
      <Box aria-hidden sx={{ position: 'absolute', right: -60, bottom: -150, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.1)' }} />
      <Box aria-hidden sx={{ position: 'absolute', right: 90, bottom: -150, width: 190, height: 190, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.06)' }} />
    </Box>
  )
}

/* ---------- message form ---------- */
export interface ContactMessage { name: string; email: string; subject: string; message: string }

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' },
}
const labelSx = { fontSize: 16, color: 'text.primary', mb: 1, display: 'block' }

function ContactForm({ onSubmit }: { onSubmit?: (m: ContactMessage) => Promise<void> | void }) {
  const [values, setValues] = useState<ContactMessage>({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactMessage, string>>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const set = (k: keyof ContactMessage) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  const validate = () => {
    const next: typeof errors = {}
    if (!values.name.trim()) next.name = 'Enter your name'
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email address'
    if (!values.subject.trim()) next.subject = 'Enter a subject'
    if (!values.message.trim()) next.message = 'Write a message'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setStatus('sending')
    try {
      await onSubmit?.(values)
      setValues({ name: '', email: '', subject: '', message: '' })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'grid', gap: 2.5, alignContent: 'start' }}>
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <Box>
          <Typography component="label" htmlFor="contact-name" sx={labelSx}>Your name</Typography>
          <TextField id="contact-name" fullWidth placeholder="Enter your name" value={values.name}
            onChange={set('name')} error={!!errors.name} helperText={errors.name} autoComplete="name" sx={fieldSx} />
        </Box>
        <Box>
          <Typography component="label" htmlFor="contact-email" sx={labelSx}>Your email</Typography>
          <TextField id="contact-email" type="email" fullWidth placeholder="name@example.com" value={values.email}
            onChange={set('email')} error={!!errors.email} helperText={errors.email} autoComplete="email" sx={fieldSx} />
        </Box>
      </Box>

      <Box>
        <Typography component="label" htmlFor="contact-subject" sx={labelSx}>Subject</Typography>
        <TextField id="contact-subject" fullWidth placeholder="What is your message about?" value={values.subject}
          onChange={set('subject')} error={!!errors.subject} helperText={errors.subject} sx={fieldSx} />
      </Box>

      <Box>
        <Typography component="label" htmlFor="contact-message" sx={labelSx}>Message</Typography>
        <TextField id="contact-message" fullWidth multiline minRows={7} placeholder="Write your message here"
          value={values.message} onChange={set('message')} error={!!errors.message} helperText={errors.message} sx={fieldSx} />
      </Box>

      {status === 'sent' && <Alert severity="success">Message sent. The ICEP team will get back to you.</Alert>}
      {status === 'error' && <Alert severity="error">Your message was not sent. Check your connection and try again.</Alert>}

      <Box>
        <Button type="submit" variant="contained" disabled={status === 'sending'}
          sx={{ height: 52, px: 4, borderRadius: 2, fontSize: 16, fontWeight: 600 }}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
      </Box>
    </Box>
  )
}

/* ---------- map card ---------- */
function MapCard() {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ position: 'relative', height: { xs: 360, md: 450 }, borderRadius: 3, overflow: 'hidden', bgcolor: '#E8EBF0' }}>
        {/* Stylised map placeholder. Replace with an embedded map when ready. */}
        <svg viewBox="0 0 1100 450" preserveAspectRatio="xMidYMid slice"
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
          <g stroke="#fff" strokeWidth="14" fill="none" strokeLinecap="round">
            <path d="M0 305 L1100 345" />
            <path d="M0 150 L1100 200" strokeWidth="12" />
            <path d="M640 0 L560 450" />
            <path d="M200 0 L170 450" strokeWidth="10" />
            <path d="M920 0 Q950 160 1010 230 L1090 450" />
            <path d="M1180 0 L1200 450" />
          </g>
          <rect x="460" y="68" width="125" height="85" rx="6" fill="#DBEAFE" />
        </svg>
        <Box sx={{ position: 'absolute', left: { xs: '58%', md: '56%' }, top: 56, color: 'primary.main' }}>
          <svg width="36" height="46" viewBox="0 0 24 30" aria-hidden="true">
            <path d="M12 0C5.9 0 1 4.8 1 10.8 1 18.6 12 30 12 30s11-11.4 11-19.2C23 4.8 18.1 0 12 0z" fill="currentColor" />
            <circle cx="12" cy="10.5" r="4" fill="#fff" />
          </svg>
        </Box>

        <Paper elevation={0} sx={{
          position: 'absolute', top: 20, left: 20, maxWidth: { xs: 'calc(100% - 40px)', md: 400 },
          p: 2.5, borderRadius: 3, border: 1, borderColor: 'divider',
        }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3, mb: 1 }}>{CAMPUS.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 15, mb: 1.5 }}>{CAMPUS.address}</Typography>
          <Button component="a" href={CAMPUS.mapsUrl} target="_blank" rel="noopener noreferrer"
            variant="contained" startIcon={<ExternalIcon />}
            sx={{ borderRadius: 2, fontWeight: 600, height: 42 }}>
            Open in Maps
          </Button>
        </Paper>
      </Box>
    </Paper>
  )
}

/* ---------- page ---------- */
export function ContactPage({ onSendMessage }: { onSendMessage?: (m: ContactMessage) => Promise<void> | void }) {
  return (
    <Box component="section" sx={{ color: 'text.primary' }}>
      <Box>
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography component="h1" sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 700, mb: 1.5 }}>Get in touch</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 16, md: 20 } }}>
              Have a question about WIL placements? Send us a message and the ICEP team will get back to you.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 1.5 }, borderRadius: 4, borderColor: 'divider', mb: 4 }}>
            <Box sx={{ display: 'grid', gap: { xs: 3, md: 4 }, gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' } }}>
              <ContactInfoPanel />
              <Box sx={{ p: { xs: 1.5, md: 0 }, pr: { md: 3 }, pt: { md: 3 } }}>
                <ContactForm onSubmit={onSendMessage} />
              </Box>
            </Box>
          </Paper>

          <MapCard />
        </Container>
      </Box>
    </Box>
  )
}

export default ContactPage