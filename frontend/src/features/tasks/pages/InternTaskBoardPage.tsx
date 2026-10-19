import { useMemo, useState, type FormEvent } from 'react'
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { Badge, Button } from '@/components/ui'

type TaskStatus = 'TO DO' | 'IN PROGRESS' | 'DONE'
type StatusFilter = 'ALL' | TaskStatus
type TaskSort = 'dueDate' | 'priority' | 'title'
type TaskPriority = 'High' | 'Medium' | 'Low'
type BoardView = 'list' | 'board'

interface Task {
  id: string
  status: TaskStatus
  title: string
  assignee: {
    initials: string
    name: string
  }
  dueDate: string
  priority: TaskPriority
}

interface TaskGroup {
  id: string
  name: string
  tasks: Task[]
}

const initialGroups: TaskGroup[] = [
  {
    id: 'p1',
    name: 'Project 1',
    tasks: [],
  },
  {
    id: 'p2',
    name: 'Project 2',
    tasks: [],
  },
]

const statuses: TaskStatus[] = ['TO DO', 'IN PROGRESS', 'DONE']
const priorityOrder: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 }

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function getStatusColor(status: TaskStatus): 'default' | 'warning' | 'success' {
  if (status === 'IN PROGRESS') return 'warning'
  if (status === 'DONE') return 'success'
  return 'default'
}

function getPriorityColor(priority: TaskPriority): 'error' | 'warning' | 'default' {
  if (priority === 'High') return 'error'
  if (priority === 'Medium') return 'warning'
  return 'default'
}

interface TaskRowProps {
  task: Task
  boardCard?: boolean
  onToggleCompleted: (taskId: string) => void
}

