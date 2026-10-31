import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { Link as RouterLink } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Tasks, type MentorTaskRecord } from '@/api/services/tasks.service'
import { useAuth } from '@/hooks/useAuth'

type ReviewTask = MentorTaskRecord & { projectName: string; assigneeName: string }

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? fallback
  return error instanceof Error ? error.message : fallback
}

function formatDate(value: string | null) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(value.slice(0, 10) + 'T12:00:00'))
}

function hydrateTasks(tasks: MentorTaskRecord[]): ReviewTask[] {
  return tasks.map((task) => ({
    ...task,
    projectName: task.project?.name ?? 'Project unavailable',
    assigneeName: task.assignedTo?.user.fullName ?? 'Unassigned',
  }))
}

export function ReviewQueuePage() {
  const { user } = useAuth()
  const taskBoardPath = user?.role === 'INTERN' ? '/intern/tasks' : '/mentor/tasks'
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [feedbackTask, setFeedbackTask] = useState<ReviewTask | null>(null)
  const [feedback, setFeedback] = useState('')
  const [dialogError, setDialogError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const queueResponse = await Tasks.listReviewQueue()
        if (!cancelled) {
          setTasks(hydrateTasks(queueResponse.data.tasks))
        }
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError, 'Could not load submitted work for your projects.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [reloadKey])

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesProject = projectFilter === 'ALL' || task.projectId === projectFilter
      const matchesSearch = !query || [task.title, task.description ?? '', task.projectName, task.assigneeName]
        .some((value) => value.toLowerCase().includes(query))
      return matchesProject && matchesSearch
    })
  }, [tasks, projectFilter, search])

  const projectOptions = useMemo(() => {
    const options = new Map<string, string>()
    tasks.forEach((task) => options.set(task.projectId, task.projectName))
    return [...options].map(([id, name]) => ({ id, name }))
  }, [tasks])

  const approveTask = async (task: ReviewTask) => {
    setError('')
    setProcessingIds((current) => new Set(current).add(task.id))
    try {
      await Tasks.approve(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
    } catch (approveError) {
      setError(errorMessage(approveError, 'Could not approve this submission.'))
    } finally {
      setProcessingIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const openFeedback = (task: ReviewTask) => {
    setFeedbackTask(task)
    setFeedback('')
    setDialogError('')
  }

  const requestChanges = async () => {
    if (!feedbackTask || !feedback.trim()) return
    const taskId = feedbackTask.id
    setDialogError('')
    setProcessingIds((current) => new Set(current).add(taskId))
    try {
      await Tasks.requestChanges(taskId, feedback.trim())
      setTasks((current) => current.filter((task) => task.id !== taskId))
      setFeedbackTask(null)
      setFeedback('')
    } catch (requestError) {
      setDialogError(errorMessage(requestError, 'Could not return this task with feedback.'))
    } finally {
      setProcessingIds((current) => {
        const next = new Set(current)
        next.delete(taskId)
        return next
      })
    }
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>Task Review Queue</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Review work submitted for acceptance on projects you supervise or Scrum Master.</Typography>
        </Box>
        <Button component={RouterLink} to={taskBoardPath} variant="outlined">Back to task board</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Submitted for review ({tasks.length})</Typography>
            <Typography variant="body2" color="text.secondary">Approve accepted work or request changes with clear feedback.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search submissions"
              slotProps={{ htmlInput: { 'aria-label': 'Search submissions' }, input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="review-project-filter-label">Project</InputLabel>
              <Select<string> labelId="review-project-filter-label" label="Project" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                <MenuItem value="ALL">All projects</MenuItem>
                {projectOptions.map((project) => <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress aria-label="Loading review queue" /></Box>
        ) : error && !tasks.length ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>The review queue could not be loaded.</Typography>
        ) : !tasks.length ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Chip color="success" label="Queue clear" sx={{ mb: 1 }} />
            <Typography variant="h6">No submitted tasks are waiting for review.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>New submissions from your project interns will appear here.</Typography>
          </Box>
        ) : !visibleTasks.length ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>No submissions match these filters.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {visibleTasks.map((task) => {
              const initials = task.assigneeName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
              return (
                <Card key={task.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: { xs: 1.75, md: 2.5 }, '&:last-child': { pb: { xs: 1.75, md: 2.5 } } }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                          <Chip size="small" color="info" label="Submitted" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{task.projectName} · Due {formatDate(task.dueDate)}</Typography>
                        {task.description && <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{task.description}</Typography>}
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5, flexWrap: 'wrap' }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: 12 }}>{initials}</Avatar>
                          <Typography variant="body2">Submitted by {task.assigneeName}</Typography>
                          <Chip size="small" variant="outlined" label={task.priority.toLowerCase() + ' priority'} />
                        </Stack>
                      </Box>
                      <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ flexShrink: 0 }}>
                        <Button variant="contained" color="success" disabled={processingIds.has(task.id)} onClick={() => void approveTask(task)}>Approve</Button>
                        <Button variant="outlined" color="warning" disabled={processingIds.has(task.id)} onClick={() => openFeedback(task)}>Request changes</Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}
      </Paper>

      <Dialog
        open={Boolean(feedbackTask)}
        onClose={() => {
          if (!feedbackTask || !processingIds.has(feedbackTask.id)) setFeedbackTask(null)
        }}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={(event) => { event.preventDefault(); void requestChanges() }}>
          <DialogTitle>Request changes</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Give the intern actionable feedback. It will be added to the task comments and the task will return to In progress.
            </Typography>
            {feedbackTask && <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{feedbackTask.title}</Typography>}
            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            <TextField autoFocus required fullWidth multiline minRows={4} label="Feedback for the intern" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFeedbackTask(null)} disabled={Boolean(feedbackTask && processingIds.has(feedbackTask.id))}>Cancel</Button>
            <Button type="submit" variant="contained" color="warning" disabled={!feedback.trim() || Boolean(feedbackTask && processingIds.has(feedbackTask.id))}>
              {feedbackTask && processingIds.has(feedbackTask.id) ? 'Sending…' : 'Send feedback'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default ReviewQueuePage
