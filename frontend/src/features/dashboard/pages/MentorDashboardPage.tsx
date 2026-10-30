import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import {
  Calendar,
  CheckCircle2,
  Folder,
  MoreHorizontal,
  X,
} from 'lucide-react'
import styles from './MentorDashboardPage.module.css'

interface TeamMember {
  initials: string
  colorClass: string
}

// Same values as the ProjectStatus enum in the Prisma schema.
type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'

const statusLabels: Record<ProjectStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
}

interface ProjectItem {
  id: string
  name: string
  groupName?: string
  description?: string
  team: TeamMember[]
  status: ProjectStatus
  progress: number
  dueDate: string
  colorClass: string
}

interface DeadlineItem {
  id: string
  month: string
  day: string
  title: string
  project: string
  colorVariant: 'red' | 'amber' | 'blue'
}

const initialProjects: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'Software Dev Alpha',
    groupName: 'Group A',
    team: [
      { initials: 'MS', colorClass: styles.avatarMS },
      { initials: 'TM', colorClass: styles.avatarTM },
      { initials: 'JS', colorClass: styles.avatarJS },
    ],
    status: 'IN_PROGRESS',
    progress: 75,
    dueDate: 'Nov 15',
    colorClass: styles.barBlue,
  },
  {
    id: 'proj-2',
    name: 'Network Security Audit',
    groupName: 'Group B',
    team: [
      { initials: 'RJ', colorClass: styles.avatarRJ },
      { initials: 'MS', colorClass: styles.avatarMS },
    ],
    status: 'ON_HOLD',
    progress: 30,
    dueDate: 'Oct 28',
    colorClass: styles.barOrange,
  },
  {
    id: 'proj-3',
    name: 'Data Migration Phase 2',
    groupName: 'Group C',
    team: [
      { initials: 'TN', colorClass: styles.avatarTN },
      { initials: 'AB', colorClass: styles.avatarAB },
    ],
    status: 'IN_PROGRESS',
    progress: 95,
    dueDate: 'Oct 12',
    colorClass: styles.barGreen,
  },
  {
    id: 'proj-4',
    name: 'Mobile App Beta',
    groupName: 'Group D',
    team: [
      { initials: 'JS', colorClass: styles.avatarJS },
      { initials: 'MS', colorClass: styles.avatarMS },
      { initials: 'TM', colorClass: styles.avatarTM },
    ],
    status: 'IN_PROGRESS',
    progress: 45,
    dueDate: 'Dec 01',
    colorClass: styles.barBlue,
  },
]

// Demo tasks per project until the tasks API is connected. Statuses use the schema's TaskStatus values.
const demoTasks: Record<string, ProjectTask[]> = {
  'proj-1': [
    { id: 't1', title: 'Database Schema V2', status: 'COMPLETED', assignee: 'MS', startDate: '2026-09-01', dueDate: '2026-10-15' },
    { id: 't2', title: 'API endpoints', status: 'IN_PROGRESS', assignee: 'TM', startDate: '2026-10-05', dueDate: '2026-11-05' },
    { id: 't3', title: 'Frontend screens', status: 'IN_PROGRESS', assignee: 'JS', startDate: '2026-10-12', dueDate: '2026-11-12' },
    { id: 't4', title: 'Testing and fixes', status: 'TODO', assignee: 'MS', startDate: '2026-11-02', dueDate: '2026-11-15' },
  ],
  'proj-2': [
    { id: 't5', title: 'Scope and asset list', status: 'COMPLETED', assignee: 'RJ', startDate: '2026-09-20', dueDate: '2026-10-05' },
    { id: 't6', title: 'Vulnerability scan', status: 'IN_PROGRESS', assignee: 'MS', startDate: '2026-10-01', dueDate: '2026-10-20' },
    { id: 't7', title: 'Security patch sign-off', status: 'TODO', assignee: 'RJ', startDate: '2026-10-15', dueDate: '2026-10-28' },
  ],
  'proj-3': [
    { id: 't8', title: 'Data mapping', status: 'COMPLETED', assignee: 'TN', startDate: '2026-09-01', dueDate: '2026-09-25' },
    { id: 't9', title: 'Migration scripts', status: 'COMPLETED', assignee: 'AB', startDate: '2026-09-20', dueDate: '2026-10-05' },
    { id: 't10', title: 'Final data validation', status: 'IN_PROGRESS', assignee: 'TN', startDate: '2026-10-05', dueDate: '2026-10-12' },
  ],
  'proj-4': [
    { id: 't11', title: 'UI design handoff', status: 'COMPLETED', assignee: 'JS', startDate: '2026-10-01', dueDate: '2026-10-22' },
    { id: 't12', title: 'Core screens', status: 'IN_PROGRESS', assignee: 'MS', startDate: '2026-10-15', dueDate: '2026-11-15' },
    { id: 't13', title: 'Beta testing', status: 'TODO', assignee: 'TM', startDate: '2026-11-10', dueDate: '2026-12-01' },
  ],
}

