import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Folder,
} from 'lucide-react'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { useProjects } from '@/features/projects/data/projectsApi'
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

export function MentorDashboardPage() {
  const navigate = useNavigate()
  // Clicking a project opens its page on the Gantt chart tab.
  const openGantt = (projectId: string) => navigate(`/mentor/projects/${projectId}`, { state: { tab: 'gantt' } })
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
                    <tr key={proj.id} onClick={() => openGantt(proj.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className={styles.projectInfo}>
                          <button
                            type="button"
                            className={styles.projectName}
                            title="Open Gantt chart"
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
    </main>
  )
}

export default MentorDashboardPage