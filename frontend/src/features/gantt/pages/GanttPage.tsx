import { useState, useMemo, useEffect } from 'react'
import { Tasks } from '@/api/services/tasks.service'
import { Projects } from '@/api/services/projects.service'
import { useAuth } from '@/hooks/useAuth'
import {
  Alert,
  DialogContent,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material'
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Play,
  Plus,
  Search,
  Share,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import styles from './GanttPage.module.css'

export type GanttStatus = 'To Do' | 'In Progress' | 'Submitted' | 'Completed' | 'Blocked'
type NewTaskStatus = 'To Do' | 'In Progress' | 'Completed'
type ApiTaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

interface ProjectTeamMember {
  id: string
  name: string
}

export interface GanttTaskItem {
  id: string
  name: string
  phase: string
  assigneeName: string
  assigneeInitials: string
  assigneeAvatarColor?: 'slate' | 'blue' | 'default'
  status: GanttStatus
  project: string
  startDate: string | null
  endDate: string | null
  progress: number
  barLabel?: string
  barProgress?: string
  barColor?: 'blue' | 'green'
}

interface ApiGanttTask {
  id: string
  title: string
  description?: string | null
  category?: string
  projectId?: string
  assignedToId?: string | null
  assigneeName?: string | null
  status: ApiTaskStatus
  approvedAt?: string | null
  startDate?: string | null
  endDate?: string | null
  dueDate?: string | null
  progress?: number
}

interface TimelineColumn {
  key: string
  label: string
  isToday: boolean
  startDate: Date
  endDate: Date
}

function parseLocalDate(value?: string | null): Date | null {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

function toGanttTask(task: ApiGanttTask, projectId: string): GanttTaskItem {
  const status: GanttStatus = task.status === 'TODO'
    ? 'To Do'
    : task.status === 'IN_PROGRESS'
      ? 'In Progress'
      : task.approvedAt
        ? 'Completed'
        : 'Submitted'
  const assigneeName = task.assigneeName || 'Unassigned'
  const progress = task.status === 'TODO' ? 0 : task.status === 'IN_PROGRESS' ? 50 : 100

  return {
    id: task.id,
    name: task.title,
    phase: task.description || task.category || 'Task',
    assigneeName,
    assigneeInitials: initialsFor(assigneeName),
    status,
    project: projectId,
    startDate: task.startDate ?? task.dueDate ?? null,
    endDate: task.endDate ?? task.dueDate ?? null,
    progress,
    barLabel: task.title,
    barProgress: String(progress) + '%',
    barColor: status === 'Completed' || status === 'Submitted' ? 'blue' : 'green',
  }
}

function buildTimelineColumns(tasks: GanttTaskItem[], view: 'Days' | 'Weeks' | 'Months'): TimelineColumn[] {
  const taskDates = tasks.flatMap((task) => [parseLocalDate(task.startDate), parseLocalDate(task.endDate)])
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())
  const today = new Date()
  let from = taskDates[0] ?? new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let to = taskDates[taskDates.length - 1] ?? new Date(from)

  if (view === 'Weeks') {
    from = new Date(from)
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7))
    to = new Date(to)
    to.setDate(to.getDate() + (6 - ((to.getDay() + 6) % 7)))
    if (!taskDates.length) to.setDate(from.getDate() + 34)
  } else if (view === 'Months') {
    from = new Date(from.getFullYear(), from.getMonth(), 1)
    to = new Date(to.getFullYear(), to.getMonth() + 1, 0)
    if (!taskDates.length) to = new Date(from.getFullYear(), from.getMonth() + 5, 0)
  } else if (!taskDates.length) {
    to.setDate(to.getDate() + 5)
  }

  const columns: TimelineColumn[] = []
  let cursor = new Date(from)
  while (cursor <= to) {
    const startDate = new Date(cursor)
    let endDate = new Date(cursor)
    let label = ''

    if (view === 'Days') {
      label = startDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
      cursor.setDate(cursor.getDate() + 1)
    } else if (view === 'Weeks') {
      endDate.setDate(endDate.getDate() + 6)
      label = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' - ' + endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      cursor.setDate(cursor.getDate() + 7)
    } else {
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      label = startDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      cursor = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)
    }

    columns.push({
      key: 'timeline-' + columns.length,
      label,
      isToday: today >= startDate && today <= endDate,
      startDate,
      endDate,
    })
  }
  return columns
}