const initialDeadlines: DeadlineItem[] = [
  {
    id: 'dl-1',
    month: 'OCT',
    day: '08',
    title: 'Security Patch Sign-off',
    project: 'Network Security Audit',
    colorVariant: 'red',
  },
  {
    id: 'dl-2',
    month: 'OCT',
    day: '12',
    title: 'Final Data Validation',
    project: 'Data Migration Phase 2',
    colorVariant: 'amber',
  },
  {
    id: 'dl-3',
    month: 'OCT',
    day: '15',
    title: 'Database Schema V2',
    project: 'Software Dev Alpha',
    colorVariant: 'blue',
  },
  {
    id: 'dl-4',
    month: 'OCT',
    day: '22',
    title: 'UI Design Handoff',
    project: 'Mobile App Beta',
    colorVariant: 'blue',
  },
]

// ---------------------------------------------------------------------------
// Project popup: opens over the dashboard with Overview, Task board and Gantt chart tabs
// ---------------------------------------------------------------------------

// Same values as the TaskStatus enum in the Prisma schema.
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

interface ProjectTask {
  id: string
  title: string
  status: TaskStatus
  assignee?: string
  /** ISO date, e.g. 2026-10-15 */
  startDate: string
  dueDate: string
}

interface ProjectSummary {
  id: string
  name: string
  groupName?: string
  description?: string
  statusLabel: string
  progress: number
  dueDate: string
  team: string[]
  tasks: ProjectTask[]
}

const columns: Array<{ status: TaskStatus; label: string; color: string }> = [
  { status: 'TODO', label: 'To do', color: '#94A3B8' },
  { status: 'IN_PROGRESS', label: 'In progress', color: 'var(--icep-completed, #3B82F6)' },
  { status: 'COMPLETED', label: 'Completed', color: 'var(--icep-active, #16A34A)' },
]
const statusColor = Object.fromEntries(columns.map((c) => [c.status, c.color])) as Record<TaskStatus, string>

const shortDate = (iso: string | number) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const at = (iso: string) => new Date(`${iso}T00:00:00`).getTime()

