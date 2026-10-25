import type { ReactNode } from 'react'
import { Box, Breadcrumbs, Button as MuiButton, Chip, Divider, Link, Paper, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { Check, CircleCheck, FileText, Mail } from 'lucide-react'
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import { TableError, TableLoading } from '@/components/data/TableStates'
import { LinkButton } from '@/features/public-site/components/LinkButton'
import { PlacementLetterCard } from '@/features/placement-letter/PlacementLetterCard'
import { introSx, useEntrance } from '@/features/public-site/story/motion'
import { RevealTitle } from '@/features/public-site/story/Reveal'
import { HelpLine } from '../components/FormBits'
import { endTrackSession, findApplication, readTrackSession, stageOrder, type ApplicationStage, type TrackedApplication } from '../data/applications'

const longDate = (iso: string) => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
const dateTime = (iso: string) => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
const cardSx = { p: { xs: 2.5, md: 3.5 }, borderRadius: 3, boxShadow: '0 2px 10px rgba(26,32,44,.06)' } as const

// Entrance motion, in the same style as the home page (fade-up cards, word-reveal title, steps that build up).
const ease = 'cubic-bezier(.2,.8,.2,1)'
const popIn = keyframes`
  from { opacity: 0; transform: scale(.6); }
  to { opacity: 1; transform: none; }
`
const drawDown = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(27,58,92,.28); }
  70%, 100% { box-shadow: 0 0 0 10px rgba(27,58,92,0); }
`
const noMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }
/** When timeline step `index` starts to appear (ms after the timeline comes into view). */
const stepDelay = (base: number, index: number) => base + index * 220
const hidden = { opacity: 0, '@media (prefers-reduced-motion: reduce)': { opacity: 1 } }

/**
 * Fades its content up when it comes on screen (staggered on landing, straight away when scrolled to),
 * then dims slightly while off screen and eases back when scrolled to again, in either direction.
 */
function Entrance({ delay, children }: { delay: number; children: ReactNode }) {
  const { ref, sx } = useEntrance<HTMLDivElement>(delay, { replay: true })
  return <Box ref={ref} sx={sx}>{children}</Box>
}

const stageLabels: Record<ApplicationStage, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  outcome: 'Outcome decided',
  placement: 'Placement next steps',
}

function stageText(stage: ApplicationStage, application: TrackedApplication) {
  const placement = application.outcome === 'accepted' ? application.placement : undefined
  if (placement && stage === 'outcome') return `You were accepted for a WIL placement on ${longDate(placement.acceptedAt)}.`
  if (placement && stage === 'placement') {
    const period = placement.startDate && placement.endDate ? ` from ${longDate(placement.startDate)} to ${longDate(placement.endDate)}` : ''
    return `Your WIL placement letter has been issued. You'll be placed at the ${application.campus} campus${period}; your mentor will be introduced when you start.`
  }
  if (application.outcome === 'rejected' && stage === 'outcome') {
    return "Thank you for applying. Unfortunately your application was not successful this time. You're welcome to apply again in a future intake."
  }
  if (application.interview && !application.outcome && stage === 'outcome') {
    const venue = application.interview.venue ? ` at ${application.interview.venue}` : ''
    return `You've been invited to an interview on ${dateTime(application.interview.at)}${venue}. Please check your email for the details.`
  }
  switch (stage) {
    case 'submitted': return `We received your application on ${longDate(application.submittedAt)}.`
    case 'under_review': return 'The ICEP placement team is assessing your details, skills and supporting documents.'
    case 'outcome': return "We'll email you whether you've been selected for an interview or a placement."
    case 'placement': return "If you're successful, you'll receive your start date, campus and mentor details."
  }
}

