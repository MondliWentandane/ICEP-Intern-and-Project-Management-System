import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs,
  TextField, Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { Link as RouterLink } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '@/hooks/useAuth'
import { Projects, type MentorProject } from '@/api/services/projects.service'
import {
  Tasks, type MentorTaskRecord, type TaskPriority, type TaskWorkflowStatus,
} from '@/api/services/tasks.service'

type TaskView = 'board' | 'list'
type TaskFilter = 'ALL' | TaskWorkflowStatus
type TaskForm = {
  projectId: string
  title: string
  description: string
  priority: TaskPriority
  dueDate: string
  assignedToId: string
}

const statuses: TaskWorkflowStatus[] = ['TO_DO', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'BLOCKED']
const statusLabels: Record<TaskWorkflowStatus, string> = {
  TO_DO: 'To do',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
}
const statusDescriptions: Record<TaskWorkflowStatus, string> = {
  TO_DO: 'Not started.',
  IN_PROGRESS: 'Being worked on.',
  SUBMITTED: 'The intern says the work is ready for review.',
  COMPLETED: 'The reviewer accepts the work.',
  BLOCKED: 'Work is paused until a blocker is resolved.',
}
const statusColors: Record<TaskWorkflowStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  TO_DO: 'default', IN_PROGRESS: 'warning', SUBMITTED: 'info', COMPLETED: 'success',
}
const priorityColors: Record<TaskPriority, 'default' | 'warning' | 'error'> = {
  LOW: 'default', MEDIUM: 'warning', HIGH: 'error',
}
const makeEmptyForm = (projectId = ''): TaskForm => ({
  projectId, title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '',
})

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? fallback
  return error instanceof Error ? error.message : fallback
}

function formatDate(value: string | null) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(value.slice(0, 10) + 'T12:00:00'))
}

