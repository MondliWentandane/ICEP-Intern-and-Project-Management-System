import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Alert, Box, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { Check, ClipboardCheck, LogIn, Mail, X } from 'lucide-react'
import { FormProvider, useWatch } from 'react-hook-form'
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import icepLogo from '@/assets/icep-logo.png'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/features/public-site/components/LinkButton'
import { fetchPositions } from '@/features/public-site/data/positions'
import { stepFields } from '../data/applicationSchema'
import { startTrackSession } from '../data/applications'
import { submitApplication, type SubmittedApplication } from '../data/submitApplication'
import { useApplicationForm } from '../hooks/useApplicationForm'
import { ApplicationStepper } from './ApplicationStepper'
import { DocumentsStep, PersonalStep, PositionPicker, ReviewStep, StudiesStep } from './ApplicationSteps'
import { HelpLine } from './FormBits'
import { applicationStepNames } from './steps'

/** URL search param that opens the application pop-up: ?apply=<positionId>, or ?apply=choose to pick a position in the form. */
export const APPLY_PARAM = 'apply'
export const CHOOSE_POSITION = 'choose'

const stepCopy = [
  { title: 'Personal details', subtitle: 'Tell us a little about yourself. All fields are required.' },
  { title: 'Your studies', subtitle: 'Tell us your academic details and the skills you bring. Everything except skills is required.' },
  { title: 'Supporting documents', subtitle: 'Attach clear, readable copies of your ID and academic record. Both are required.' },
  { title: 'Review your application', subtitle: 'Check your details before submitting. Use Edit to make any changes.' },
]
const lastStep = stepCopy.length - 1

/** Mounted once in the public layout; renders the pop-up whenever the URL has ?apply=… */
export function ApplicationDialog() {
  const [params] = useSearchParams()
  const target = params.get(APPLY_PARAM)
  if (!target) return null
  // key: switching to a different position starts a fresh form.
  return <ApplicationDialogBody key={target} target={target} />
}

function ApplicationDialogBody({ target }: { target: string }) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const location = useLocation()
  const fixedPositionId = target === CHOOSE_POSITION ? undefined : target
  const { data: positions = [], isLoading, isError, refetch } = useQuery({ queryKey: ['public', 'positions'], queryFn: fetchPositions })
  const form = useApplicationForm(fixedPositionId)
  const selectedId = useWatch({ control: form.control, name: 'positionId' })
  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null)
  const unsaved = form.formState.isDirty && !submitted

  // Any navigation that would close the pop-up with unsaved answers (close button, Esc, back button, links) asks first.
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    unsaved && (nextLocation.pathname !== currentLocation.pathname || new URLSearchParams(nextLocation.search).get(APPLY_PARAM) !== target))
  useEffect(() => {
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  const close = () => {
    const next = new URLSearchParams(location.search)
    next.delete(APPLY_PARAM)
    const search = next.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
  }

  const scrollTop = () => document.getElementById('application-dialog-content')?.scrollTo({ top: 0 })
  const goTo = (next: number) => { setStep(next); scrollTop() }
  const continueToNext = async () => {
    if (await form.trigger(stepFields[step], { shouldFocus: true })) goTo(step + 1)
  }

  const fixedPosition = fixedPositionId ? positions.find((item) => item.id === fixedPositionId) : undefined
  const position = fixedPosition ?? positions.find((item) => item.id === selectedId)

  const submit = form.handleSubmit(async (values) => {
    if (!position) return
    setSubmitError('')
    try {
      setSubmitted(await submitApplication(values, position))
      scrollTop()
    } catch {
      setSubmitError('We could not submit your application. Check your connection and try again.')
    }
  }, () => {
    // Something on an earlier step became invalid; jump to the first step with an error.
    const errors = form.formState.errors
    const firstInvalid = stepFields.findIndex((fields) => fields.some((field) => errors[field]))
    if (firstInvalid >= 0 && firstInvalid !== step) goTo(firstInvalid)
  })

  // Enter in a text field moves forward instead of submitting the whole application early.
  const onSubmit = (event: FormEvent) => {
    if (step < lastStep) { event.preventDefault(); void continueToNext(); return }
    void submit(event)
  }

  const unavailable = !isLoading && !isError && ((fixedPositionId && !fixedPosition) || positions.length === 0)
  const { isSubmitting } = form.formState

  let body: ReactNode
  let actions: ReactNode
  if (isLoading) {
    body = <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress aria-label="Loading positions" /></Box>
  } else if (isError || unavailable) {
    body = (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{isError ? "We couldn't load open positions" : fixedPositionId ? 'This position is not open for applications' : 'No open positions right now'}</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>{isError ? 'Check your connection and try again.' : 'Browse the careers page to find a WIL placement that is open.'}</Typography>
      </Box>
    )
    actions = <>
      <Button appearance="secondary" onClick={close}>Close</Button>
      {isError ? <Button onClick={() => void refetch()}>Try again</Button> : <LinkButton to="/careers">Browse positions</LinkButton>}
    </>
  } else if (submitted) {
    body = <SubmittedView application={submitted} />
    actions = <>
      <LinkButton to="/careers" appearance="secondary">Back to careers</LinkButton>
      <LinkButton to={`/track/${submitted.reference}`} onClick={() => startTrackSession({ email: submitted.email, reference: submitted.reference })}>Track application</LinkButton>
    </>
  } else {
    body = (
      <>
        {fixedPosition || step > 0
          ? position && <Typography sx={{ color: 'text.secondary' }}>Applying for · <Box component="strong" sx={{ color: 'text.primary' }}>{position.title} · {position.campus}</Box></Typography>
          : <PositionPicker positions={positions} />}
        <Box sx={{ my: 3 }}><ApplicationStepper activeStep={step} /></Box>
        <Divider sx={{ mb: 3 }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '.03em' }}>Step {step + 1} of 4</Typography>
        <Typography id="step-title" component="h3" sx={{ fontSize: 20, fontWeight: 700, mt: 0.5 }}>{stepCopy[step].title}</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>{stepCopy[step].subtitle}</Typography>
        {submitError && <Alert severity="error" sx={{ mb: 2.5 }}>{submitError}</Alert>}
        {step === 0 && <PersonalStep />}
        {step === 1 && <StudiesStep />}
        {step === 2 && <DocumentsStep />}
        {step === 3 && position && <ReviewStep position={position} onEdit={goTo} />}
        <HelpLine />
      </>
    )
    actions = <>
      {step === 0
        ? <Button type="button" appearance="secondary" onClick={close}>Cancel</Button>
        : <Button type="button" appearance="secondary" onClick={() => goTo(step - 1)} disabled={isSubmitting}>Back</Button>}
      {step < lastStep
        ? <Button type="button" onClick={() => void continueToNext()}>Continue</Button>
        : <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit application'}</Button>}
    </>
  }

  return (
    <>
      <Dialog open onClose={close} fullScreen={fullScreen} fullWidth maxWidth="md" scroll="paper" aria-labelledby="application-dialog-title"
        slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3, bgcolor: 'var(--icep-page)' } } }}>
        <DialogTitle id="application-dialog-title" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
          <img src={icepLogo} alt="" aria-hidden="true" style={{ height: 38, width: 'auto' }} />
          <Typography component="h2" sx={{ flex: 1, fontSize: { xs: 18, sm: 21 }, fontWeight: 750 }}>{submitted ? 'Application submitted' : 'Apply for a WIL placement'}</Typography>
          <IconButton aria-label="Close application" onClick={close} edge="end"><X size={22} /></IconButton>
        </DialogTitle>
        <FormProvider {...form}>
          <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <DialogContent id="application-dialog-content" sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>{body}</DialogContent>
            {actions && <DialogActions sx={{ justifyContent: 'space-between', gap: 1.5, px: { xs: 2, sm: 4 }, py: 2, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>{actions}</DialogActions>}
          </Box>
        </FormProvider>
      </Dialog>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} aria-labelledby="discard-title" maxWidth="xs">
        <DialogTitle id="discard-title">Discard your application?</DialogTitle>
        <DialogContent><DialogContentText>Your answers and uploaded documents will be lost.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button appearance="secondary" onClick={() => blocker.reset?.()}>Keep editing</Button>
          <Button appearance="danger" onClick={() => blocker.proceed?.()}>Discard</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function NextStep({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Box component="li" sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ color: 'primary.main', display: 'grid', mt: 0.25 }}>{icon}</Box>
      <Box><Typography sx={{ fontSize: 15 }}>{title}</Typography><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{text}</Typography></Box>
    </Box>
  )
}

