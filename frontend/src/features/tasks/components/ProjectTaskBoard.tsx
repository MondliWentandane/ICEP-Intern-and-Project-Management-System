import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { Badge, Button } from '@/components/ui'
import { Projects } from '@/api/services/projects.service'
import { Tasks } from '@/api/services/tasks.service'
import { useAuth } from '@/hooks/useAuth'
import { BikeLoader } from '@/components/ui/BikeLoader'
import type { ApiTaskStatus, Project, TaskApiRecord } from '@/types'

const taskStatuses: ApiTaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']
const statusLabels: Record<ApiTaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
}
const statusColors: Record<ApiTaskStatus, 'default' | 'warning' | 'success' | 'error'> = {
  TODO: 'default',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  BLOCKED: 'error',
}
const priorityLabels = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as const
const refreshIntervalMs = 30_000

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }
  return error instanceof Error ? error.message : 'Unable to complete the task request.'
}

function formatDueDate(value?: string | null): string {
  if (!value) return 'No due date'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

function allowedProjects(projects: Project[], role: string | undefined, userId: string | undefined) {
  if (role === 'ADMIN') return projects
  if (role === 'MENTOR') return projects.filter((project) => project.supervisor?.user?.id === userId)
  return projects.filter((project) => project.assignments?.some((assignment) =>
    assignment.intern?.user?.id === userId,
  ))
}

function nextStatus(status: ApiTaskStatus): ApiTaskStatus | null {
  if (status === 'TODO') return 'IN_PROGRESS'
  if (status === 'IN_PROGRESS') return 'COMPLETED'
  if (status === 'BLOCKED') return 'IN_PROGRESS'
  return null
}

interface TaskCardProps {
  task: TaskApiRecord
  isIntern: boolean
  isAssignedToCurrentIntern: boolean
  projectCompleted: boolean
  isUpdating: boolean
  onAdvance: (task: TaskApiRecord) => void
}

function TaskCard({
  task,
  isIntern,
  isAssignedToCurrentIntern,
  projectCompleted,
  isUpdating,
  onAdvance,
}: TaskCardProps) {
  const assignee = task.assignedTo?.user?.fullName ?? 'Unassigned'
  const next = nextStatus(task.status)
  const canAdvance = isIntern && isAssignedToCurrentIntern && !projectCompleted && next !== null
  const priority = task.priority ? priorityLabels[task.priority] : 'Medium'
  const priorityColor = task.priority === 'HIGH' ? 'error' : task.priority === 'MEDIUM' ? 'warning' : 'default'

  return (
    <Paper
      elevation={0}
      sx={{ p: 1.5, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{task.title}</Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <Avatar aria-label={assignee} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
          {initialsFor(assignee)}
        </Avatar>
        <Typography variant="caption" color="text.secondary" noWrap>{assignee}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Due {formatDueDate(task.dueDate)}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
        <Badge label={priority} color={priorityColor} />
        {task.status === 'COMPLETED' && (
          <Typography variant="caption" color="text.secondary">
            {task.approvedAt ? 'Approved' : 'Awaiting approval'}
          </Typography>
        )}
      </Stack>
      {task.status === 'BLOCKED' && task.blockedReason && (
        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>Blocked: {task.blockedReason}</Typography>
      )}
      {canAdvance && (
        <Button
          variant="outlined"
          size="small"
          disabled={isUpdating}
          onClick={() => onAdvance(task)}
          sx={{ mt: 1.5 }}
        >
          {isUpdating ? 'Saving…' : `Move to ${statusLabels[next]}`}
        </Button>
      )}
      {isIntern && isAssignedToCurrentIntern && projectCompleted && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Tasks in completed projects cannot be changed.
        </Typography>
      )}
    </Paper>
  )
}

export function ProjectTaskBoard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState<TaskApiRecord[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const selectedProjectIdRef = useRef(selectedProjectId)

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId
  }, [selectedProjectId])

  const visibleProjects = useMemo(
    () => allowedProjects(projects, user?.role, user?.id),
    [projects, user?.id, user?.role],
  )
  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId)
  const currentInternId = selectedProject?.assignments?.find(
    (assignment) => assignment.intern?.user?.id === user?.id,
  )?.internId
  const isIntern = user?.role === 'INTERN'

  const refreshTasks = useCallback(async () => {
    if (!selectedProjectId) {
      setTasks([])
      return
    }

    setLoadingTasks(true)
    setTaskError(null)
    try {
      const projectTasks = await Tasks.getProjectTasks(selectedProjectId)
      if (selectedProjectIdRef.current === selectedProjectId) setTasks(projectTasks)
    } catch (error) {
      if (selectedProjectIdRef.current === selectedProjectId) {
        setTaskError(getErrorMessage(error))
        console.error('Failed to load project tasks:', error)
      }
    } finally {
      if (selectedProjectIdRef.current === selectedProjectId) setLoadingTasks(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    let cancelled = false
    Projects.list()
      .then(({ data }) => {
        if (cancelled) return
        const accessible = allowedProjects(data, user?.role, user?.id)
        setProjects(data)
        setSelectedProjectId((current) =>
          accessible.some((project) => project.id === current) ? current : accessible[0]?.id ?? '',
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProjectError(getErrorMessage(error))
          console.error('Failed to load projects:', error)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => { cancelled = true }
  }, [user?.id, user?.role])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!selectedProjectId) {
        setTasks([])
        return
      }

      setLoadingTasks(true)
      setTaskError(null)
      try {
        const projectTasks = await Tasks.getProjectTasks(selectedProjectId)
        if (!cancelled) setTasks(projectTasks)
      } catch (error) {
        if (!cancelled) {
          setTaskError(getErrorMessage(error))
          console.error('Failed to load project tasks:', error)
        }
      } finally {
        if (!cancelled) setLoadingTasks(false)
      }
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    void load()
    const intervalId = window.setInterval(() => void load(), refreshIntervalMs)
    window.addEventListener('focus', refreshWhenVisible)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [selectedProjectId])

  const handleAdvance = async (task: TaskApiRecord) => {
    const status = nextStatus(task.status)
    if (!status || task.assignedToId !== currentInternId || !currentInternId) return
    setUpdatingTaskId(task.id)
    try {
      await Tasks.updateStatus(task.id, status)
      await refreshTasks()
      setToastMessage(`Task moved to ${statusLabels[status]}.`)
    } catch (error) {
      setToastMessage(getErrorMessage(error))
      console.error('Failed to update task status:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Task Board</Typography>
          <Typography variant="body2" color="text.secondary">
            Project tasks are shared with the Gantt chart and calendar.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }} disabled={loadingProjects || !visibleProjects.length}>
          <InputLabel id="project-task-board-label">Project</InputLabel>
          <Select
            labelId="project-task-board-label"
            value={selectedProjectId}
            label="Project"
            onChange={(event) => {
              setTasks([])
              setSelectedProjectId(event.target.value)
            }}
          >
            {visibleProjects.map((project) => (
              <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loadingProjects && <BikeLoader label="Loading projects" size={125} />}
      {projectError && <Alert severity="error" sx={{ mb: 2 }}>{projectError}</Alert>}
      {!loadingProjects && !projectError && visibleProjects.length === 0 && (
        <Alert severity="info">No project is available for your account.</Alert>
      )}
      {taskError && <Alert severity="error" sx={{ mb: 2 }}>{taskError}</Alert>}
      {loadingTasks && <BikeLoader label="Loading project tasks" size={105} />}
      {selectedProject && (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{selectedProject.name}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {taskStatuses.map((status) => {
              const columnTasks = tasks.filter((task) => task.status === status)
              return (
                <Box key={status} sx={{ minWidth: 0, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Badge label={statusLabels[status]} color={statusColors[status]} />
                    <Typography variant="caption" color="text.secondary">{columnTasks.length}</Typography>
                  </Stack>
                  {columnTasks.length ? columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isIntern={isIntern}
                      isAssignedToCurrentIntern={Boolean(currentInternId && task.assignedToId === currentInternId)}
                      projectCompleted={selectedProject.status === 'COMPLETED'}
                      isUpdating={updatingTaskId === task.id}
                      onAdvance={handleAdvance}
                    />
                  )) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No tasks</Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        </Paper>
      )}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity={toastMessage?.includes('Unable') || toastMessage?.includes('denied') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
