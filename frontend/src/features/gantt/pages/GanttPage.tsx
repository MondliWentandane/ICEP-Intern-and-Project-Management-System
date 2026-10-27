import { useState, useMemo } from 'react'
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
  UserCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import styles from './GanttPage.module.css'

// Updated statuses based on workflow document
export type GanttStatus = 'To Do' | 'In Progress' | 'Submitted' | 'Completed' | 'Blocked'
export type UserRole = 'Intern' | 'Scrum Master' | 'Mentor'

export interface GanttTaskItem {
  id: string
  name: string
  phase: string
  assigneeName: string
  assigneeInitials: string
  assigneeAvatarColor?: 'slate' | 'blue' | 'default'
  status: GanttStatus
  project: string
  startCol?: number
  endCol?: number
  barLabel?: string
  barProgress?: string
  barColor?: 'blue' | 'green'
}

const initialTasks: GanttTaskItem[] = [
  {
    id: 'task-1',
    name: 'Project Kickoff',
    phase: 'Phase 1',
    assigneeName: 'Moeez S.',
    assigneeInitials: 'MS',
    status: 'Completed',
    project: 'Software Dev Alpha',
    startCol: 0,
    endCol: 1,
    barLabel: 'Kickoff Meeting',
    barProgress: '100%',
    barColor: 'blue',
  },
  {
    id: 'task-2',
    name: 'Requirements Gathering',
    phase: 'Phase 1',
    assigneeName: 'Thabo M.',
    assigneeInitials: 'TM',
    status: 'Completed',
    project: 'Software Dev Alpha',
    startCol: 2,
    endCol: 4,
    barLabel: 'Gather Specs',
    barProgress: '100%',
    barColor: 'blue',
  },
  {
    id: 'task-3',
    name: 'Database Schema Design',
    phase: 'Phase 2',
    assigneeName: 'Moeez S.',
    assigneeInitials: 'MS',
    status: 'In Progress',
    project: 'Software Dev Alpha',
    startCol: 5,
    endCol: 5,
    barLabel: 'Schema V1',
    barColor: 'green',
  },
  {
    id: 'task-4',
    name: 'Develop API Endpoints',
    phase: 'Phase 2',
    assigneeName: 'Jane S.',
    assigneeInitials: 'JS',
    assigneeAvatarColor: 'blue',
    status: 'In Progress',
    project: 'Software Dev Alpha',
    startCol: 5,
    endCol: 5,
    barLabel: 'Core APIs',
    barColor: 'green',
  },
  {
    id: 'task-5',
    name: 'Frontend UI Integration',
    phase: 'Phase 3',
    assigneeName: 'Thabo M.',
    assigneeInitials: 'TM',
    status: 'To Do',
    project: 'Software Dev Alpha',
  },
  {
    id: 'task-6',
    name: 'Security Audit',
    phase: 'Reviews',
    assigneeName: 'Ron J.',
    assigneeInitials: 'RJ',
    assigneeAvatarColor: 'slate',
    status: 'Blocked',
    project: 'Software Dev Alpha',
  },
]

const timelineColumns = [
  { key: 'col-0', label: 'Mon 05', isToday: false },
  { key: 'col-1', label: 'Tue 06', isToday: false },
  { key: 'col-2', label: 'Wed 07', isToday: false },
  { key: 'col-3', label: 'Thu 08', isToday: false },
  { key: 'col-4', label: 'Fri 09', isToday: false },
  { key: 'col-5', label: 'Mon 12', isToday: true },
]

