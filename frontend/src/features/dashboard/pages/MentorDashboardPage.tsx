import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import {
  CheckCircle2,
  Folder,
  X,
} from 'lucide-react'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { useProjects } from '@/features/projects/data/projectsApi'
import { Tasks } from '@/api/services/tasks.service'
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

const avatarStyles = [styles.avatarMS, styles.avatarTM, styles.avatarJS, styles.avatarRJ, styles.avatarTN, styles.avatarAB]

function localDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function displayProjectDate(value: string | null) {
  return value ? localDate(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

// ---------------------------------------------------------------------------
// Project popup: opens over the dashboard with Overview, Task board and Gantt chart tabs
// ---------------------------------------------------------------------------

// Same values as the TaskStatus enum in the Prisma schema.
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'

interface ProjectTask {
  id: string
  title: string
  status: TaskStatus
  blockedReason?: string | null
  assignee?: string
  /** ISO date, e.g. 2026-10-15 */
  startDate: string | null
  dueDate: string | null
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
  { status: 'BLOCKED', label: 'Blocked', color: '#EF4444' },
]
const statusColor = Object.fromEntries(columns.map((c) => [c.status, c.color])) as Record<TaskStatus, string>

const shortDate = (iso: string | number | null) => iso === null ? '—' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const at = (iso: string | null) => iso ? localDate(iso).getTime() : Date.now()

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
                const overdue = Boolean(task.dueDate && task.status !== 'COMPLETED' && at(task.dueDate) < now)
                return (
                  <Box key={task.id} sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 1.5, p: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.title}</Typography>
                    {task.status === 'BLOCKED' && task.blockedReason && <Typography variant="caption" color="error.main">Blocked: {task.blockedReason}</Typography>}
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
  const scheduledTasks = tasks.filter((task) => task.startDate || task.dueDate)
  if (scheduledTasks.length === 0) return <Typography color="text.secondary">There are no scheduled task dates for this project yet.</Typography>
  const min = Math.min(...scheduledTasks.map((task) => at(task.startDate ?? task.dueDate)))
  const max = Math.max(...scheduledTasks.map((task) => at(task.dueDate ?? task.startDate)))
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
        {scheduledTasks.map((task) => (
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
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setTasksLoading(true)
    Tasks.getProjectTasks(project.id)
      .then((records) => {
        if (cancelled) return
        setTasks(records.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          blockedReason: task.blockedReason,
          assignee: task.assignedTo?.user?.fullName ?? 'Unassigned',
          startDate: task.startDate?.slice(0, 10) ?? null,
          dueDate: task.dueDate?.slice(0, 10) ?? null,
        })))
      })
      .catch(() => { if (!cancelled) setTasks([]) })
      .finally(() => { if (!cancelled) setTasksLoading(false) })
    return () => { cancelled = true }
  }, [project.id])

  const projectWithTasks = { ...project, tasks }

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
        {tab === 'overview' && <Overview project={projectWithTasks} />}
        {tab === 'tasks' && (tasksLoading ? <BikeLoader label="Loading tasks" size={100} /> : <TaskBoard tasks={tasks} now={now} />)}
        {tab === 'gantt' && (tasksLoading ? <BikeLoader label="Loading schedule" size={100} /> : <Gantt tasks={tasks} now={now} />)}
      </DialogContent>
    </Dialog>
  )
}

