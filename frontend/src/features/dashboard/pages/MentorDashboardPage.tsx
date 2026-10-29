import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Folder,
  MoreHorizontal,
} from 'lucide-react'
import { PROJECT_STATUS_LABELS } from '@/features/projects/data/newProject'
import { useProjects, type ProjectRecord } from '@/features/projects/data/projectsApi'
import { IcepLogo } from '@/components/brand/IcepLogo'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TagInput } from '@/components/ui/TagInput'
import {
  DESCRIPTION_MAX, GROUP_MAX, NAME_MAX, SKILL_SUGGESTIONS, toNewProject, validateNewProject,
  type ProjectStatus,
} from '@/features/projects/data/newProject'
import { downloadBlob } from '@/utils/format'
import styles from './MentorDashboardPage.module.css'

const statusLabels = PROJECT_STATUS_LABELS

interface DeadlineItem {
  id: string
  isoDate: string
  month: string
  day: string
  title: string
  project: string
  colorVariant: 'red' | 'amber' | 'blue'
}

const PRIORITY: Record<DeadlineItem['colorVariant'], string> = { red: 'Urgent', amber: 'Due soon', blue: 'Upcoming' }
const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
const AVATAR_COLORS = [styles.avatarMS, styles.avatarTM, styles.avatarJS, styles.avatarRJ, styles.avatarTN, styles.avatarAB]
const memberInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
const formatShortDate = (iso: string) => new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: '2-digit' })

/** Upcoming deadlines as a CSV file (opens in Excel / Google Sheets), sorted by date. */
function exportSchedule(items: DeadlineItem[]) {
  const dated = items.map((item) => ({ iso: item.isoDate, item })).sort((a, b) => a.iso.localeCompare(b.iso))
  const rows = [
    ['Date', 'Deadline', 'Project', 'Priority'],
    ...dated.map(({ iso, item }) => [iso, item.title, item.project, PRIORITY[item.colorVariant]]),
  ]
  const csv = '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `upcoming-deadlines-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function MentorDashboardPage() {
  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects()
  const [approvalsCount] = useState(0)
  const activeProjectsCount = projects.filter((project) => project.status !== 'COMPLETED').length
  const atRiskCount = projects.filter((project) => project.status === 'ON_HOLD').length

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

  const deadlines = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return projects.flatMap((project) => {
      if (!project.endDate) return []
      const date = new Date(project.endDate)
      const daysUntilDue = Math.ceil((date.getTime() - today.getTime()) / 86_400_000)
      if (daysUntilDue < 0) return []
      return [{
        id: project.id,
        isoDate: project.endDate.slice(0, 10),
        month: date.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase(),
        day: date.toLocaleDateString('en-ZA', { day: '2-digit' }),
        title: 'Project deadline',
        project: project.name,
        colorVariant: daysUntilDue <= 3 ? 'red' as const : daysUntilDue <= 7 ? 'amber' as const : 'blue' as const,
      }]
    }).sort((a, b) => a.isoDate.localeCompare(b.isoDate))
  }, [projects])
  const averageProgress = Math.round(projects.reduce((total, project) => total + project.progress, 0) / (projects.length || 1))

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

        <Link to="/mentor/projects" className={styles.newProjectButton} id="new-project-button">
          <Folder size={18} strokeWidth={2.5} aria-hidden="true" />
          <span>New Project</span>
        </Link>
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
            <p className={styles.statValue}>{averageProgress}%</p>
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

        {/* Metric 4: At Risk / Blocked */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconRed}`}>
            <AlertTriangle size={22} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statValue}>{atRiskCount}</p>
            <p className={styles.statLabel}>At Risk / Blocked</p>
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
                {projectsLoading ? (
                  <tr><td colSpan={4}>Loading projects…</td></tr>
                ) : projectsError ? (
                  <tr><td colSpan={4}>Projects could not be loaded. Refresh the page to try again.</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={4}>No projects yet. Create a project to see it here.</td></tr>
                ) : projects.map((proj: ProjectRecord) => {
                  const statusClass =
                    proj.status === 'IN_PROGRESS' || proj.status === 'COMPLETED'
                      ? styles.statusOnTrack
                      : proj.status === 'ON_HOLD'
                      ? styles.statusAtRisk
                      : styles.statusPendingReview

                  return (
                    <tr key={proj.id}>
                      <td>
                        <div className={styles.projectInfo}>
                          <span className={styles.projectName}>{proj.name}</span>
                          {proj.groupName && <span className={styles.projectDepartment}>{proj.groupName}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.teamAvatars}>
                          {proj.members.map((member, idx) => (
                            <span
                              key={`${member.internId}-${idx}`}
                              className={`${styles.teamAvatar} ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                              title={member.name}
                            >
                              {memberInitials(member.name)}
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
                            <span className={styles.progressDate}>{proj.endDate ? formatShortDate(proj.endDate) : '—'}</span>
                          </div>
                          <div className={styles.progressTrack}>
                            <div
                              className={`${styles.progressBar} ${proj.status === 'ON_HOLD' ? styles.barOrange : proj.status === 'COMPLETED' ? styles.barGreen : styles.barBlue}`}
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
                  if (!deadlines.length) { setToastMessage('There are no deadlines to export.'); return }
                  exportSchedule(deadlines)
                  setToastMessage(`Schedule exported (${deadlines.length} deadline${deadlines.length === 1 ? '' : 's'}).`)
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
