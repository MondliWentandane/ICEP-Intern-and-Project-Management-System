import { useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AlarmClock, CircleCheckBig, FolderKanban, ListTodo } from 'lucide-react'
import { Projects } from '@/api/services/projects.service'
import { Tasks } from '@/api/services/tasks.service'
import { IcepLogo } from '@/components/brand/IcepLogo'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import { EmptyNote, ErrorNotice, LoadingBlock, Panel, SampleNotice, StatTile, StatusBadge } from '@/features/shared/workspace/parts'
import { cardGrid } from '@/features/shared/workspace/layout'
import { sampleProjects, sampleTasks } from '@/features/shared/workspace/sample'
import { isTaskDone, statusKey } from '@/features/shared/workspace/status'
import { useList } from '@/features/shared/workspace/useList'
import { taskDue, type ProjectView, type TaskView } from '@/features/shared/workspace/types'

const BASE = '/intern'

export function InternDashboardPage() {
  const { user } = useAuth()
  const tasks = useList<TaskView>(() => Tasks.list(), sampleTasks)
  const projects = useList<ProjectView>(() => Projects.list(), sampleProjects)

  const loading = tasks.loading || projects.loading
  const failed = tasks.failed || projects.failed
  const usingSample = tasks.usingSample || projects.usingSample

  const [now] = useState(() => Date.now())
  const open = useMemo(() => tasks.items.filter((t) => !isTaskDone(t.status)), [tasks.items])
  const overdue = open.filter((t) => taskDue(t) && new Date(taskDue(t)!).getTime() < now)
  const inProgress = tasks.items.filter((t) => statusKey(t.status) === 'in_progress').length
  const done = tasks.items.length - open.length
  const upcoming = useMemo(
    () => open.filter((t) => taskDue(t)).sort((a, b) => new Date(taskDue(a)!).getTime() - new Date(taskDue(b)!).getTime()).slice(0, 5),
    [open],
  )

  // An intern works on one project at a time; show the one still in progress.
  const project = projects.items.find((p) => ['in_progress', 'active'].includes(statusKey(p.status))) ?? projects.items[0]
  const projectName = useMemo(() => new Map(projects.items.map((p) => [p.id, p.name])), [projects.items])
  const firstName = user?.name?.split(' ')[0]

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Stack spacing={1.5}>
          <IcepLogo />
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>{firstName ? `Welcome, ${firstName}` : 'Intern dashboard'}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Your project, tasks and upcoming deadlines.</Typography>
          </Box>
        </Stack>
        <Button variant="contained" component={RouterLink} to={`${BASE}/tasks`}>Open task board</Button>
      </Stack>

      {usingSample && <SampleNotice />}
      {failed && <ErrorNotice message="Could not load your dashboard. Check your connection and try again." />}
      {loading ? <LoadingBlock /> : (
        <Stack spacing={2}>
          <Box sx={cardGrid({ lg: 4 })}>
            <StatTile label="Open tasks" value={open.length} hint="Not yet completed" icon={ListTodo} accent="pending" />
            <StatTile label="In progress" value={inProgress} icon={FolderKanban} accent="completed" />
            <StatTile label="Overdue" value={overdue.length} hint={overdue.length ? 'Needs attention' : 'You are on track'} icon={AlarmClock} accent={overdue.length ? 'rejected' : 'primary'} />
            <StatTile label="Completed" value={done} icon={CircleCheckBig} accent="active" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Panel title="My project" action={{ label: 'Open project', to: `${BASE}/project` }}>
              {!project ? <EmptyNote message="You have not been assigned to a project yet." /> : (
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700 }}>{project.name}</Typography>
                      <StatusBadge status={project.status} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <LinearProgress variant="determinate" value={project.progress ?? 0} sx={{ flex: 1, height: 8, borderRadius: 4 }} aria-label="Project progress" />
                      <Typography variant="caption" sx={{ width: 34, textAlign: 'right' }}>{project.progress ?? 0}%</Typography>
                    </Stack>
                    {project.endDate && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Ends {formatDate(project.endDate)}</Typography>}
                  </CardContent>
                </Card>
              )}
            </Panel>

            <Panel title="Upcoming deadlines" action={{ label: 'Calendar', to: `${BASE}/calendar` }}>
              {upcoming.length === 0 ? <EmptyNote message="No upcoming deadlines." /> : (
                <Stack spacing={1.5} divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
                  {upcoming.map((task) => (
                    <Stack key={task.id} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{(task.projectId && projectName.get(task.projectId)) || 'No project'}</Typography>
                      </Box>
                      <Typography variant="body2" color={new Date(taskDue(task)!).getTime() < now ? 'error' : 'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>{formatDate(taskDue(task))}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Panel>
          </Box>
        </Stack>
      )}
    </Box>
  )
}

export default InternDashboardPage