function SubmittedView({ application }: { application: SubmittedApplication }) {
  const submittedOn = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(application.submittedAt))
  return (
    <Box>
      <Typography sx={{ color: 'text.secondary' }}>Applying for · <Box component="strong" sx={{ color: 'text.primary' }}>{application.positionTitle} · {application.campus}</Box></Typography>
      <Box sx={{ my: 3 }}><ApplicationStepper activeStep={applicationStepNames.length} /></Box>
      <Box sx={{ textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 1 }} role="status">
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'var(--icep-active-tint)', color: 'success.main' }}><Check size={28} aria-hidden="true" /></Box>
        <Typography component="h3" sx={{ fontSize: 22, fontWeight: 700, mt: 1 }}>Thank you, {application.firstName}</Typography>
        <Typography sx={{ color: 'text.secondary' }}>Your application for {application.positionTitle} at {application.campus} has been received.</Typography>
        <Chip label="Submission complete" size="small" sx={{ bgcolor: 'var(--icep-completed-tint)', color: '#1D4ED8', fontWeight: 600 }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2.5, mt: 3, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Application reference</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 750, color: 'primary.main' }}>{application.reference}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Submitted on {submittedOn}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Confirmation sent to</Typography>
          <Typography sx={{ fontSize: 15, overflowWrap: 'anywhere' }}>{application.email}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Keep your reference number for future enquiries.</Typography>
        </Box>
      </Box>
      <Typography component="h4" sx={{ fontWeight: 700, fontSize: 17, mt: 3, mb: 2 }}>What happens next?</Typography>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2 }}>
        <NextStep icon={<ClipboardCheck size={20} />} title="We review your application" text="The ICEP placement team will assess your details, skills and supporting documents." />
        <NextStep icon={<Mail size={20} />} title="Watch your inbox" text="We will email you about your application outcome and any next steps." />
        <NextStep icon={<LogIn size={20} />} title="Track your application" text="Use Track application at the top of any page with your email address and this reference number. No need to apply again." />
      </Box>
      <HelpLine />
    </Box>
  )
}