export function TaskBoardOverviewPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<MentorProject[]>([])
  const [tasks, setTasks] = useState<MentorTaskRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('ALL')
  const [view, setView] = useState<TaskView>('board')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<MentorTaskRecord | null>(null)
  const [form, setForm] = useState<TaskForm>(makeEmptyForm())
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [projectResponse, taskResponse] = await Promise.all([
          Projects.listForMentor(user?.id ?? ''),
          Tasks.listForMentorBoard(),
        ])
        if (!cancelled) {
          setProjects(projectResponse.data)
          setTasks(taskResponse.data.tasks)
        }
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError, 'Could not load tasks for your supervised projects.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [reloadKey, user?.id])

  const projectNames = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects])
  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const projectName = task.project?.name ?? projectNames.get(task.projectId) ?? ''
      const assigneeName = task.assignedTo?.user.fullName ?? ''
      return (projectFilter === 'ALL' || task.projectId === projectFilter)
        && (statusFilter === 'ALL' || task.status === statusFilter)
        && (!query || [task.title, task.description ?? '', projectName, assigneeName]
          .some((value) => value.toLowerCase().includes(query)))
    })
  }, [tasks, projectFilter, statusFilter, search, projectNames])

  const counts = useMemo(() => {
    const result = {} as Record<TaskWorkflowStatus, number>
    statuses.forEach((status) => { result[status] = tasks.filter((task) => task.status === status).length })
    return result
  }, [tasks])

  const openCreate = () => {
    const selected = projectFilter === 'ALL' ? projects[0]?.id ?? '' : projectFilter
    setEditingTask(null)
    setForm(makeEmptyForm(selected))
    setDialogError('')
    setDialogOpen(true)
  }

  const openEdit = (task: MentorTaskRecord) => {
    setEditingTask(task)
    setForm({
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDate: task.dueDate?.slice(0, 10) ?? '',
      assignedToId: task.assignedToId ?? '',
    })
    setDialogError('')
    setDialogOpen(true)
  }

  const saveTask = async () => {
    if (!form.projectId || !form.title.trim()) return
    setSaving(true)
    setDialogError('')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assignedToId: form.assignedToId || null,
    }
    try {
      if (editingTask) await Tasks.update(editingTask.id, payload)
      else await Tasks.create({ ...payload, projectId: form.projectId })
      setDialogOpen(false)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setDialogError(errorMessage(saveError, 'Could not save this task.'))
    } finally {
      setSaving(false)
    }
  }

  const assignments = projects.find((project) => project.id === form.projectId)?.assignments ?? []
  const renderTask = (task: MentorTaskRecord, compact = false) => {
    const assignee = task.assignedTo?.user.fullName ?? 'Unassigned'
    const initials = assignee.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
    return (
      <Card key={task.id} variant="outlined" sx={{ mb: compact ? 1.25 : 1.5, borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{task.title}</Typography>
                {compact && <Typography variant="caption" color="text.secondary">{task.project?.name ?? projectNames.get(task.projectId)}</Typography>}
              </Box>
              <Chip size="small" label={statusLabels[task.status]} color={statusColors[task.status]} />
            </Stack>
            {!compact && <Typography variant="caption" color="text.secondary">{task.project?.name ?? projectNames.get(task.projectId)}</Typography>}
            {task.description && <Typography variant="body2" color="text.secondary">{task.description}</Typography>}
            {task.status === 'BLOCKED' && task.blockedReason && <Typography variant="body2" color="error.main"><strong>Blocker:</strong> {task.blockedReason}</Typography>}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', rowGap: 1 }}>
              <Chip size="small" variant="outlined" color={priorityColors[task.priority]} label={task.priority.toLowerCase() + ' priority'} />
              <Typography variant="caption" color="text.secondary">Due {formatDate(task.dueDate)}</Typography>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{initials}</Avatar>
                <Typography variant="caption" color="text.secondary">{assignee}</Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {task.status !== 'COMPLETED' && task.status !== 'SUBMITTED' && <Button size="small" onClick={() => openEdit(task)}>Edit task</Button>}
              {task.status === 'SUBMITTED' && <Button size="small" component={RouterLink} to="/mentor/tasks/review">Review submission</Button>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>Task Board Overview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Plan and oversee tasks across the projects you supervise.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/mentor/tasks/review" variant="outlined">Review queue ({counts.SUBMITTED})</Button>
          <Button variant="contained" onClick={openCreate} disabled={!projects.length}>Create task</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5, mb: 3 }}>
        {statuses.map((status) => (
          <Paper key={status} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{counts[status]}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{statusLabels[status]}</Typography>
            <Typography variant="caption" color="text.secondary">{statusDescriptions[status]}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'center' }, mb: 2 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks, projects, or interns"
            sx={{ minWidth: { lg: 310 } }}
            slotProps={{ htmlInput: { 'aria-label': 'Search mentor tasks' }, input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="task-project-filter-label">Project</InputLabel>
              <Select<string> labelId="task-project-filter-label" label="Project" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                <MenuItem value="ALL">All projects</MenuItem>
                {projects.map((project) => <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 155 }}>
              <InputLabel id="task-status-filter-label">Status</InputLabel>
              <Select<TaskFilter> labelId="task-status-filter-label" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <MenuItem value="ALL">All statuses</MenuItem>
                {statuses.map((status) => <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Tabs value={view} onChange={(_, next: TaskView) => setView(next)} aria-label="Task view" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, minHeight: 40 }}>
          <Tab value="board" label="Board" sx={{ textTransform: 'none', minHeight: 40 }} />
          <Tab value="list" label="List" sx={{ textTransform: 'none', minHeight: 40 }} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress aria-label="Loading tasks" /></Box>
        ) : error && !tasks.length ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Task data could not be loaded.</Typography>
        ) : !projects.length ? (
          <Alert severity="info">You do not have any supervised projects yet. Projects assigned to you will appear here.</Alert>
        ) : !tasks.length ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>No tasks have been planned for your projects yet. Create the first task to get started.</Typography>
        ) : !visibleTasks.length ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>No tasks match these filters.</Typography>
        ) : view === 'board' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(200px, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
            {statuses.map((status) => {
              const columnTasks = visibleTasks.filter((task) => task.status === status)
              return (
                <Box key={status} sx={{ minWidth: 0, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip size="small" label={statusLabels[status]} color={statusColors[status]} />
                    <Typography variant="caption" color="text.secondary">{columnTasks.length}</Typography>
                  </Stack>
                  {columnTasks.length ? columnTasks.map((task) => renderTask(task, true)) : <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No tasks</Typography>}
                </Box>
              )
            })}
          </Box>
        ) : (
          <Stack spacing={2}>
            {projects.map((project) => {
              const projectTasks = visibleTasks.filter((task) => task.projectId === project.id)
              if (!projectTasks.length) return null
              return (
                <Box key={project.id}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{project.name}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                    {projectTasks.map((task) => renderTask(task))}
                  </Box>
                </Box>
              )
            })}
          </Stack>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTask ? 'Edit task' : 'Create project task'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign planned work to an active project intern. Interns submit finished work for mentor review.
          </Typography>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormControl fullWidth required>
              <InputLabel id="task-form-project-label">Project</InputLabel>
              <Select<string> labelId="task-form-project-label" label="Project" value={form.projectId} disabled={Boolean(editingTask)} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, assignedToId: '' }))}>
                {projects.map((project) => <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField required autoFocus label="Task title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} fullWidth />
            <TextField label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} fullWidth multiline minRows={3} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="task-form-priority-label">Priority</InputLabel>
                <Select<TaskPriority> labelId="task-form-priority-label" label="Priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                  <MenuItem value="LOW">Low</MenuItem><MenuItem value="MEDIUM">Medium</MenuItem><MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Due date" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="task-form-assignee-label">Assignee</InputLabel>
              <Select<string> labelId="task-form-assignee-label" label="Assignee" value={form.assignedToId} onChange={(event) => setForm((current) => ({ ...current, assignedToId: event.target.value }))}>
                <MenuItem value="">Unassigned</MenuItem>
                {assignments.map(({ intern }) => <MenuItem key={intern.id} value={intern.id}>{intern.user.fullName}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveTask()} disabled={saving || !form.projectId || !form.title.trim()}>
            {saving ? 'Saving…' : editingTask ? 'Save changes' : 'Create task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TaskBoardOverviewPage
