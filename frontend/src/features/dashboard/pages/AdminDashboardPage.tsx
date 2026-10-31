import { useMemo, useState } from 'react'
import { Box, Button, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AlarmClock, FolderKanban, Users, UserCheck } from 'lucide-react'
import { Applicants } from '@/api/services/applicants.service'
import { Campuses } from '@/api/services/campuses.service'
import { Interns } from '@/api/services/interns.service'
import { Projects } from '@/api/services/projects.service'
import { Tasks } from '@/api/services/tasks.service'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import { BarList, EmptyNote, ErrorNotice, LoadingBlock, PageHeader, Panel, SampleNotice, StatTile, StatusBadge } from '@/features/shared/workspace/parts'
import { cardGrid } from '@/features/shared/workspace/layout'
import { sampleApplicants, sampleCampuses, sampleInterns, sampleProjects, sampleTasks } from '@/features/shared/workspace/sample'
import { isActiveIntern, isPendingApplicant, statusKey } from '@/features/shared/workspace/status'
import { useList } from '@/features/shared/workspace/useList'
import type { CampusView, InternView, ProjectView } from '@/features/shared/workspace/types'

const BASE = '/admin'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const applicants = useList(() => Applicants.list(), sampleApplicants)
  const interns = useList<InternView>(() => Interns.list(), sampleInterns)
  const campuses = useList<CampusView>(() => Campuses.list(), sampleCampuses)
  const projects = useList<ProjectView>(() => Projects.list(), sampleProjects)
  const tasks = useList(async () => ({ data: await Tasks.list() }), sampleTasks)

  const all = [applicants, interns, campuses, projects, tasks]
  const loading = all.some((r) => r.loading)
  const failed = all.some((r) => r.failed)
  const usingSample = all.some((r) => r.usingSample)

  const [now] = useState(() => Date.now())
  const openTasks = useMemo(() => tasks.items.filter((t) => t.status !== 'completed'), [tasks.items])
  const overdue = useMemo(() => openTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now), [openTasks, now])
  const upcoming = useMemo(
    () => openTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() >= now).sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()).slice(0, 5),
    [openTasks, now],
  )

  const activeProjects = projects.items.filter((p) => statusKey(p.status) === 'in_progress' || statusKey(p.status) === 'active')
  const pendingApplicants = applicants.items.filter((a) => isPendingApplicant(a.status)).length
  const activeInterns = interns.items.filter((i) => isActiveIntern(i.status))

  const campusName = useMemo(() => new Map(campuses.items.map((c) => [c.id, c.name])), [campuses.items])
  const projectName = useMemo(() => new Map(projects.items.map((p) => [p.id, p.name])), [projects.items])

  const internsByCampus = useMemo(() => {
    const counts = new Map<string, number>()
    for (const intern of activeInterns) {
      const name = (intern.campusId && campusName.get(intern.campusId)) || intern.campusName || 'Unassigned'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [activeInterns, campusName])

  const taskBreakdown = [
    { label: 'To do', value: tasks.items.filter((t) => t.status === 'todo').length, accent: 'pending' as const },
    { label: 'In progress', value: tasks.items.filter((t) => t.status === 'in_progress').length, accent: 'completed' as const },
    { label: 'Completed', value: tasks.items.filter((t) => t.status === 'completed').length, accent: 'active' as const },
  ]

  const firstName = user?.name?.split(' ')[0]

  return (
    <Box>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Admin dashboard'}
        subtitle="Programme overview across applicants, interns, projects and tasks."
        actions={<>
          <Button variant="outlined" component={RouterLink} to={`${BASE}/reports`}>Reports</Button>
          <Button variant="contained" component={RouterLink} to={`${BASE}/projects`}>View projects</Button>
        </>}
      />

      {usingSample && <SampleNotice />}
      {failed && <ErrorNotice message="Some dashboard data could not be loaded. Check your connection and try again." />}
      {loading ? <LoadingBlock /> : (
        <Stack spacing={2}>
          <Box sx={cardGrid({ lg: 4 })}>
            <StatTile label="Applicants" value={applicants.items.length} hint={`${pendingApplicants} pending review`} icon={Users} accent="pending" />
            <StatTile label="Active interns" value={activeInterns.length} hint={`${interns.items.length} interns on record`} icon={UserCheck} accent="active" />
            <StatTile label="Active projects" value={activeProjects.length} hint={`${projects.items.length} projects in total`} icon={FolderKanban} accent="completed" />
            <StatTile label="Overdue tasks" value={overdue.length} hint={`${openTasks.length} tasks still open`} icon={AlarmClock} accent={overdue.length ? 'rejected' : 'primary'} />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
            <Panel title="Projects" action={{ label: 'All projects', to: `${BASE}/projects` }}>
              {projects.items.length === 0 ? <EmptyNote message="No projects yet." /> : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Project</TableCell><TableCell>Status</TableCell><TableCell sx={{ minWidth: 140 }}>Progress</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.items.slice(0, 6).map((project) => (
                        <TableRow key={project.id} hover>
                          <TableCell>
                            <Typography variant="body2" component={RouterLink} to={`${BASE}/projects/${project.id}`} sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{project.name}</Typography>
                            {project.department && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{typeof project.department === 'string' ? project.department : project.department.name}</Typography>}
                          </TableCell>
                          <TableCell><StatusBadge status={project.status} /></TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <LinearProgress variant="determinate" value={project.progress ?? 0} sx={{ flex: 1, height: 8, borderRadius: 4 }} aria-label={`${project.name} progress`} />
                              <Typography variant="caption" sx={{ width: 34, textAlign: 'right' }}>{project.progress ?? 0}%</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Panel>

            <Panel title="Task status">
              <BarList items={taskBreakdown} emptyMessage="No tasks yet." />
            </Panel>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Panel title="Upcoming deadlines" action={{ label: 'Calendar', to: `${BASE}/calendar` }}>
              {upcoming.length === 0 ? <EmptyNote message="No upcoming deadlines." /> : (
                <Stack spacing={1.5} divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
                  {upcoming.map((task) => (
                    <Stack key={task.id} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{(task.projectId && projectName.get(task.projectId)) || 'No project'}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{formatDate(task.dueAt)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Panel>

            <Panel title="Active interns by campus" action={{ label: 'Campuses & intakes', to: `${BASE}/campuses` }}>
              <BarList items={internsByCampus} emptyMessage="No active interns yet." />
            </Panel>
          </Box>
        </Stack>
      )}
    </Box>
  )
}

export default AdminDashboardPage
