import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs,
  TextField, Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { isAxiosError } from 'axios'
import { useAuth } from '@/hooks/useAuth'
import {
  Tasks,
  type InternBoardTask,
  type InternTaskStatus,
  type TaskPriority,
} from '@/api/services/tasks.service'
import type { ApiTaskStatus } from '@/types'

type InternBoardStatus = InternTaskStatus | 'BLOCKED'
type InternBoardTaskWithBlocked = Omit<InternBoardTask, 'status'> & {
  status: InternBoardStatus
  blockedReason?: string
}
type StatusFilter = 'ALL' | InternBoardStatus
type TaskView = 'board' | 'list'
type SortBy = 'dueDate' | 'priority' | 'title'

const statuses: InternBoardStatus[] = ['TO_DO', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'BLOCKED']
const filterStatuses: InternBoardStatus[] = ['TO_DO', 'SUBMITTED', 'COMPLETED', 'BLOCKED']
const statusLabels: Record<InternBoardStatus, string> = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
}
const statusDescriptions: Record<InternBoardStatus, string> = {
  TO_DO: 'Not started.',
  IN_PROGRESS: 'Being worked on.',
  SUBMITTED: 'The intern says the work is ready for review.',
  COMPLETED: 'The reviewer accepts the work.',
  BLOCKED: 'Work cannot continue until a blocker is resolved.',
}
const statusColors: Record<InternBoardStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  TO_DO: 'default', IN_PROGRESS: 'warning', SUBMITTED: 'info', COMPLETED: 'success', BLOCKED: 'error',
}
const priorityColors: Record<TaskPriority, 'default' | 'warning' | 'error'> = {
  LOW: 'default', MEDIUM: 'warning', HIGH: 'error',
}
const priorityOrder: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? fallback
  return error instanceof Error ? error.message : fallback
}

function dateLabel(value: string | null) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(value.slice(0, 10) + 'T12:00:00'))
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}

function canMoveTaskToStatus(task: InternBoardTaskWithBlocked, target: InternBoardStatus) {
  if (!task.canUpdateStatus || task.status === target) return false
  if (task.status === 'TO_DO') return target === 'IN_PROGRESS' || target === 'BLOCKED'
  if (task.status === 'IN_PROGRESS') return target === 'SUBMITTED' || target === 'BLOCKED'
  return task.status === 'BLOCKED' && target === 'IN_PROGRESS'
}

