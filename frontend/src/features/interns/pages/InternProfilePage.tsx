import { useState } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Link, Stack, TextField, Typography } from '@mui/material'
import { apiErrorMessage, reinstateInternship } from '@/features/applicants/data/applicationsApi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { Interns } from '@/api/services/interns.service'
import { formatDate, initials } from '@/utils/format'
import { DetailList, EmptyNote, ErrorNotice, LoadingBlock, Panel, SampleNotice, StatusBadge } from '@/features/shared/workspace/parts'
import { sampleInterns } from '@/features/shared/workspace/sample'
import { isPastIntern } from '@/features/shared/workspace/status'
import { useRecord } from '@/features/shared/workspace/useList'
import type { InternDocument, InternView } from '@/features/shared/workspace/types'

/** Readable headings for the document types, in the order they're shown. */
const DOCUMENT_GROUPS: Array<{ type: string; label: string }> = [
  { type: 'CV', label: 'CV' },
  { type: 'ID_COPY', label: 'ID copy' },
  { type: 'ACADEMIC_RECORD', label: 'Academic record' },
  { type: 'MOTIVATION_LETTER', label: 'Motivation letter' },
  { type: 'CERTIFICATE', label: 'Certificates' },
  { type: 'OTHER', label: 'Other documents' },
]
const fileSize = (bytes?: number | null) => (!bytes ? '' : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

/** The intern's documents grouped by type (CV, ID copy, ...), each with its own Download button. */
function DocumentGroups({ internId, documents, canDownload }: { internId: string; documents: InternDocument[]; canDownload: boolean }) {
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const known = new Set(DOCUMENT_GROUPS.map((group) => group.type))
  const groups = DOCUMENT_GROUPS
    .map((group) => ({ ...group, files: documents.filter((doc) => (known.has(doc.type) ? doc.type : 'OTHER') === group.type) }))
    .filter((group) => group.files.length)

  const download = async (doc: InternDocument) => {
    setError('')
    setBusyId(doc.id)
    try {
      await Interns.downloadDocument(internId, doc)
    } catch (err) {
      setError(apiErrorMessage(err, `${doc.fileName} could not be downloaded.`))
    } finally {
      setBusyId('')
    }
  }

  return (
    <Stack spacing={2}>
      {groups.map((group) => (
        <Box key={group.type}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '.04em', mb: 1 }}>{group.label}</Typography>
          <Stack spacing={1}>
            {group.files.map((doc) => (
              <Stack key={doc.id} direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <FileText size={20} aria-hidden />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{doc.fileName}</Typography>
                  {(doc.sizeBytes || doc.uploadedAt) && (
                    <Typography variant="caption" color="text.secondary">
                      {[fileSize(doc.sizeBytes), doc.uploadedAt ? `uploaded ${formatDate(doc.uploadedAt)}` : ''].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>
                {canDownload && (
                  <Button size="small" variant="outlined" startIcon={<Download size={16} />} onClick={() => void download(doc)} disabled={busyId === doc.id} sx={{ flex: 'none' }}
                    aria-label={`Download ${group.label}: ${doc.fileName}`}>
                    {busyId === doc.id ? 'Downloading…' : 'Download'}
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </Box>
      ))}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  )
}

/** Past interns are shown in greys (current interns stay navy) so the two are easy to tell apart. */
const PAST_GREY = { card: '#F1F3F6', avatar: '#A0AEC0', text: '#4A5568', muted: '#718096', panel: '#F8F9FB', border: '#E2E8F0' }
const pastGridSx = {
  '& .MuiPaper-root, & .MuiCard-root': { bgcolor: PAST_GREY.panel, borderColor: PAST_GREY.border },
  '& .MuiTypography-root': { color: PAST_GREY.text },
  '& .MuiChip-root': { filter: 'grayscale(1)' },
} as const

const todayYmd = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())

/** Reinstates an ended internship with a new end date (ended by mistake, or extended): they can log in again. */
function ReinstatePanel({ internId, name }: { internId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    setError('')
    setSaving(true)
    try {
      await reinstateInternship(internId, endDate)
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err, 'The internship could not be reinstated.'))
    } finally {
      setSaving(false)
    }
  }

  if (done) return <Alert severity="success" sx={{ mb: 2 }}>{name} is an active intern again until {formatDate(endDate)} and can log in. They are back on the Interns page.</Alert>
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {!open ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Ended by mistake, or has the internship been extended? Reinstate it with a new end date.</Typography>
            <Button variant="outlined" onClick={() => setOpen(true)} sx={{ flex: 'none' }}>Reinstate internship</Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField type="date" label="New end date" value={endDate} onChange={(event) => setEndDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayYmd() } }} sx={{ maxWidth: 260 }} />
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => { setOpen(false); setError('') }} disabled={saving}>Cancel</Button>
              <Button variant="contained" onClick={() => void submit()} disabled={saving || !endDate}>{saving ? 'Saving…' : 'Reinstate'}</Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export function InternProfilePage() {
  const { internId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const roleBase = '/' + (location.pathname.split('/')[1] ?? 'handler')

  const sample = sampleInterns.find((intern) => intern.id === internId) ?? null
  const { item: intern, loading, failed, usingSample } = useRecord<InternView>(() => Interns.get(internId), sample, [internId])

  // "Back" returns to whichever list the user came from (Interns or Past Interns).
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate(`${roleBase}/interns`))
  const backButton = <Button startIcon={<ArrowLeft size={16} />} onClick={goBack} sx={{ mb: 2 }}>Back</Button>

  if (loading) return <Box>{backButton}<LoadingBlock /></Box>
  if (failed || !intern) {
    return <Box>{backButton}<ErrorNotice message="We could not find or load this intern's profile." /></Box>
  }

  const past = isPastIntern(intern.status)
  // Only ADMIN and WIL_HANDLER can end or reinstate internships (mentors also open this page).
  const canReinstate = roleBase === '/admin' || roleBase === '/handler'
  const supervisor = intern.mentorName ?? intern.supervisor
  const department = intern.department

  return (
    <Box>
      {backButton}
      {usingSample && <SampleNotice />}

      <Card variant="outlined" sx={{ mb: 2, ...(past && { bgcolor: PAST_GREY.card, borderColor: PAST_GREY.border }) }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'center' } }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: past ? PAST_GREY.avatar : 'primary.main', fontSize: 26 }}>{initials(intern.fullName)}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, ...(past && { color: PAST_GREY.text }) }}>{intern.fullName}</Typography>
                {past
                  ? <Chip size="small" label={`Past intern${intern.ending ? ` · ${intern.ending.outcome}` : ''}`} sx={{ fontWeight: 650, bgcolor: '#E2E8F0', color: PAST_GREY.text }} />
                  : <StatusBadge status={intern.status} />}
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {[department, intern.campusName, intern.intakeName].filter(Boolean).join(' · ') || 'ICEP intern'}
              </Typography>
              {intern.email && <Link href={`mailto:${intern.email}`} underline="hover">{intern.email}</Link>}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {past && (
        <Alert severity="info" sx={{ mb: 2, bgcolor: '#EDF0F4', color: PAST_GREY.text, '& .MuiAlert-icon': { color: PAST_GREY.muted } }}>
          Past intern{intern.endDate ? ` · internship ended ${formatDate(intern.endDate)}` : ''}
          {intern.ending ? ` · ${intern.ending.outcome}${intern.ending.reason ? `: ${intern.ending.reason}` : ''}${intern.ending.endedBy ? ` (ended by ${intern.ending.endedBy})` : ''}` : ''}. This profile is read-only history.
        </Alert>
      )}
      {past && canReinstate && !usingSample && <ReinstatePanel internId={intern.id} name={intern.fullName} />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, alignItems: 'start', ...(past && pastGridSx) }}>
        <Stack spacing={2}>
          <Panel title="Personal & academic details">
            <DetailList items={[
              { label: 'Student number', value: intern.studentNumber },
              { label: 'Phone', value: intern.phone },
              { label: 'Institution', value: intern.institution },
              { label: 'Qualification', value: intern.qualification },
              { label: 'Year of study', value: intern.yearOfStudy },
              { label: 'Email', value: intern.email },
            ]} />
          </Panel>

          <Panel title="Internship details">
            <DetailList items={[
              { label: 'Campus', value: intern.campusName },
              { label: 'Intake', value: intern.intakeName },
              { label: 'Department', value: department },
              { label: 'Mentor / supervisor', value: supervisor },
              { label: 'Start date', value: intern.startDate ? formatDate(intern.startDate) : undefined },
              { label: 'End date', value: intern.endDate ? formatDate(intern.endDate) : undefined },
            ]} />
          </Panel>

          <Panel title="Projects">
            {!intern.projects?.length ? <EmptyNote message="Not assigned to any project yet." /> : (
              <Stack spacing={1.5} divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
                {intern.projects.map((project) => (
                  <Stack key={project.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{project.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{project.role ?? 'Team member'} · {project.current ? 'Current' : 'Past'}</Typography>
                    </Box>
                    <StatusBadge status={project.status} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Panel>
        </Stack>

        <Stack spacing={2}>
          <Panel title="Skills">
            {!intern.skills?.length ? <EmptyNote message="No skills recorded." /> : (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {intern.skills.map((skill) => <Chip key={skill} label={skill} size="small" />)}
              </Stack>
            )}
          </Panel>

          <Panel title="Documents">
            {!intern.documents?.length ? <EmptyNote message="No documents uploaded." /> : <DocumentGroups internId={intern.id} documents={intern.documents} canDownload={!usingSample} />}
          </Panel>
        </Stack>
      </Box>
    </Box>
  )
}

export default InternProfilePage