export function GanttPage() {
  const [tasks, setTasks] = useState<GanttTaskItem[]>(initialTasks)
  const [activeView, setActiveView] = useState<'Days' | 'Weeks' | 'Months'>('Weeks')
  
  // Simulated Authentication / Role State to demonstrate workflow restrictions
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Scrum Master')

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState('Software Dev Alpha')
  const [selectedStatus, setSelectedStatus] = useState('All statuses')
  const [selectedDate, setSelectedDate] = useState('Select date')
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null)
  const [roleAnchorEl, setRoleAnchorEl] = useState<null | HTMLElement>(null)

  // Modals & Notifications
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<GanttTaskItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New task form state
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskPhase, setNewTaskPhase] = useState('Phase 1')
  const [newTaskAssignee, setNewTaskAssignee] = useState('Moeez S.')
  const [newTaskStatus, setNewTaskStatus] = useState<GanttStatus>('In Progress')
  const [newTaskStartCol, setNewTaskStartCol] = useState('0')
  const [newTaskEndCol, setNewTaskEndCol] = useState('1')
  const [newTabBarLabel, setNewTabBarLabel] = useState('')

  // Derived filtered tasks
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

  // Computed metrics mapped accurately to specific workflow task states
  const totalTasksCount = tasks.length === 6 ? 24 : tasks.length
  const activeNowCount = tasks.filter((t) => t.status === 'In Progress').length + (tasks.length === 6 ? 6 : 0)
  const pendingCount = tasks.filter((t) => t.status === 'To Do').length + (tasks.length === 6 ? 11 : 0)
  const blockedCount = tasks.filter((t) => t.status === 'Blocked').length + (tasks.length === 6 ? 3 : 0)

  // Role Permissions
  const canManageTasks = currentUserRole === 'Scrum Master' || currentUserRole === 'Mentor'

  const handleExport = () => {
    setToastMessage(`Timeline for ${selectedProject} exported successfully.`)
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageTasks) return // Security check mirroring backend validation
    if (!newTaskName.trim()) return

    const initials = newTaskAssignee
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()

    const start = Number(newTaskStartCol)
    const end = Number(newTaskEndCol)

    const newTask: GanttTaskItem = {
      id: `task-${Date.now()}`,
      name: newTaskName.trim(),
      phase: newTaskPhase,
      assigneeName: newTaskAssignee,
      assigneeInitials: initials,
      status: newTaskStatus,
      project: selectedProject === 'All Projects' ? 'Software Dev Alpha' : selectedProject,
      startCol: start,
      endCol: end,
      barLabel: newTabBarLabel.trim() || newTaskName.trim(),
      barProgress: newTaskStatus === 'Completed' ? '100%' : '50%',
      barColor: newTaskStatus === 'Completed' ? 'blue' : 'green',
    }

    setTasks((prev) => [...prev, newTask])
    setIsAddModalOpen(false)
    setNewTaskName('')
    setNewTabBarLabel('')
    setToastMessage(`Task "${newTask.name}" added to Gantt timeline.`)
  }

  const handleDeleteTask = (id: string) => {
    if (!canManageTasks) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setSelectedTask(null)
    setToastMessage('Task deleted.')
  }

  return (
    <main className={styles.page}>
      
      {/* Simulation Banner for testing roles */}
      <Alert severity="info" sx={{ borderRadius: 2, display: 'flex', alignItems: 'center' }}>
        <strong>Workflow Simulator:</strong> You are currently viewing this page as a <strong>{currentUserRole}</strong>. 
        {currentUserRole === 'Intern' 
          ? " The Gantt chart is read-only. You cannot add or delete tasks." 
          : " You have permission to add, edit, and plan tasks."}
      </Alert>

      {/* 4 Summary / Metric Cards */}
      <section className={styles.metricsGrid} aria-label="Task metrics summary">
        {/* Metric 1: Total Tasks */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
            <Check size={20} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{totalTasksCount}</p>
            <p className={styles.statLabel}>Total Tasks</p>
          </div>
        </div>

        {/* Metric 2: Active now (In Progress) */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
            <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{activeNowCount}</p>
            <p className={styles.statLabel}>Active now</p>
          </div>
        </div>

        {/* Metric 3: Pending (To Do) */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconAmber}`}>
            <FileText size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{pendingCount}</p>
            <p className={styles.statLabel}>Pending</p>
          </div>
        </div>

        {/* Metric 4: Blocked */}
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

      {/* Control Bar: Filters & Actions */}
      <section className={styles.controlBar} aria-label="Gantt timeline controls">
        <div className={styles.filterGroup}>
          {/* Search Tasks Input */}
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

          {/* Project Dropdown */}
          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              <option value="Software Dev Alpha">Software Dev Alpha</option>
              <option value="Network Security Audit">Network Security Audit</option>
              <option value="Data Migration Phase 2">Data Migration Phase 2</option>
              <option value="Mobile App Beta">Mobile App Beta</option>
              <option value="All Projects">All Projects</option>
            </select>
            <ChevronDown size={16} className={styles.selectChevron} aria-hidden="true" />
          </div>

          {/* Status Dropdown */}
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

          {/* Date Picker Button */}
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

        {/* Action Buttons */}
        <div className={styles.actionsGroup}>
          
          {/* Mock Role Switcher (For demonstration purposes) */}
          <button type="button" className={styles.exportButton} onClick={(e) => setRoleAnchorEl(e.currentTarget)}>
            <UserCircle2 size={16} strokeWidth={2} aria-hidden="true" />
            <span>View As: {currentUserRole}</span>
          </button>
          <Menu
            anchorEl={roleAnchorEl}
            open={Boolean(roleAnchorEl)}
            onClose={() => setRoleAnchorEl(null)}
            slotProps={{ paper: { sx: { borderRadius: '10px', minWidth: 150 } } }}
          >
            {(['Intern', 'Scrum Master', 'Mentor'] as UserRole[]).map((role) => (
              <MenuItem
                key={role}
                selected={role === currentUserRole}
                onClick={() => { setCurrentUserRole(role); setRoleAnchorEl(null); }}
                sx={{ fontSize: 13.5 }}
              >
                {role}
              </MenuItem>
            ))}
          </Menu>

          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            id="gantt-export-btn"
          >
            <Share size={16} strokeWidth={2} aria-hidden="true" />
            <span>Export</span>
          </button>

          {/* Only render if user role permits task creation */}
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

      {/* Gantt Timeline Card */}
      <section className={styles.timelineCard} aria-labelledby="timeline-card-title">
        {/* Timeline Header */}
        <div className={styles.timelineHeader}>
          <h2 id="timeline-card-title" className={styles.timelineTitle}>
            {selectedProject === 'All Projects' ? 'Software Dev Alpha' : selectedProject} Timeline
          </h2>

          {/* View Switcher (Days, Weeks, Months) */}
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

        {/* Gantt Table & Grid */}
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
                // Map the workflow document statuses to the existing CSS class color profiles
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

                const hasBar = task.startCol !== undefined && task.endCol !== undefined

                return (
                  <tr key={task.id} className={styles.taskRow}>
                    {/* Task Meta */}
                    <td className={styles.taskMetaCell}>
                      <p className={styles.taskName}>{task.name}</p>
                      <p className={styles.taskPhase}>{task.phase}</p>
                    </td>

                    {/* Assignee */}
                    <td className={styles.assigneeCell}>
                      <div className={styles.assigneeWrapper}>
                        <span className={`${styles.assigneeAvatar} ${avatarColorClass}`}>
                          {task.assigneeInitials}
                        </span>
                        <span className={styles.assigneeName}>{task.assigneeName}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusPill} ${statusClass}`}>
                        {task.status}
                      </span>
                    </td>

                    {/* 6 Timeline Day Columns */}
                    {timelineColumns.map((col, colIndex) => {
                      const isBarStart = hasBar && task.startCol === colIndex
                      const colSpan = hasBar ? task.endCol! - task.startCol! + 1 : 1
                      const barWidth = `calc(${colSpan * 100}% - 12px)`

                      return (
                        <td key={col.key} className={styles.timelineCell}>
                          {isBarStart && (
                            <div
                              className={`${styles.timelineBar} ${
                                task.barColor === 'green' ? styles.barGreen : styles.barBlue
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

      {/* Add New Task Modal (Only accessible by roles with manage privileges) */}
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
                  >
                    <option value="Moeez S.">Moeez S.</option>
                    <option value="Thabo M.">Thabo M.</option>
                    <option value="Jane S.">Jane S.</option>
                    <option value="Ron J.">Ron J.</option>
                    <option value="Pat Naidoo">Pat Naidoo</option>
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
                    onChange={(e) => setNewTaskStatus(e.target.value as GanttStatus)}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
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
                  <select
                    id="task-start-col"
                    className={styles.modalSelect}
                    value={newTaskStartCol}
                    onChange={(e) => setNewTaskStartCol(e.target.value)}
                  >
                    <option value="0">Mon 05</option>
                    <option value="1">Tue 06</option>
                    <option value="2">Wed 07</option>
                    <option value="3">Thu 08</option>
                    <option value="4">Fri 09</option>
                    <option value="5">Mon 12</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="task-end-col" className={styles.formLabel}>
                    Timeline End Day
                  </label>
                  <select
                    id="task-end-col"
                    className={styles.modalSelect}
                    value={newTaskEndCol}
                    onChange={(e) => setNewTaskEndCol(e.target.value)}
                  >
                    <option value="0">Mon 05</option>
                    <option value="1">Tue 06</option>
                    <option value="2">Wed 07</option>
                    <option value="3">Thu 08</option>
                    <option value="4">Fri 09</option>
                    <option value="5">Mon 12</option>
                  </select>
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

      {/* Snackbar Notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="success"
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </main>
  )
}

export default GanttPage