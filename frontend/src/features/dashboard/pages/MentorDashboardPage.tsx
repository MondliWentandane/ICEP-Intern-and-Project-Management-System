import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  CheckCircle2,
  Folder,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { IcepLogo } from '@/components/brand/IcepLogo'
import styles from './MentorDashboardPage.module.css'

interface TeamMember {
  initials: string
  colorClass: string
}

interface ProjectItem {
  id: string
  name: string
  department: string
  team: TeamMember[]
  status: 'On Track' | 'At Risk' | 'Pending Review'
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
    department: 'Software Engineering',
    team: [
      { initials: 'MS', colorClass: styles.avatarMS },
      { initials: 'TM', colorClass: styles.avatarTM },
      { initials: 'JS', colorClass: styles.avatarJS },
    ],
    status: 'On Track',
    progress: 75,
    dueDate: 'Nov 15',
    colorClass: styles.barBlue,
  },
  {
    id: 'proj-2',
    name: 'Network Security Audit',
    department: 'Cybersecurity',
    team: [
      { initials: 'RJ', colorClass: styles.avatarRJ },
      { initials: 'MS', colorClass: styles.avatarMS },
    ],
    status: 'At Risk',
    progress: 30,
    dueDate: 'Oct 28',
    colorClass: styles.barOrange,
  },
  {
    id: 'proj-3',
    name: 'Data Migration Phase 2',
    department: 'Informatics',
    team: [
      { initials: 'TN', colorClass: styles.avatarTN },
      { initials: 'AB', colorClass: styles.avatarAB },
    ],
    status: 'Pending Review',
    progress: 95,
    dueDate: 'Oct 12',
    colorClass: styles.barGreen,
  },
  {
    id: 'proj-4',
    name: 'Mobile App Beta',
    department: 'Software Engineering',
    team: [
      { initials: 'JS', colorClass: styles.avatarJS },
      { initials: 'MS', colorClass: styles.avatarMS },
      { initials: 'TM', colorClass: styles.avatarTM },
    ],
    status: 'On Track',
    progress: 45,
    dueDate: 'Dec 01',
    colorClass: styles.barBlue,
  },
]

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

export function MentorDashboardPage() {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [deadlines] = useState<DeadlineItem[]>(initialDeadlines)
  const [activeProjectsCount, setActiveProjectsCount] = useState(12)
  const [approvalsCount] = useState(5)
  const [atRiskCount] = useState(2)

  // Date selection state
  const [selectedMonth, setSelectedMonth] = useState('Oct 2026')
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null)

  // Deadline menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  // New Project modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [department, setDepartment] = useState('Software Engineering')
  const [status, setStatus] = useState<'On Track' | 'At Risk' | 'Pending Review'>('On Track')
  const [dueDate, setDueDate] = useState('')
  const [progress, setProgress] = useState(0)

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

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return

    const colorClass =
      status === 'At Risk'
        ? styles.barOrange
        : status === 'Pending Review'
        ? styles.barGreen
        : styles.barBlue

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      department,
      team: [
        { initials: 'PN', colorClass: styles.avatarMS },
        { initials: 'MS', colorClass: styles.avatarJS },
      ],
      status,
      progress: Number(progress) || 10,
      dueDate: dueDate || 'Dec 15',
      colorClass,
    }

    setProjects([newProject, ...projects])
    setActiveProjectsCount((prev) => prev + 1)
    setIsModalOpen(false)
    setProjectName('')
    setProgress(0)
    setDueDate('')
    setToastMessage(`Project "${newProject.name}" successfully created!`)
  }

  // Calculate average progress
  const averageProgress = Math.round(
    projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1)
  )

  return (
    <main className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <IcepLogo />
      </div>

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

        <button
          type="button"
          className={styles.newProjectButton}
          onClick={() => setIsModalOpen(true)}
          id="new-project-button"
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          <span>New Project</span>
        </button>
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
                {projects.map((proj) => {
                  const statusClass =
                    proj.status === 'On Track'
                      ? styles.statusOnTrack
                      : proj.status === 'At Risk'
                      ? styles.statusAtRisk
                      : styles.statusPendingReview

                  return (
                    <tr key={proj.id}>
                      <td>
                        <div className={styles.projectInfo}>
                          <span className={styles.projectName}>{proj.name}</span>
                          <span className={styles.projectDepartment}>{proj.department}</span>
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
                          {proj.status}
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

      {/* New Project Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        maxWidth="sm"
        fullWidth
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button appearance="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        }
      >
        <DialogContent dividers sx={{ borderBottom: '1px solid #E2E8F0' }}>
          <form className={styles.modalForm} onSubmit={handleCreateProject} id="new-project-form">
            <div className={styles.formGroup}>
              <label htmlFor="project-name-input" className={styles.formLabel}>
                Project Name
              </label>
              <input
                id="project-name-input"
                type="text"
                className={styles.formInput}
                placeholder="e.g. Cloud Security Pipeline"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="department-select" className={styles.formLabel}>
                Department
              </label>
              <select
                id="department-select"
                className={styles.formSelect}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Software Engineering">Software Engineering</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Informatics">Informatics</option>
                <option value="Multimedia Computing">Multimedia Computing</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status-select" className={styles.formLabel}>
                Initial Status
              </label>
              <select
                id="status-select"
                className={styles.formSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'On Track' | 'At Risk' | 'Pending Review')}
              >
                <option value="On Track">On Track</option>
                <option value="Pending Review">Pending Review</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label htmlFor="due-date-input" className={styles.formLabel}>
                  Target Due Date
                </label>
                <input
                  id="due-date-input"
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Nov 30"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="progress-input" className={styles.formLabel}>
                  Initial Progress (%)
                </label>
                <input
                  id="progress-input"
                  type="number"
                  min="0"
                  max="100"
                  className={styles.formInput}
                  placeholder="0 - 100"
                  value={progress || ''}
                  onChange={(e) => setProgress(Number(e.target.value))}
                />
              </div>
            </div>
          </form>
        </DialogContent>
      </Modal>

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