function Timeline({ application }: { application: TrackedApplication }) {
  // Not successful: the process ends at the outcome, so the placement step is not shown.
  const stages = application.outcome === 'rejected' ? stageOrder.filter((stage) => stage !== 'placement') : stageOrder
  // Once decided (accepted or not), every remaining step is complete.
  const current = application.outcome ? stages.length : stages.indexOf(application.stage)
  // The steps build up once the timeline is on screen (after the cards above when it is visible on landing).
  const { ref, delay } = useEntrance<HTMLOListElement>(650)
  const started = delay !== null
  const at = (index: number) => stepDelay(delay ?? 0, index)
  return (
    <Box ref={ref} component="ol" aria-label="Application progress" sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {stages.map((stage, index) => {
        const done = index < current
        const active = index === current
        const last = index === stages.length - 1
        return (
          <Box component="li" key={stage} aria-current={active ? 'step' : undefined} sx={{ display: 'grid', gridTemplateColumns: '32px 1fr', columnGap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 32px',
                bgcolor: done ? 'primary.main' : '#fff', color: done ? '#fff' : active ? 'primary.main' : 'text.secondary',
                border: '2px solid', borderColor: done || active ? 'primary.main' : 'divider',
                // The step in progress keeps a soft pulsing ring once it has popped in.
                ...(started ? {
                  animation: active
                    ? `${popIn} .5s ${ease} ${at(index)}ms both, ${pulse} 2.2s ease-out ${at(index) + 500}ms infinite`
                    : `${popIn} .5s ${ease} ${at(index)}ms both`,
                } : { opacity: 0 }),
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1, boxShadow: active ? '0 0 0 4px rgba(27,58,92,.12)' : 'none' },
              }}>
                {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : index + 1}
              </Box>
              {!last && (
                <Box sx={{ width: 2, flex: 1, minHeight: 24, my: 0.5, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  {/* Completed links draw down to the next step, like the home page's How it works. */}
                  {done && <Box sx={{
                    width: '100%', height: '100%', bgcolor: 'primary.main', transformOrigin: 'top',
                    ...(started ? { animation: `${drawDown} .45s ${ease} ${at(index) + 250}ms both` } : { transform: 'scaleY(0)' }),
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'none' },
                  }} />}
                </Box>
              )}
            </Box>
            <Box sx={{ pb: last ? 0 : 3, pt: 0.5, ...(started ? introSx(at(index) + 80) : hidden) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography component="h3" sx={{ fontWeight: 700, color: done || active ? 'text.primary' : 'text.secondary' }}>{stageLabels[stage]}</Typography>
                {done && <Chip size="small" label="Done" sx={{ height: 20, fontSize: 12, bgcolor: 'var(--icep-active-tint)', color: '#166534' }} />}
                {active && <Chip size="small" label="In progress" sx={{ height: 20, fontSize: 12, bgcolor: 'var(--icep-pending-tint)', color: '#92400E' }} />}
                {!done && !active && <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>Pending</Typography>}
              </Box>
              <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.25 }}>{stageText(stage, application)}</Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: { xs: 0.25, sm: 2 }, py: 1.5, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ fontSize: 15, overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
  )
}

export function TrackApplicationPage() {
  const { reference = '' } = useParams<{ reference: string }>()
  const navigate = useNavigate()
  const session = readTrackSession()
  const signedIn = Boolean(session && session.reference.toLowerCase() === reference.toLowerCase())
  const { data: application, isLoading, isError, refetch } = useQuery({
    queryKey: ['track', reference, session?.email],
    queryFn: () => findApplication(session!.email, reference),
    enabled: signedIn,
  })

  // Tracking needs the email + reference check first; send people to the track login with the reference filled in.
  if (!signedIn) return <Navigate to={`/track?reference=${encodeURIComponent(reference)}`} replace />
  if (isLoading) return <TableLoading />
  if (isError) return <TableError message="We couldn't load your application" onRetry={() => void refetch()} />
  if (!application) return <Navigate to={`/track?reference=${encodeURIComponent(reference)}`} replace />

  const signOut = () => { endTrackSession(); navigate('/track', { replace: true }) }
  const accepted = application.outcome === 'accepted' && application.placement
  const rejected = application.outcome === 'rejected'
  const interviewing = Boolean(application.interview) && !application.outcome
  const statusTitle = accepted ? 'Accepted' : rejected ? 'Not successful' : interviewing ? 'Interview scheduled' : stageLabels[application.stage]

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: 13 }}>
            <Link component={RouterLink} to="/careers" underline="hover" color="primary">Careers</Link>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Track application</Typography>
          </Breadcrumbs>
          <RevealTitle component="h1" text="Track application" delay={100} sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 750, mt: 0.5 }} />
          <Typography sx={{ color: 'text.secondary', ...introSx(250) }}>Reference <Box component="strong" sx={{ color: 'primary.main' }}>{application.reference}</Box></Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'right', ...introSx(300) }}>
          Signed in as <strong>{application.email}</strong><br />
          <Link component="button" type="button" onClick={signOut} underline="hover" sx={{ fontSize: 13 }}>Not you? Sign out</Link>
        </Typography>
      </Box>

      <Entrance delay={350}>
      <Paper component="section" aria-labelledby="status-title" sx={{ ...cardSx, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Current status</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
            <Typography id="status-title" component="h2" sx={{ fontSize: 24, fontWeight: 750 }}>{statusTitle}</Typography>
            {accepted
              ? <Chip size="small" label="Placement confirmed" sx={{ bgcolor: 'var(--icep-active-tint)', color: '#166534', fontWeight: 600, animation: `${popIn} .5s ${ease} 700ms both`, ...noMotion }} />
              : rejected
                ? <Chip size="small" label="Closed" sx={{ bgcolor: 'var(--icep-rejected-tint)', color: '#B91C1C', fontWeight: 600 }} />
                : interviewing
                  ? <Chip size="small" label={application.interview ? dateTime(application.interview.at) : 'Interview'} sx={{ bgcolor: 'var(--icep-completed-tint)', color: '#1D4ED8', fontWeight: 600 }} />
                  : <Chip size="small" label="In progress" sx={{ bgcolor: 'var(--icep-pending-tint)', color: '#92400E', fontWeight: 600 }} />}
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>Last updated {longDate(application.updatedAt)}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'var(--icep-page)', border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>WIL placement</Typography>
          <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{application.positionTitle}</Typography>
          <Typography sx={{ fontSize: 13 }}>ICEP · {application.campus} Campus · Submitted {longDate(application.submittedAt)}</Typography>
        </Box>
      </Paper>
      </Entrance>

      {accepted && application.placement && (
        <Entrance delay={500}><PlacementLetterCard sx={{
          ...cardSx, border: '1px solid', borderColor: 'var(--icep-active)',
          // Small pop on the letter icon so the new document catches the eye.
          '& > div > div:first-of-type': { animation: `${popIn} .55s ${ease} 900ms both`, ...noMotion },
        }} details={{
          ...application.placement,
          fullName: `${application.firstName} ${application.surname}`,
          reference: application.reference,
          positionTitle: application.positionTitle,
          campus: application.campus,
          issuedAt: application.placement.acceptedAt,
        }} /></Entrance>
      )}

      <Entrance delay={accepted ? 600 : 500}>
      <Paper component="section" aria-labelledby="progress-title" sx={cardSx}>
        <Typography id="progress-title" component="h2" sx={{ fontSize: 19, fontWeight: 700, mb: 2.5 }}>Progress</Typography>
        <Timeline application={application} />
      </Paper>
      </Entrance>

      <Entrance delay={accepted ? 750 : 650}>
      <Paper component="section" aria-labelledby="summary-title" sx={cardSx}>
        <Typography id="summary-title" component="h2" sx={{ fontSize: 19, fontWeight: 700 }}>Submission summary</Typography>
        <Divider sx={{ mt: 1.5 }} />
        <SummaryRow label="Applicant">{application.firstName} {application.surname}</SummaryRow>
        <SummaryRow label="Documents">
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 0.75 }}>
            {application.documents.map((document) => (
              <Box component="li" key={document} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={16} aria-hidden="true" /> {document} <CircleCheck size={16} color="#16A34A" aria-label="received" />
              </Box>
            ))}
          </Box>
        </SummaryRow>
        <SummaryRow label="Confirmation sent to"><Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}><Mail size={16} aria-hidden="true" />{application.email}</Box></SummaryRow>
        <Divider sx={{ mb: 2.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
          <LinkButton to="/careers" appearance="secondary">Back to careers</LinkButton>
          <MuiButton variant="contained" href={`mailto:icep@tut.ac.za?subject=${encodeURIComponent(`Application ${application.reference}`)}`} sx={{ minHeight: 40, px: 2.25, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}>Contact placement team</MuiButton>
        </Box>
      </Paper>
      </Entrance>
      <Entrance delay={850}><HelpLine /></Entrance>
    </Box>
  )
}

export default TrackApplicationPage