export function InternTaskBoardPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<InternBoardTaskWithBlocked[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<SortBy>('dueDate')
  const [view, setView] = useState<TaskView>('board')
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [blockDialogTask, setBlockDialogTask] = useState<InternBoardTaskWithBlocked | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<InternBoardStatus | null>(null)
  const localBlockReasons = useRef(new Map<string, string>())

  useEffect(() => {
    let cancelled = false
    let inFlight = false
    const load = async (showLoading = false) => {
      if (inFlight) return
      inFlight = true
      if (showLoading) setLoading(true)
      if (showLoading && !cancelled) setError('')
      try {
        const response = await Tasks.listForInternBoard()
        if (!cancelled) {
          const boardTasks = response.data.tasks as InternBoardTaskWithBlocked[]
          setTasks(boardTasks.map((task) => {
            const reason = localBlockReasons.current.get(task.id)
            return reason ? { ...task, status: 'BLOCKED', blockedReason: reason } : task
          }))
        }
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError, 'Could not load tasks for your project teams.'))
      } finally {
        if (showLoading && !cancelled) setLoading(false)
        inFlight = false
      }
    }
    void load(true)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 30_000)
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('focus', refreshOnFocus)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [reloadKey])

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks
      .filter((task) => statusFilter === 'ALL' || task.status === statusFilter)
      .filter((task) => !query || [
        task.title, task.description ?? '', task.project.name, task.assignedTo?.user?.fullName ?? '',
      ].some((value) => value.toLowerCase().includes(query)))
      .sort((left, right) => {
        if (sortBy === 'title') return left.title.localeCompare(right.title)
        if (sortBy === 'priority') return priorityOrder[left.priority] - priorityOrder[right.priority]
        if (!left.dueDate) return right.dueDate ? 1 : 0
        if (!right.dueDate) return -1
        return left.dueDate.localeCompare(right.dueDate)
      })
  }, [tasks, search, statusFilter, sortBy])

  const counts = useMemo(() => {
    const result = {} as Record<InternBoardStatus, number>
    statuses.forEach((status) => { result[status] = tasks.filter((task) => task.status === status).length })
    return result
  }, [tasks])

  const updateStatus = async (task: InternBoardTaskWithBlocked, status: InternTaskStatus) => {
    setError('')
    setUpdatingIds((current) => new Set(current).add(task.id))
    try {
      const apiStatus: ApiTaskStatus = status === 'TO_DO'
        ? 'TODO'
        : status === 'SUBMITTED'
          ? 'COMPLETED'
          : status
      await Tasks.updateStatus(task.id, apiStatus)
      setReloadKey((key) => key + 1)
    } catch (updateError) {
      setError(errorMessage(updateError, 'Could not update this task.'))
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const openBlockDialog = (task: InternBoardTaskWithBlocked) => {
    setBlockDialogTask(task)
    setBlockReason('')
  }

  const closeBlockDialog = () => {
    setBlockDialogTask(null)
    setBlockReason('')
  }

  const confirmBlockTask = () => {
    const reason = blockReason.trim()
    if (!blockDialogTask || !reason || !blockDialogTask.canUpdateStatus) return
    if (blockDialogTask.status !== 'TO_DO' && blockDialogTask.status !== 'IN_PROGRESS') return

    localBlockReasons.current.set(blockDialogTask.id, reason)
    setTasks((current) => current.map((task) => task.id === blockDialogTask.id
      ? { ...task, status: 'BLOCKED', blockedReason: reason }
      : task))
    closeBlockDialog()
  }

  const moveTaskToStatus = async (task: InternBoardTaskWithBlocked, target: InternBoardStatus) => {
    if (!canMoveTaskToStatus(task, target)) return
    if (target === 'BLOCKED') {
      openBlockDialog(task)
      return
    }
    if (task.status === 'BLOCKED' && target === 'IN_PROGRESS') {
      localBlockReasons.current.delete(task.id)
      setTasks((current) => current.map((item) => item.id === task.id
        ? { ...item, status: 'IN_PROGRESS', blockedReason: undefined }
        : item))
      return
    }
    await updateStatus(task, target)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>, target: InternBoardStatus) => {
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
    const task = tasks.find((item) => item.id === taskId)
    if (!task || !canMoveTaskToStatus(task, target)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverStatus(target)
  }

  const handleDrop = (event: DragEvent<HTMLElement>, target: InternBoardStatus) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
    const task = tasks.find((item) => item.id === taskId)
    setDraggedTaskId(null)
    setDragOverStatus(null)
    if (task) void moveTaskToStatus(task, target)
  }

  const renderTask = (task: InternBoardTaskWithBlocked, compact = false) => {
    const assigneeName = task.assignedTo?.user?.fullName ?? 'Unassigned'
    const draggable = task.canUpdateStatus && (task.status === 'TO_DO' || task.status === 'IN_PROGRESS' || task.status === 'BLOCKED')
    const card = (
      <Card
        variant="outlined"
        draggable={draggable}
        aria-label={`${task.title}, ${statusLabels[task.status]}${draggable ? ', draggable task' : ''}`}
        onDragStart={(event) => {
          if (!draggable) return
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', task.id)
          setDraggedTaskId(task.id)
        }}
        onDragEnd={() => {
          setDraggedTaskId(null)
          setDragOverStatus(null)
        }}
        sx={{ borderRadius: 2, cursor: draggable ? 'grab' : 'default', opacity: draggedTaskId === task.id ? 0.55 : 1 }}
      >
        <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{task.title}</Typography>
                {compact && <Typography variant="caption" color="text.secondary">{task.project.name}</Typography>}
              </Box>
              <Chip size="small" label={statusLabels[task.status]} color={statusColors[task.status]} />
            </Stack>
            {!compact && <Typography variant="caption" color="text.secondary">{task.project.name}</Typography>}
            {task.description && <Typography variant="body2" color="text.secondary">{task.description}</Typography>}
            {task.status === 'BLOCKED' && task.blockedReason && (
              <Typography variant="body2" color="error.main">
                <strong>Block reason:</strong> {task.blockedReason}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
              <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{initials(assigneeName)}</Avatar>
              <Typography variant="caption" color="text.secondary">{assigneeName}</Typography>
              <Chip size="small" variant="outlined" color={priorityColors[task.priority]} label={task.priority.toLowerCase() + ' priority'} />
              <Typography variant="caption" color="text.secondary">Due {dateLabel(task.dueDate)}</Typography>
            </Stack>
            {task.canUpdateStatus && (task.status === 'TO_DO' || task.status === 'IN_PROGRESS' || task.status === 'BLOCKED') && (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                <Button
                  size="small"
                  variant={task.status === 'TO_DO' || task.status === 'BLOCKED' ? 'contained' : 'outlined'}
                  disabled={updatingIds.has(task.id) || task.status === 'IN_PROGRESS'}
                  onClick={() => void moveTaskToStatus(task, 'IN_PROGRESS')}
                >
                  {task.status === 'BLOCKED' ? 'Resume' : 'Begin'}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={updatingIds.has(task.id) || task.status !== 'IN_PROGRESS'}
                  onClick={() => void moveTaskToStatus(task, 'SUBMITTED')}
                >
                  Submit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={updatingIds.has(task.id) || task.status === 'BLOCKED'}
                  onClick={() => openBlockDialog(task)}
                >
                  Block
                </Button>
              </Stack>
            )}
            {task.status === 'SUBMITTED' && (
              <Typography variant="caption" color="info.main">Waiting for mentor review</Typography>
            )}
            {!task.canUpdateStatus && task.project.status === 'COMPLETED' && (
              <Typography variant="caption" color="text.secondary">Completed project · read only</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    )
    return (
      <Box key={task.id} sx={{ mb: compact ? 1.25 : 1.5 }}>
        {card}
      </Box>
    )
  }

  const displayName = user?.name?.trim() || user?.email || 'Intern'

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>My Task Board</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>See your project teams’ work and update only tasks assigned to you.</Typography>
        </Box>
        <Avatar aria-label={displayName} sx={{ width: 36, height: 36, bgcolor: 'secondary.main', alignSelf: { xs: 'flex-start', sm: 'auto' } }}>{initials(displayName)}</Avatar>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Task workflow</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Begin assigned work, submit it for mentor review, or block it with a reason.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1, mb: 3 }}>
          {statuses.map((status) => (
            <Paper key={status} variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip size="small" label={statusLabels[status]} color={statusColors[status]} />
                <Typography variant="caption" color="text.secondary">{counts[status]}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{statusDescriptions[status]}</Typography>
            </Paper>
          ))}
        </Box>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'center' }, mb: 2 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks, projects, or teammates"
            sx={{ minWidth: { lg: 300 } }}
            slotProps={{ htmlInput: { 'aria-label': 'Search team tasks' }, input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="intern-task-status-label">Status</InputLabel>
              <Select<StatusFilter> labelId="intern-task-status-label" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <MenuItem value="ALL">All statuses</MenuItem>
                {filterStatuses.map((status) => <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 145 }}>
              <InputLabel id="intern-task-sort-label">Sort by</InputLabel>
              <Select<SortBy> labelId="intern-task-sort-label" label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <MenuItem value="dueDate">Due date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="title">Name</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Tabs value={view} onChange={(_, next: TaskView) => setView(next)} aria-label="Task display" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, minHeight: 40 }}>
          <Tab value="board" label="Board" sx={{ textTransform: 'none', minHeight: 40 }} />
          <Tab value="list" label="List" sx={{ textTransform: 'none', minHeight: 40 }} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress aria-label="Loading project tasks" /></Box>
        ) : error && !tasks.length ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Your project tasks could not be loaded.</Typography>
        ) : !tasks.length ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>No tasks are available for your active project teams yet.</Typography>
        ) : !visibleTasks.length ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>No tasks match your search or filters.</Typography>
        ) : view === 'board' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(170px, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
            {statuses.map((status) => {
              const columnTasks = visibleTasks.filter((task) => task.status === status)
              const draggedTask = tasks.find((task) => task.id === draggedTaskId)
              const acceptsDraggedTask = draggedTask ? canMoveTaskToStatus(draggedTask, status) : false
              return (
                <Box
                  key={status}
                  onDragEnter={(event) => handleDragOver(event, status)}
                  onDragOver={(event) => handleDragOver(event, status)}
                  onDragLeave={(event) => {
                    const nextTarget = event.relatedTarget as Node | null
                    if (!nextTarget || !event.currentTarget.contains(nextTarget)) setDragOverStatus(null)
                  }}
                  onDrop={(event) => handleDrop(event, status)}
                  sx={{
                    minWidth: 0,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    boxShadow: dragOverStatus === status ? 'inset 0 0 0 2px' : 'none',
                    color: dragOverStatus === status ? 'primary.main' : 'inherit',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip size="small" label={statusLabels[status]} color={statusColors[status]} />
                    <Typography variant="caption" color="text.secondary">{columnTasks.length}</Typography>
                  </Stack>
                  {columnTasks.length
                    ? columnTasks.map((task) => renderTask(task, true))
                    : <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{acceptsDraggedTask ? 'Drop task here' : 'No tasks'}</Typography>}
                </Box>
              )
            })}
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {visibleTasks.map((task) => (
              <Stack key={task.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'stretch' }}>
                <Box sx={{ flex: 1 }}>{renderTask(task)}</Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={Boolean(blockDialogTask)} onClose={closeBlockDialog} fullWidth maxWidth="sm">
        <DialogTitle>Block task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {blockDialogTask?.title}
          </Typography>
          <TextField
            autoFocus
            required
            fullWidth
            multiline
            minRows={3}
            label="Reason for blocking"
            value={blockReason}
            onChange={(event) => setBlockReason(event.target.value)}
            helperText="Enter why you cannot continue with this task."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeBlockDialog}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmBlockTask} disabled={!blockReason.trim()}>
            Block task
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

export default InternTaskBoardPage
