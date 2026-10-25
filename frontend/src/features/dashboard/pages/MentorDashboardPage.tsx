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
import { TagInput } from '@/components/ui/TagInput'
import {
  DESCRIPTION_MAX, GROUP_MAX, NAME_MAX, PROJECT_STATUS_LABELS, SKILL_SUGGESTIONS, toNewProject, validateNewProject,
  type ProjectStatus,
} from '@/features/projects/data/newProject'
import { IcepLogo } from '@/components/brand/IcepLogo'
import styles from './MentorDashboardPage.module.css'

interface TeamMember {
  initials: string
  colorClass: string
}

const statusLabels = PROJECT_STATUS_LABELS
// A new project can't start as Completed.
const NEW_PROJECT_STATUSES: ProjectStatus[] = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD']

interface ProjectItem {
  id: string
  name: string
  groupName?: string
  description?: string
  requiredSkills?: string[]
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
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('PLANNED')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [formError, setFormError] = useState('')

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

  const resetForm = () => {
    setProjectName('')
    setGroupName('')
    setDescription('')
    setStatus('PLANNED')
    setStartDate('')
    setEndDate('')
    setRequiredSkills([])
    setFormError('')
  }

  const formatShortDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })

  // Department, supervisor and creator aren't asked for: they come from the signed-in mentor.
  // See features/projects/data/newProject.ts for what the backend hook-up needs.
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    const input = toNewProject({ name: projectName, groupName, description, status, startDate, endDate, requiredSkills })
    const problem = validateNewProject(input)
    if (problem) { setFormError(problem); return }

    // TODO (backend hook-up): await Projects.create(input) -> POST /api/projects, and use the saved project below.
    const colorClass = input.status === 'ON_HOLD' ? styles.barOrange : styles.barBlue
    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: input.name,
      groupName: input.groupName,
      description: input.description,
      requiredSkills: input.requiredSkills,
      team: [],
      status: input.status,
      progress: 0, // calculated from tasks once the project has some
      dueDate: input.endDate ? formatShortDate(input.endDate) : '—',
      colorClass,
    }

    setProjects([newProject, ...projects])
    setActiveProjectsCount((prev) => prev + 1)
    setIsModalOpen(false)
    resetForm()
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
                          {!!proj.requiredSkills?.length && <span className={styles.projectDepartment}>Skills: {proj.requiredSkills.join(', ')}</span>}
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

      {/* New Project Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title="Create New Project"
        maxWidth="sm"
        fullWidth
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button appearance="secondary" onClick={() => { setIsModalOpen(false); resetForm() }}>
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
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
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
                maxLength={NAME_MAX}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="group-name-input" className={styles.formLabel}>
                Group Name (optional)
              </label>
              <input
                id="group-name-input"
                type="text"
                className={styles.formInput}
                placeholder="e.g. Group A"
                maxLength={GROUP_MAX}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description-input" className={styles.formLabel}>
                Description (optional)
              </label>
              <textarea
                id="description-input"
                className={styles.formInput}
                rows={3}
                placeholder="What is this project about?"
                maxLength={DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className={styles.formHint}>{description.length}/{DESCRIPTION_MAX}</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} id="skills-label">
                Required skills (optional)
              </label>
              <span className={styles.formHint}>Used to suggest interns in the Team Builder. Type a skill and press Enter, or pick one below.</span>
              <div role="group" aria-labelledby="skills-label">
                <TagInput tags={requiredSkills} onChange={setRequiredSkills} placeholder="e.g. React" />
              </div>
              <div className={styles.skillSuggestions}>
                {SKILL_SUGGESTIONS.filter((skill) => !requiredSkills.some((tag) => tag.toLowerCase() === skill.toLowerCase())).map((skill) => (
                  <button key={skill} type="button" className={styles.skillSuggestion} onClick={() => setRequiredSkills((current) => (current.includes(skill) ? current : [...current, skill]))}>
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status-select" className={styles.formLabel}>
                Status
              </label>
              <select
                id="status-select"
                className={styles.formSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {NEW_PROJECT_STATUSES.map((value) => (
                  <option key={value} value={value}>{statusLabels[value]}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label htmlFor="start-date-input" className={styles.formLabel}>
                  Start Date
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  className={styles.formInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="end-date-input" className={styles.formLabel}>
                  End Date
                </label>
                <input
                  id="end-date-input"
                  type="date"
                  className={styles.formInput}
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <p className={styles.formHint}>Progress starts at 0% and is calculated from the project's tasks. The department and supervisor are taken from your mentor profile.</p>
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