export function MentorDashboardPage() {
  const { data: projectRecords = [], isLoading: projectsLoading, isError: projectsError, refetch } = useProjects()
  const supervisedProjects = projectRecords.filter((project) => project.canManage)
  const projects: ProjectItem[] = supervisedProjects.map((project, index) => ({
    id: project.id,
    name: project.name,
    groupName: project.groupName ?? undefined,
    description: project.problemStatement,
    team: project.members.map((member, memberIndex) => ({
      initials: initialsFor(member.name),
      colorClass: avatarStyles[memberIndex % avatarStyles.length],
    })),
    status: project.status,
    progress: project.progress,
    dueDate: displayProjectDate(project.endDate),
    colorClass: project.status === 'ON_HOLD' ? styles.barOrange : project.status === 'COMPLETED' ? styles.barGreen : index % 2 ? styles.barGreen : styles.barBlue,
  }))
  const activeProjectsCount = supervisedProjects.filter((project) => project.status === 'IN_PROGRESS').length
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const deadlines: DeadlineItem[] = supervisedProjects
    .filter((project) => project.endDate && localDate(project.endDate).getTime() >= new Date(new Date().setHours(0, 0, 0, 0)).getTime())
    .sort((a, b) => localDate(a.endDate!).getTime() - localDate(b.endDate!).getTime())
    .slice(0, 4)
    .map((project) => {
      const date = localDate(project.endDate!)
      return {
        id: project.id,
        month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
        day: String(date.getDate()).padStart(2, '0'),
        title: `${project.name} deadline`,
        project: project.groupName || project.name,
        colorVariant: project.status === 'ON_HOLD' ? 'red' : project.status === 'PLANNED' ? 'amber' : 'blue',
      }
    })

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null

  // Calculate average progress
  const averageProgress = projects.length
    ? Math.round(projects.reduce((acc, project) => acc + project.progress, 0) / projects.length)
    : null
  const plannedProjectsCount = supervisedProjects.filter((project) => project.status === 'PLANNED').length
  const onHoldProjectsCount = supervisedProjects.filter((project) => project.status === 'ON_HOLD').length

  return (
    <main className={styles.page}>
      <section className={styles.pageHeading} aria-label="Mentor dashboard introduction">
        <div>
          <h1 className={styles.pageTitle}>Mentor dashboard</h1>
          <p className={styles.pageSubtitle}>A snapshot of the projects you supervise, their progress and upcoming deadlines.</p>
        </div>
        <Link to="/mentor/projects" className={styles.manageProjectsLink}>Manage projects</Link>
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
          <p className={styles.statValue}>{averageProgress === null ? '—' : `${averageProgress}%`}</p>
            <p className={styles.statLabel}>Avg. Progress</p>
          </div>
        </div>

        {/* Metric 3: Planned projects */}
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
            <p className={styles.statValue}>{plannedProjectsCount}</p>
            <p className={styles.statLabel}>Planned Projects</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconRed}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2.8 19a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L12 3Z" />
              <path d="M12 9v4m0 3h.01" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{onHoldProjectsCount}</p>
            <p className={styles.statLabel}>Projects On Hold</p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Content Grid */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: Active Projects Overview */}
        <section className={styles.card} aria-labelledby="active-projects-title">
          <header className={styles.cardHeader}>
            <h2 id="active-projects-title" className={styles.cardTitle}>
              Your Projects
            </h2>
            <Link to="/mentor/projects" className={styles.viewAllLink}>
              View All Projects
            </Link>
          </header>
          <p className={styles.sectionDescription}>Review each project’s team, status and reported progress.</p>

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
                {projectsLoading ? (
                  <tr><td colSpan={4}><BikeLoader label="Loading projects" size={95} /></td></tr>
                ) : projectsError ? (
                  <tr><td colSpan={4}>Projects could not be loaded. <button type="button" onClick={() => void refetch()}>Try again</button></td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={4}>No projects yet. Create a project to see it here.</td></tr>
                ) : projects.map((proj) => {
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
          </header>

          <div className={styles.deadlinesList}>
            {projectsLoading && <BikeLoader label="Loading deadlines" size={80} />}
            {!projectsLoading && projectsError && <p className={styles.deadlineEmpty}>Deadlines are unavailable because project data could not be loaded.</p>}
            {!projectsLoading && !projectsError && deadlines.length === 0 && (
              <p className={styles.deadlineEmpty}>No upcoming deadlines. Add an end date to a project to see it here.</p>
            )}
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
            tasks: [],
          }}
        />
      )}

    </main>
  )
}

export default MentorDashboardPage
