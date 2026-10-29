import { Link } from 'react-router-dom'
import { useProjects } from '@/features/projects/data/projectsApi'
import styles from '@/features/dashboard/pages/DashboardPages.module.css'

export function MyProjectPage() {
  const { data: projects = [], isLoading, isError, refetch } = useProjects()

  if (isLoading) {
    return (
      <main className={`${styles.card} ${styles.internCanvas}`} aria-live="polite">
        <p className={styles.internText}>Loading your assigned projects…</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className={`${styles.card} ${styles.internCanvas}`}>
        <div className={styles.internContent}>
          <h1 className={styles.internTitle}>We couldn’t load your projects</h1>
          <p className={styles.internText}>Please check your connection and try again.</p>
          <button className={styles.button} onClick={() => void refetch()}>Try again</button>
        </div>
      </main>
    )
  }

  if (projects.length === 0) {
    return (
      <main className={`${styles.card} ${styles.internCanvas}`}>
        <div className={styles.internContent}>
          <span className={styles.internIcon} aria-hidden="true">▤</span>
          <div>
            <h1 className={styles.internTitle}>No project assigned yet</h1>
            <p className={styles.internText}>
              Your mentor hasn’t assigned you to a project yet. Your project will appear here once you’re added to a team.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header>
        <h1 className={styles.heading}>My Projects</h1>
        <p className={styles.subheading}>Projects your mentor has assigned to you.</p>
      </header>

      {projects.map((project) => (
        <article key={project.id} className={`${styles.card} ${styles.listCard}`}>
          <div className={styles.listHeader}>
            <div>
              <h2 className={styles.cardTitle}>{project.name}</h2>
              <p className={styles.rowNote}>{project.groupName || 'Project team'}</p>
            </div>
            <span className={`${styles.pill} ${styles.blue}`}>{project.progress}% complete</span>
          </div>

          {project.problemStatement && <p>{project.problemStatement}</p>}

          <div className={styles.progress} aria-label={`Project progress: ${project.progress}%`}>
            <span style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} />
          </div>

          {project.members.length > 0 && (
            <section aria-label="Project team">
              <h3 className={styles.widgetTitle}>Team members</h3>
              <ul>
                {project.members.map((member) => (
                  <li key={member.internId}>
                    {member.name}{member.role ? ` — ${member.role}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            className={styles.link}
            to={`/intern/projects/${encodeURIComponent(project.id)}`}
            state={{ project }}
          >
            View project details
          </Link>
        </article>
      ))}
    </main>
  )
}

export default MyProjectPage