function Overview({ project }: { project: ProjectSummary }) {
  const done = project.tasks.filter((t) => t.status === 'COMPLETED').length
  return (
    <Stack spacing={2}>
      {project.description && <Typography color="text.secondary">{project.description}</Typography>}
      <Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Progress</Typography>
          <Typography variant="body2">{project.progress}%</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={project.progress} sx={{ height: 8, borderRadius: 4 }} aria-label="Project progress" />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' } }}>
        {[
          ['Status', project.statusLabel],
          ['Due', project.dueDate],
          ['Group', project.groupName ?? '—'],
          ['Tasks done', `${done} of ${project.tasks.length}`],
        ].map(([label, value]) => (
          <Box key={label}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Team</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {project.team.length === 0 ? <Typography variant="body2">No team members yet.</Typography> : project.team.map((initials, index) => (
            <Box key={`${initials}-${index}`} title={`Team member ${initials}`} sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#E8EEF5', color: 'var(--icep-primary, #1B3A5C)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{initials}</Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

function TaskBoard({ tasks, now }: { tasks: ProjectTask[]; now: number }) {
  if (tasks.length === 0) return <Typography color="text.secondary">No tasks have been added to this project yet.</Typography>
  return (
    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
      {columns.map((column) => {
        const items = tasks.filter((t) => t.status === column.status)
        return (
          <Box key={column.status} sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 1.25 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.color }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{column.label}</Typography>
              <Typography variant="caption" color="text.secondary">{items.length}</Typography>
            </Stack>
            <Stack spacing={1}>
              {items.length === 0 && <Typography variant="caption" color="text.secondary">Nothing here.</Typography>}
              {items.map((task) => {
                // Overdue is not stored: it is derived from the due date and status.
                const overdue = task.status !== 'COMPLETED' && at(task.dueDate) < now
                return (
                  <Box key={task.id} sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 1.5, p: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.title}</Typography>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{task.assignee ?? 'Unassigned'}</Typography>
                      <Typography variant="caption" sx={{ color: overdue ? 'error.main' : 'text.secondary', fontWeight: overdue ? 700 : 400 }}>
                        {overdue ? 'Overdue · ' : 'Due '}{shortDate(task.dueDate)}
                      </Typography>
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          </Box>
        )
      })}
    </Box>
  )
}

function Gantt({ tasks, now }: { tasks: ProjectTask[]; now: number }) {
  if (tasks.length === 0) return <Typography color="text.secondary">Add tasks with start and due dates to see the Gantt chart.</Typography>
  const min = Math.min(...tasks.map((t) => at(t.startDate)))
  const max = Math.max(...tasks.map((t) => at(t.dueDate)))
  const span = Math.max(max - min, 86_400_000)
  const pct = (time: number) => Math.min(100, Math.max(0, ((time - min) / span) * 100))

  // Month markers inside the range.
  const markers: number[] = []
  for (const d = new Date(min); d.getTime() <= max; ) {
    d.setMonth(d.getMonth() + 1, 1)
    d.setHours(0, 0, 0, 0)
    if (d.getTime() <= max) markers.push(d.getTime())
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 560 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'end', pb: 0.5, borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="caption" color="text.secondary">Task</Typography>
          <Box sx={{ position: 'relative', height: 18 }}>
            <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', left: 0 }}>{shortDate(min)}</Typography>
            {markers.map((time) => (
              <Typography key={time} variant="caption" color="text.secondary" sx={{ position: 'absolute', left: `${pct(time)}%` }}>
                {new Date(time).toLocaleDateString('en-US', { month: 'short' })}
              </Typography>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', right: 0 }}>{shortDate(max)}</Typography>
          </Box>
        </Box>
        {tasks.map((task) => (
          <Box key={task.id} sx={{ display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'center', py: 0.75, borderBottom: '1px solid #F1F5F9' }}>
            <Typography variant="body2" noWrap sx={{ pr: 1 }} title={task.title}>{task.title}</Typography>
            <Box sx={{ position: 'relative', height: 20 }}>
              {now >= min && now <= max && <Box sx={{ position: 'absolute', top: -4, bottom: -4, left: `${pct(now)}%`, borderLeft: '2px dashed #EF4444' }} />}
              <Box
                role="img"
                aria-label={`${task.title}: ${shortDate(task.startDate)} to ${shortDate(task.dueDate)}`}
                title={`${shortDate(task.startDate)} – ${shortDate(task.dueDate)}`}
                sx={{ position: 'absolute', top: 3, height: 14, borderRadius: 7, bgcolor: statusColor[task.status], left: `${pct(at(task.startDate))}%`, width: `${Math.max(pct(at(task.dueDate)) - pct(at(task.startDate)), 2)}%` }}
              />
            </Box>
          </Box>
        ))}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {columns.map((c) => (
            <Stack key={c.status} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
              <Typography variant="caption">{c.label}</Typography>
            </Stack>
          ))}
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 0, height: 12, borderLeft: '2px dashed #EF4444' }} />
            <Typography variant="caption">Today</Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

// Opens over the Mentor dashboard so the mentor never leaves the page.
// Render with a `key` of the project id so it always opens on the Overview tab.
function ProjectDetailDialog({ project, onClose }: { project: ProjectSummary; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'tasks' | 'gantt'>('overview')
  const [now] = useState(() => Date.now())

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="project-dialog-title">
      <DialogTitle id="project-dialog-title" sx={{ pr: 7, fontWeight: 700 }}>
        {project.name}
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><X size={20} /></IconButton>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} aria-label="Project sections" sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="overview" label="Overview" />
        <Tab value="tasks" label="Task board" />
        <Tab value="gantt" label="Gantt chart" />
      </Tabs>
      <DialogContent sx={{ pt: 2.5, minHeight: 320 }}>
        {tab === 'overview' && <Overview project={project} />}
        {tab === 'tasks' && <TaskBoard tasks={project.tasks} now={now} />}
        {tab === 'gantt' && <Gantt tasks={project.tasks} now={now} />}
      </DialogContent>
    </Dialog>
  )
}

export function MentorDashboardPage() {
  const [projects] = useState<ProjectItem[]>(initialProjects)
  const [deadlines] = useState<DeadlineItem[]>(initialDeadlines)
  const [activeProjectsCount] = useState(12)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [approvalsCount] = useState(5)

  // Date selection state
  const [selectedMonth, setSelectedMonth] = useState('Oct 2026')
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null)

  // Deadline menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  // Feedback toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleOpenDateMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDateAnchorEl(event.currentTarget)
  }

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month)
    setDateAnchorEl(null)
  }

  const handleOpenDeadlinesMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleCloseDeadlinesMenu = () => {
    setMenuAnchorEl(null)
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null

  // Calculate average progress
  const averageProgress = Math.round(
    projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1)
  )

  return (
    <main className={styles.page}>
      {/* Top Bar Actions */}
      <section className={styles.topBar} aria-label="Dashboard controls">
        <button
          type="button"
          className={styles.dateButton}
          onClick={handleOpenDateMenu}
          aria-haspopup="true"
          aria-expanded={Boolean(dateAnchorEl)}
          id="date-filter-button"
        >
          <Calendar size={17} strokeWidth={2} aria-hidden="true" />
          <span>{selectedMonth}</span>
        </button>
        <Menu
          anchorEl={dateAnchorEl}
          open={Boolean(dateAnchorEl)}
          onClose={() => setDateAnchorEl(null)}
          slotProps={{
            paper: {
              sx: {
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                minWidth: 140,
              },
            },
          }}
        >
          {['Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'].map((month) => (
            <MenuItem
              key={month}
              selected={month === selectedMonth}
              onClick={() => handleSelectMonth(month)}
              sx={{ fontSize: 14, fontWeight: month === selectedMonth ? 700 : 500 }}
            >
              {month}
            </MenuItem>
          ))}
        </Menu>

      </section>

      {/* 4 Metric / KPI Cards */}
      <section className={styles.metricsGrid} aria-label="Key performance indicators">
        {/* Metric 1: Active Projects */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
            <Folder size={22} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{activeProjectsCount}</p>
            <p className={styles.statLabel}>Active Projects</p>
          </div>
        </div>

        {/* Metric 2: Avg. Progress */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
            <CheckCircle2 size={22} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{projects.length === 4 ? '64%' : `${averageProgress}%`}</p>
            <p className={styles.statLabel}>Avg. Progress</p>
          </div>
        </div>

        {/* Metric 3: Approvals Pending */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconAmber}`}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="16" height="18" rx="2.5" />
              <line x1="12" y1="8" x2="12" y2="12.5" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{approvalsCount}</p>
            <p className={styles.statLabel}>Approvals Pending</p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Content Grid */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: Active Projects Overview */}
        <section className={styles.card} aria-labelledby="active-projects-title">
          <header className={styles.cardHeader}>
            <h2 id="active-projects-title" className={styles.cardTitle}>
              Active Projects Overview
            </h2>
            <Link to="/mentor/projects" className={styles.viewAllLink}>
              View All Projects
            </Link>
          </header>

          <div className={styles.tableContainer}>
            <table className={styles.projectsTable}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '40%' }}>Project Name</th>
                  <th scope="col" style={{ width: '20%' }}>Team</th>
                  <th scope="col" style={{ width: '20%' }}>Status</th>
                  <th scope="col" style={{ width: '20%' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => {
                  const statusClass =
                    proj.status === 'IN_PROGRESS' || proj.status === 'COMPLETED'
                      ? styles.statusOnTrack
                      : proj.status === 'ON_HOLD'
                      ? styles.statusAtRisk
                      : styles.statusPendingReview

                  return (
                    <tr key={proj.id} onClick={() => setSelectedProjectId(proj.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className={styles.projectInfo}>
                          <button
                            type="button"
                            className={styles.projectName}
                            onClick={() => setSelectedProjectId(proj.id)}
                            aria-haspopup="dialog"
                            style={{ background: 'none', border: 0, padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
                          >
                            {proj.name}
                          </button>
                          {proj.groupName && <span className={styles.projectDepartment}>{proj.groupName}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.teamAvatars}>
                          {proj.team.map((member, idx) => (
                            <span
                              key={`${member.initials}-${idx}`}
                              className={`${styles.teamAvatar} ${member.colorClass}`}
                              title={`Team Member ${member.initials}`}
                            >
                              {member.initials}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {statusLabels[proj.status]}
                        </span>
                      </td>
                      <td>
                        <div className={styles.progressColumn}>
                          <div className={styles.progressMeta}>
                            <span className={styles.progressValue}>{proj.progress}%</span>
                            <span className={styles.progressDate}>{proj.dueDate}</span>
                          </div>
                          <div className={styles.progressTrack}>
                            <div
                              className={`${styles.progressBar} ${proj.colorClass}`}
                              style={{ width: `${proj.progress}%` }}
                              role="progressbar"
                              aria-valuenow={proj.progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Upcoming Deadlines */}
        <section className={styles.card} aria-labelledby="upcoming-deadlines-title">
          <header className={styles.cardHeader}>
            <h2 id="upcoming-deadlines-title" className={styles.cardTitle}>
              Upcoming Deadlines
            </h2>
            <button
              type="button"
              className={styles.moreButton}
              onClick={handleOpenDeadlinesMenu}
              aria-label="Upcoming deadlines options"
              aria-haspopup="true"
              aria-expanded={Boolean(menuAnchorEl)}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleCloseDeadlinesMenu}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    minWidth: 170,
                  },
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  handleCloseDeadlinesMenu()
                  setToastMessage('Schedule exported.')
                }}
                sx={{ fontSize: 13.5 }}
              >
                Export Schedule
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseDeadlinesMenu()
                  setToastMessage('Calendar synchronized.')
                }}
                sx={{ fontSize: 13.5 }}
              >
                Sync with Calendar
              </MenuItem>
            </Menu>
          </header>

          <div className={styles.deadlinesList}>
            {deadlines.map((item) => {
              const dateClass =
                item.colorVariant === 'red'
                  ? styles.dateRed
                  : item.colorVariant === 'amber'
                  ? styles.dateAmber
                  : styles.dateBlue

              return (
                <div key={item.id} className={styles.deadlinesItem}>
                  <div className={`${styles.deadlineDateBox} ${dateClass}`}>
                    <span className={styles.dateMonth}>{item.month}</span>
                    <span className={styles.dateDay}>{item.day}</span>
                  </div>
                  <div className={styles.deadlineDetails}>
                    <p className={styles.deadlineTitle}>{item.title}</p>
                    <p className={styles.deadlineSub}>{item.project}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Link to="/mentor/calendar" className={styles.viewAllDeadlinesButton}>
            View All Deadlines
          </Link>
        </section>
      </div>

      {/* Project details: opens over the dashboard with Overview, Task board and Gantt chart */}
      {selectedProject && (
        <ProjectDetailDialog
          key={selectedProject.id}
          onClose={() => setSelectedProjectId(null)}
          project={{
            id: selectedProject.id,
            name: selectedProject.name,
            groupName: selectedProject.groupName,
            description: selectedProject.description,
            statusLabel: statusLabels[selectedProject.status],
            progress: selectedProject.progress,
            dueDate: selectedProject.dueDate,
            team: selectedProject.team.map((member) => member.initials),
            tasks: demoTasks[selectedProject.id] ?? [],
          }}
        />
      )}

      {/* Snackbar feedback notification */}
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

export default MentorDashboardPage