function getTaskColumnSpan(task: GanttTaskItem, columns: TimelineColumn[]) {
  const start = parseLocalDate(task.startDate)
  const end = parseLocalDate(task.endDate ?? task.startDate)
  if (!start || !end) return null

  const first = columns.findIndex((column) => column.endDate >= start)
  let last = -1
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    if (columns[index].startDate <= end) {
      last = index
      break
    }
  }
  if (first < 0 || last < first) return null
  return { start: first, end: last }
}

export function GanttPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<GanttTaskItem[]>([])
  const [activeView, setActiveView] = useState<'Days' | 'Weeks' | 'Months'>('Weeks')
  const timelineColumns = useMemo(() => buildTimelineColumns(tasks, activeView), [tasks, activeView])

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [projectsList, setProjectsList] = useState<Array<{
    id: string
    name: string
    assignments?: Array<{ projectRole?: string | null; intern?: { user?: { id?: string } } }>
  }>>([])
  const [selectedStatus, setSelectedStatus] = useState('All statuses')
  const [selectedDate, setSelectedDate] = useState('Select date')
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null)

  // Modals & Notifications
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<GanttTaskItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New task form state
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskPhase, setNewTaskPhase] = useState('Phase 1')
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([])
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskStatus, setNewTaskStatus] = useState<NewTaskStatus>('To Do')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTabBarLabel, setNewTabBarLabel] = useState('')

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedProject !== 'All Projects' && task.project !== selectedProject) return false
      if (selectedStatus !== 'All statuses' && task.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = task.name.toLowerCase().includes(query)
        const matchesPhase = task.phase.toLowerCase().includes(query)
        const matchesAssignee = task.assigneeName.toLowerCase().includes(query)
        if (!matchesName && !matchesPhase && !matchesAssignee) return false
      }
      return true
    })
  }, [tasks, selectedProject, selectedStatus, searchQuery])

  const totalTasksCount = tasks.length
  const activeNowCount = tasks.filter((t) => t.status === 'In Progress').length
  const pendingCount = tasks.filter((t) => t.status === 'To Do').length
  const blockedCount = tasks.filter((t) => t.status === 'Blocked').length

  const isProjectScrumMaster = projectsList
    .find((project) => project.id === selectedProject)?.assignments?.some((assignment) =>
      assignment.intern?.user?.id === user?.id && assignment.projectRole === 'Scrum Master',
    ) ?? false
  const canManageTasks = user?.role === 'ADMIN' || user?.role === 'MENTOR' ||
    (user?.role === 'INTERN' && isProjectScrumMaster)

  const handleExport = () => {
    setToastMessage(`Timeline for ${selectedProject} exported successfully.`)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageTasks) return
    if (!newTaskName.trim()) return

    const selectedMember = teamMembers.find((member) => member.id === newTaskAssignee)
    if (!selectedProject || !selectedMember) {
      setToastMessage('Choose a project team member to assign this task to.')
      return
    }
    if (!newTaskStartDate || !newTaskDueDate) {
      setToastMessage('Choose a start date and due date.')
      return
    }
    if (newTaskDueDate < newTaskStartDate) {
      setToastMessage('The due date must be on or after the start date.')
      return
    }

    const apiStatus: Record<NewTaskStatus, ApiTaskStatus> = {
      'To Do': 'TODO',
      'In Progress': 'IN_PROGRESS',
      Completed: 'COMPLETED',
    }
    const payload = {
      title: newTaskName.trim(),
      projectId: selectedProject,
      assignedToId: selectedMember.id,
      description: newTaskPhase.trim() || undefined,
      priority: 'MEDIUM' as const,
      status: apiStatus[newTaskStatus],
      startDate: newTaskStartDate,
      dueDate: newTaskDueDate,
    }

    try {
      const savedTask = await Tasks.create(payload)
      const ganttTask = toGanttTask({
        ...savedTask,
        assigneeName: selectedMember.name,
      } as ApiGanttTask, selectedProject)
      setTasks((prev) => [...prev, {
        ...ganttTask,
        barLabel: newTabBarLabel.trim() || newTaskName.trim(),
      }])

      setIsAddModalOpen(false)
      setNewTaskName('')
      setNewTaskPhase('Phase 1')
      setNewTaskAssignee('')
      setNewTaskStatus('To Do')
      setNewTaskStartDate('')
      setNewTaskDueDate('')
      setNewTabBarLabel('')
      setToastMessage('Task successfully saved to database!')
    } catch (error: any) {
      console.error(error)
      setToastMessage(error.response?.data?.message || 'Unable to create task. Check the project role and required fields.')
    }
  }

  // WIRED TO BACKEND DELETE API
  const handleDeleteTask = async (id: string) => {
    if (!canManageTasks) return
    try {
      await Tasks.delete(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setSelectedTask(null)
      setToastMessage('Task deleted from database.')
    } catch (error: any) {
      console.error(error)
      setToastMessage('Permission Denied: Cannot delete this task.')
    }
  }

  useEffect(() => {
    if (!selectedProject || selectedProject === 'All Projects') {
      setTeamMembers([])
      setNewTaskAssignee('')
      return
    }

    let cancelled = false
    Projects.get(selectedProject)
      .then((response) => {
        if (cancelled) return
        const project = response.data as unknown as {
          assignments?: Array<{
            internId: string
            projectRole?: string | null
            intern?: { user?: { id?: string; fullName?: string } }
          }>
        }
        const members = (project.assignments ?? [])
          .filter((assignment) => assignment.internId && assignment.intern?.user?.fullName)
          .map((assignment) => ({
            id: assignment.internId,
            name: assignment.intern!.user!.fullName!,
          }))
        setTeamMembers(members)
        setNewTaskAssignee((current) =>
          members.some((member) => member.id === current) ? current : members[0]?.id ?? '',
        )
      })
      .catch((err) => {
        if (!cancelled) {
          setTeamMembers([])
          setNewTaskAssignee('')
          console.error('Failed to load project team:', err)
        }
      })

    return () => { cancelled = true }
  }, [selectedProject, user?.id])

  useEffect(() => {
    let cancelled = false
    const projectIds = selectedProject === 'All Projects'
      ? projectsList.map((project) => project.id)
      : selectedProject ? [selectedProject] : []

    const loadTasks = async () => {
      if (!projectIds.length) {
        setTasks([])
        return
      }

      try {
        const projectTasks = await Promise.all(projectIds.map(async (projectId) => {
          const data = await Tasks.getGanttData(projectId)
          return data.map((task) => toGanttTask(task, projectId))
        }))
        if (!cancelled) setTasks(projectTasks.flat())
      } catch (err) {
        if (!cancelled) {
          setTasks([])
          console.error('Failed to load Gantt data:', err)
        }
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadTasks()
    }
    void loadTasks()
    const intervalId = window.setInterval(() => void loadTasks(), 30_000)
    window.addEventListener('focus', refreshWhenVisible)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [selectedProject, projectsList])

  useEffect(() => {
    Projects.list()
      .then((response) => {
        const data = response.data.filter((project) =>
          user?.role !== 'MENTOR' || project.supervisor?.user?.id === user.id,
        )
        setProjectsList(data)
        if (data.length > 0) {
          setSelectedProject(data[0].id)
        }
      })
      .catch(err => console.error("Failed to load projects:", err))
  }, [user?.id, user?.role])

  return (
    <main className={styles.page}>
      <section className={styles.metricsGrid} aria-label="Task metrics summary">
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
            <Check size={20} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{totalTasksCount}</p>
            <p className={styles.statLabel}>Total Tasks</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
            <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{activeNowCount}</p>
            <p className={styles.statLabel}>Active now</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconAmber}`}>
            <FileText size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{pendingCount}</p>
            <p className={styles.statLabel}>Pending</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconRed}`}>
            <AlertTriangle size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{blockedCount}</p>
            <p className={styles.statLabel}>Blocked</p>
          </div>
        </div>
      </section>

      <section className={styles.controlBar} aria-label="Gantt timeline controls">
        <div className={styles.filterGroup}>
          <div className={styles.searchInputWrapper}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              {projectsList.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} aria-hidden="true" />
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All statuses">All statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
            <ChevronDown size={16} className={styles.selectChevron} aria-hidden="true" />
          </div>

          <button
            type="button"
            className={styles.datePickerButton}
            onClick={(e) => setDateAnchorEl(e.currentTarget)}
            aria-label="Select date"
          >
            <Calendar size={16} strokeWidth={2} aria-hidden="true" />
            <span>{selectedDate}</span>
          </button>
          <Menu
            anchorEl={dateAnchorEl}
            open={Boolean(dateAnchorEl)}
            onClose={() => setDateAnchorEl(null)}
            slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minWidth: 150 } } }}
          >
            {['Select date', 'Oct 05 - Oct 09', 'Oct 12 - Oct 16', 'Oct 19 - Oct 23', 'Oct 2026'].map((dateOption) => (
              <MenuItem
                key={dateOption}
                selected={dateOption === selectedDate}
                onClick={() => {
                  setSelectedDate(dateOption)
                  setDateAnchorEl(null)
                  setToastMessage(`Timeline focused on ${dateOption}`)
                }}
                sx={{ fontSize: 13.5 }}
              >
                {dateOption}
              </MenuItem>
            ))}
          </Menu>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            id="gantt-export-btn"
          >
            <Share size={16} strokeWidth={2} aria-hidden="true" />
            <span>Export</span>
          </button>

          {canManageTasks && (
            <button
              type="button"
              className={styles.addTaskButton}
              onClick={() => setIsAddModalOpen(true)}
              id="gantt-add-task-btn"
            >
              <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Add New Task</span>
            </button>
          )}
        </div>
      </section>

      <section className={styles.timelineCard} aria-labelledby="timeline-card-title">
        <div className={styles.timelineHeader}>
          <h2 id="timeline-card-title" className={styles.timelineTitle}>
            Project Timeline
          </h2>

          <div className={styles.viewSwitcher} role="tablist" aria-label="Timeline view granularity">
            {(['Days', 'Weeks', 'Months'] as const).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={activeView === view}
                className={`${styles.viewButton} ${activeView === view ? styles.viewButtonActive : ''}`}
                onClick={() => setActiveView(view)}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.ganttScrollWrapper}>
          <table className={styles.ganttTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th scope="col" style={{ width: '22%' }}>Task Name</th>
                <th scope="col" style={{ width: '16%' }}>Assignee</th>
                <th scope="col" style={{ width: '12%' }}>Status</th>
                {timelineColumns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`${styles.dateColHeader} ${col.isToday ? styles.todayDateColHeader : ''}`}
                    style={{ width: `${50 / timelineColumns.length}%` }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const statusClass =
                  task.status === 'Completed' || task.status === 'Submitted'
                    ? styles.statusCompleted
                    : task.status === 'In Progress'
                      ? styles.statusActive
                      : task.status === 'To Do'
                        ? styles.statusPending
                        : styles.statusRejected

                const avatarColorClass =
                  task.assigneeAvatarColor === 'blue'
                    ? styles.avatarBlue
                    : task.assigneeAvatarColor === 'slate'
                      ? styles.avatarSlate
                      : ''

                const taskSpan = getTaskColumnSpan(task, timelineColumns)

                return (
                  <tr key={task.id} className={styles.taskRow}>
                    <td className={styles.taskMetaCell}>
                      <p className={styles.taskName}>{task.name}</p>
                      <p className={styles.taskPhase}>{task.phase}</p>
                    </td>

                    <td className={styles.assigneeCell}>
                      <div className={styles.assigneeWrapper}>
                        <span className={`${styles.assigneeAvatar} ${avatarColorClass}`}>
                          {task.assigneeInitials}
                        </span>
                        <span className={styles.assigneeName}>{task.assigneeName}</span>
                      </div>
                    </td>

                    <td className={styles.statusCell}>
                      <span className={`${styles.statusPill} ${statusClass}`}>
                        {task.status}
                      </span>
                    </td>

                    {timelineColumns.map((col, colIndex) => {
                      const isBarStart = taskSpan !== null && taskSpan.start === colIndex
                      const colSpan = taskSpan !== null ? taskSpan.end - taskSpan.start + 1 : 1
                      const barWidth = `calc(${colSpan * 100}% - 12px)`

                      return (
                        <td key={col.key} className={styles.timelineCell}>
                          {isBarStart && (
                            <div
                              className={`${styles.timelineBar} ${task.barColor === 'green' ? styles.barGreen : styles.barBlue
                                }`}
                              style={{ width: barWidth }}
                              onClick={() => setSelectedTask(task)}
                              title={`${task.name}: ${task.barLabel ?? ''}`}
                              role="button"
                              tabIndex={0}
                            >
                              <span className={styles.barTitle}>{task.barLabel}</span>
                              {task.barProgress && (
                                <span className={styles.barPercent}>{task.barProgress}</span>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add New Task Modal */}
      {canManageTasks && (
        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Gantt Task"
          maxWidth="sm"
          fullWidth
          actions={
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
              <Button appearance="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleCreateTask}>
                Add Task
              </Button>
            </div>
          }
        >
          <DialogContent dividers sx={{ borderBottom: '1px solid #E2E8F0' }}>
            <form className={styles.modalForm} onSubmit={handleCreateTask} id="new-gantt-task-form">
              <div className={styles.formGroup}>
                <label htmlFor="task-name-input" className={styles.formLabel}>
                  Task Name
                </label>
                <input
                  id="task-name-input"
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. End-to-End Testing"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="task-phase-input" className={styles.formLabel}>
                    Phase / Category
                  </label>
                  <input
                    id="task-phase-input"
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Phase 2"
                    value={newTaskPhase}
                    onChange={(e) => setNewTaskPhase(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="task-assignee-select" className={styles.formLabel}>
                    Assignee
                  </label>
                  <select
                    id="task-assignee-select"
                    className={styles.modalSelect}
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    required
                    disabled={teamMembers.length === 0}
                  >
                    <option value="">Choose a project team member</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="task-status-select" className={styles.formLabel}>
                    Status
                  </label>
                  <select
                    id="task-status-select"
                    className={styles.modalSelect}
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as NewTaskStatus)}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="task-bar-label" className={styles.formLabel}>
                    Bar Label (Optional)
                  </label>
                  <input
                    id="task-bar-label"
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Test Suite V1"
                    value={newTabBarLabel}
                    onChange={(e) => setNewTabBarLabel(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="task-start-col" className={styles.formLabel}>
                    Timeline Start Day
                  </label>
                  <input
                    id="task-start-col"
                    type="date"
                    className={styles.formInput}
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="task-end-col" className={styles.formLabel}>
                    Timeline End Day
                  </label>
                  <input
                    id="task-end-col"
                    type="date"
                    className={styles.formInput}
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    min={newTaskStartDate || undefined}
                    required
                  />
                </div>
              </div>
            </form>
          </DialogContent>
        </Modal>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          open={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.name}
          maxWidth="xs"
          fullWidth
          actions={
            <div style={{ display: 'flex', gap: '10px', justifyContent: canManageTasks ? 'space-between' : 'flex-end', width: '100%' }}>
              {canManageTasks && (
                <Button appearance="danger" onClick={() => handleDeleteTask(selectedTask.id)}>
                  Delete Task
                </Button>
              )}
              <Button appearance="secondary" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </div>
          }
        >
          <DialogContent dividers sx={{ borderBottom: '1px solid #E2E8F0', fontSize: '13.5px' }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Phase:</strong> {selectedTask.phase}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Assignee:</strong> {selectedTask.assigneeName}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Status:</strong> {selectedTask.status}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Project:</strong> {selectedTask.project}
            </p>
            {selectedTask.barLabel && (
              <p style={{ margin: 0 }}>
                <strong>Deliverable:</strong> {selectedTask.barLabel} {selectedTask.barProgress ? `(${selectedTask.barProgress})` : ''}
              </p>
            )}
          </DialogContent>
        </Modal>
      )}

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity={toastMessage?.includes('Denied') || toastMessage?.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </main>
  )
}

export default GanttPage
