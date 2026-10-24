import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { Interns } from '@/api/services/interns.service'
import { formatDate, initials } from '@/utils/format'
import { DetailList, EmptyNote, ErrorNotice, LoadingBlock, Panel, SampleNotice, StatusBadge } from '@/features/shared/workspace/parts'
import { sampleInterns } from '@/features/shared/workspace/sample'
import { isPastIntern } from '@/features/shared/workspace/status'
import { useRecord } from '@/features/shared/workspace/useList'
import type { InternView } from '@/features/shared/workspace/types'

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
  const supervisor = intern.mentorName ?? intern.supervisor
  const department = intern.department

  return (
    <Box>
      {backButton}
      {usingSample && <SampleNotice />}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'center' } }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 26 }}>{initials(intern.fullName)}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>{intern.fullName}</Typography>
                <StatusBadge status={intern.status} />
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
        <Alert severity="info" sx={{ mb: 2 }}>
          Past intern{intern.endDate ? ` · internship ended ${formatDate(intern.endDate)}` : ''}
          {intern.ending ? ` · ${intern.ending.outcome}${intern.ending.reason ? `: ${intern.ending.reason}` : ''}${intern.ending.endedBy ? ` (ended by ${intern.ending.endedBy})` : ''}` : ''}. This profile is read-only history.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, alignItems: 'start' }}>
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
            {!intern.documents?.length ? <EmptyNote message="No documents uploaded." /> : (
              <Stack spacing={1.5}>
                {intern.documents.map((doc) => (
                  <Stack key={doc.id} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <FileText size={20} aria-hidden />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{doc.fileName}</Typography>
                      <Typography variant="caption" color="text.secondary">{doc.type}</Typography>
                    </Box>
                    {doc.fileUrl && <Button size="small" href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Open</Button>}
                  </Stack>
                ))}
              </Stack>
            )}
          </Panel>
        </Stack>
      </Box>
    </Box>
  )
}

export default InternProfilePage