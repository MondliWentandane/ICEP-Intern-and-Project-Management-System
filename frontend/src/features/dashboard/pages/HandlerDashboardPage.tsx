import { useMemo } from 'react'
import { Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { CalendarClock, ClipboardList, GraduationCap, UserCheck } from 'lucide-react'
import { Applicants } from '@/api/services/applicants.service'
import { Campuses } from '@/api/services/campuses.service'
import { Interns } from '@/api/services/interns.service'
import { useAuth } from '@/hooks/useAuth'
import { BarList, EmptyNote, ErrorNotice, LoadingBlock, PageHeader, Panel, SampleNotice, StatTile, StatusBadge } from '@/features/shared/workspace/parts'
import { cardGrid } from '@/features/shared/workspace/layout'
import { sampleApplicants, sampleCampuses, sampleInterns } from '@/features/shared/workspace/sample'
import { isActiveIntern, isInterviewee, isPastIntern, isPendingApplicant, statusKey } from '@/features/shared/workspace/status'
import { useList } from '@/features/shared/workspace/useList'
import type { CampusView, InternView } from '@/features/shared/workspace/types'

const BASE = '/handler'

export function HandlerDashboardPage() {
  const { user } = useAuth()
  const applicants = useList(() => Applicants.list(), sampleApplicants)
  const interns = useList<InternView>(() => Interns.list(), sampleInterns)
  const campuses = useList<CampusView>(() => Campuses.list(), sampleCampuses)

  const loading = applicants.loading || interns.loading || campuses.loading
  const failed = applicants.failed || interns.failed || campuses.failed
  const usingSample = applicants.usingSample || interns.usingSample || campuses.usingSample

  const stats = useMemo(() => ({
    pending: applicants.items.filter((a) => isPendingApplicant(a.status)).length,
    interviewees: applicants.items.filter((a) => isInterviewee(a.status)).length,
    active: interns.items.filter((i) => isActiveIntern(i.status)).length,
    past: interns.items.filter((i) => isPastIntern(i.status)).length,
  }), [applicants.items, interns.items])

  const pipeline = useMemo(() => {
    const count = (key: string) => applicants.items.filter((a) => statusKey(a.status) === key || (key === 'pending' && isPendingApplicant(a.status))).length
    return [
      { label: 'Pending review', value: count('pending'), accent: 'pending' as const },
      { label: 'Interviewees', value: count('interviewee'), accent: 'completed' as const },
      { label: 'Accepted', value: count('accepted'), accent: 'active' as const },
      { label: 'Rejected', value: count('rejected'), accent: 'rejected' as const },
    ]
  }, [applicants.items])

  const campusName = useMemo(() => new Map(campuses.items.map((c) => [c.id, c.name])), [campuses.items])

  const internsByCampus = useMemo(() => {
    const counts = new Map<string, number>()
    for (const intern of interns.items.filter((i) => isActiveIntern(i.status))) {
      const name = (intern.campusId && campusName.get(intern.campusId)) || intern.campusName || 'Unassigned'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [interns.items, campusName])

  const needsAttention = useMemo(
    () => [...applicants.items].filter((a) => isPendingApplicant(a.status) || isInterviewee(a.status))
      .sort((a, b) => Number(isInterviewee(a.status)) - Number(isInterviewee(b.status))).slice(0, 6),
    [applicants.items],
  )

  const firstName = user?.name?.split(' ')[0]

  return (
    <Box>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'WIL Handler dashboard'}
        subtitle="Applications, interns and intakes at a glance."
        actions={<Button variant="contained" component={RouterLink} to={`${BASE}/applicants`}>Review applicants</Button>}
      />

      {usingSample && <SampleNotice />}
      {failed && <ErrorNotice message="Could not load dashboard data. Check your connection and try again." />}
      {loading ? <LoadingBlock /> : (
        <Stack spacing={2}>
          <Box sx={cardGrid({ lg: 4 })}>
            <StatTile label="Pending applications" value={stats.pending} hint="Waiting for your review" icon={ClipboardList} accent="pending" />
            <StatTile label="Interviewees" value={stats.interviewees} hint="Shortlisted for interviews" icon={CalendarClock} accent="completed" />
            <StatTile label="Active interns" value={stats.active} hint="Currently on placement" icon={UserCheck} accent="active" />
            <StatTile label="Past interns" value={stats.past} hint="Internship ended" icon={GraduationCap} accent="past" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
            <Panel title="Needs your attention" action={{ label: 'All applicants', to: `${BASE}/applicants` }}>
              {needsAttention.length === 0 ? <EmptyNote message="No applications are waiting for review." /> : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Applicant</TableCell><TableCell>Campus</TableCell><TableCell>Status</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {needsAttention.map((applicant) => (
                        <TableRow key={applicant.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{applicant.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{applicant.email}</Typography>
                          </TableCell>
                          <TableCell>{(applicant.campusId && campusName.get(applicant.campusId)) || '—'}</TableCell>
                          <TableCell><StatusBadge status={applicant.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Panel>

            <Panel title="Application pipeline">
              <BarList items={pipeline} />
            </Panel>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Panel title="Active interns by campus" action={{ label: 'Campuses & intakes', to: `${BASE}/campuses` }}>
              <BarList items={internsByCampus} emptyMessage="No active interns yet." />
            </Panel>
            <Panel title="Quick links">
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Button variant="outlined" component={RouterLink} to={`${BASE}/interns`}>Interns</Button>
                <Button variant="outlined" component={RouterLink} to={`${BASE}/past-interns`} sx={{ color: '#718096', borderColor: '#CBD5E0', bgcolor: '#F1F3F6', '&:hover': { borderColor: '#A0AEC0', bgcolor: '#E2E8F0' } }}>Past interns</Button>
                <Button variant="outlined" component={RouterLink} to={`${BASE}/campuses`}>Campuses & intakes</Button>
                <Button variant="outlined" component={RouterLink} to={`${BASE}/notifications`}>Notifications</Button>
              </Stack>
            </Panel>
          </Box>
        </Stack>
      )}
    </Box>
  )
}

export default HandlerDashboardPage