function TaskRow({ task, boardCard = false, onToggleCompleted }: TaskRowProps) {
  const completed = task.status === 'DONE'

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: boardCard ? 0 : 650,
        p: 1.5,
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <IconButton
        size="small"
        aria-label={completed ? `Mark "${task.title}" as to do` : `Mark "${task.title}" as done`}
        onClick={() => onToggleCompleted(task.id)}
        sx={{ mr: boardCard ? 0 : 1 }}
      >
        {completed ? (
          <CheckCircleIcon color="primary" fontSize="small" />
        ) : (
          <RadioButtonUncheckedIcon color="action" fontSize="small" />
        )}
      </IconButton>

      <Typography
        variant="body2"
        sx={{
          flex: 1,
          minWidth: 0,
          fontWeight: 500,
          color: completed ? 'text.secondary' : 'text.primary',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </Typography>

      <Box
        sx={{
          width: boardCard ? 'auto' : 130,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Avatar
          aria-label={task.assignee.name}
          sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}
        >
          {task.assignee.initials}
        </Avatar>
        {boardCard && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {task.assignee.name}
          </Typography>
        )}
      </Box>

      {!boardCard && (
        <>
          <Typography variant="body2" sx={{ width: 120, flexShrink: 0, color: 'text.secondary' }}>
            {formatDueDate(task.dueDate)}
          </Typography>
          <Box sx={{ width: 100, flexShrink: 0 }}>
            <Badge label={task.priority} color={getPriorityColor(task.priority)} />
          </Box>
        </>
      )}
    </Paper>
  )
}

export function InternTaskBoardPage() {
  const [groups, setGroups] = useState<TaskGroup[]>(initialGroups)
  const [view, setView] = useState<BoardView>('board')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<TaskSort>('dueDate')
  const [search, setSearch] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium')

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    return groups.map((group) => {
      const tasks = group.tasks
        .filter((task) => statusFilter === 'ALL' || task.status === statusFilter)
        .filter(
          (task) =>
            !query ||
            task.title.toLocaleLowerCase().includes(query) ||
            task.assignee.name.toLocaleLowerCase().includes(query) ||
            group.name.toLocaleLowerCase().includes(query),
        )
        .sort((a, b) => {
          if (sortBy === 'title') return a.title.localeCompare(b.title)
          if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
          return a.dueDate.localeCompare(b.dueDate)
        })

      return { ...group, tasks }
    })
  }, [groups, search, sortBy, statusFilter])

  const handleToggleCompleted = (taskId: string) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) =>
          task.id === taskId
            ? { ...task, status: task.status === 'DONE' ? 'TO DO' : 'DONE' }
            : task,
        ),
      })),
    )
  }

  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || !newTaskDueDate || groups.length === 0) return

    const task: Task = {
      id: `task-${Date.now()}`,
      status: 'TO DO',
      title,
      assignee: { initials: 'PN', name: 'Palesa Ndlovu' },
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
    }

    setGroups((currentGroups) =>
      currentGroups.map((group, index) =>
        index === 0 ? { ...group, tasks: [...group.tasks, task] } : group,
      ),
    )
    setNewTaskTitle('')
    setNewTaskDueDate('')
    setNewTaskPriority('Medium')
    setIsAddDialogOpen(false)
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }} color="text.primary">
          Task Board
        </Typography>
        <Avatar aria-label="Palesa Ndlovu" sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
          PN
        </Avatar>
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }} color="text.primary">
          Municipality Service Delivery System
        </Typography>

        <Tabs
          value={view}
          onChange={(_, nextView: BoardView) => setView(nextView)}
          aria-label="Task display"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, minHeight: 40 }}
        >
          <Tab value="list" label="List" sx={{ textTransform: 'none', minHeight: 40 }} />
          <Tab value="board" label="Board" sx={{ textTransform: 'none', minHeight: 40 }} />
        </Tabs>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', lg: 'center' },
            mb: 3,
          }}
        >
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            sx={{ width: { xs: '100%', lg: 280 } }}
            slotProps={{
              htmlInput: { 'aria-label': 'Search tasks' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}
          >
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="task-status-filter-label">Status</InputLabel>
              <Select<StatusFilter>
                labelId="task-status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="ALL">All statuses</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="task-sort-label">Sort by</InputLabel>
              <Select<TaskSort>
                labelId="task-sort-label"
                value={sortBy}
                label="Sort by"
                onChange={(event) => setSortBy(event.target.value)}
              >
                <MenuItem value="dueDate">Due date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="title">Name</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add task
            </Button>
          </Stack>
        </Stack>

        {view === 'list' ? (
          <Box sx={{ overflowX: 'auto' }}>
            {visibleGroups.map((group) => (
              <Box key={group.id} sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                  color="text.primary"
                >
                  {group.name}
                </Typography>

                <Box sx={{ display: 'flex', minWidth: 650, pl: 5, pr: 2, pb: 1 }}>
                  <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>Name</Typography>
                  <Typography variant="caption" sx={{ width: 130, color: 'text.secondary' }}>Assignee</Typography>
                  <Typography variant="caption" sx={{ width: 120, color: 'text.secondary' }}>Due date</Typography>
                  <Typography variant="caption" sx={{ width: 100, color: 'text.secondary' }}>Priority</Typography>
                </Box>

                {statuses.map((status) => {
                  const tasks = group.tasks.filter((task) => task.status === status)
                  if (!tasks.length) return null

                  return (
                    <Box key={status} sx={{ mb: 2 }}>
                      <Box sx={{ mb: 1, ml: 5 }}>
                        <Badge label={status} color={getStatusColor(status)} />
                      </Box>
                      {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} onToggleCompleted={handleToggleCompleted} />
                      ))}
                    </Box>
                  )
                })}

                {group.tasks.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No tasks match your search or status filter.
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(220px, 1fr))' },
              gap: 2,
            }}
          >
            {statuses.map((status) => {
              const tasks = visibleGroups.flatMap((group) =>
                group.tasks
                  .filter((task) => task.status === status)
                  .map((task) => ({ ...task, groupName: group.name })),
              )

              return (
                <Box key={status} sx={{ minWidth: 0, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
                  >
                    <Badge label={status} color={getStatusColor(status)} />
                    <Typography variant="caption" color="text.secondary">{tasks.length}</Typography>
                  </Stack>
                  {tasks.length ? tasks.map((task) => (
                    <Box key={task.id}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {task.groupName}
                      </Typography>
                      <TaskRow
                        task={task}
                        boardCard
                        onToggleCompleted={handleToggleCompleted}
                      />
                      <Box sx={{ mt: -0.5, mb: 1.5, ml: 1 }}>
                        <Badge label={task.priority} color={getPriorityColor(task.priority)} />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          Due {formatDueDate(task.dueDate)}
                        </Typography>
                      </Box>
                    </Box>
                  )) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No tasks
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        )}
      </Paper>

      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleAddTask}>
          <DialogTitle>Add a task</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                autoFocus
                required
                fullWidth
                label="Task name"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
              />
              <TextField
                required
                fullWidth
                type="date"
                label="Due date"
                value={newTaskDueDate}
                onChange={(event) => setNewTaskDueDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl fullWidth>
                <InputLabel id="new-task-priority-label">Priority</InputLabel>
                <Select<TaskPriority>
                  labelId="new-task-priority-label"
                  label="Priority"
                  value={newTaskPriority}
                  onChange={(event) => setNewTaskPriority(event.target.value)}
                >
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create task</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default InternTaskBoardPage