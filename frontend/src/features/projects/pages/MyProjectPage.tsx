import { useProjects } from '@/features/projects/data/projectsApi'
import styles from '@/features/dashboard/pages/DashboardPages.module.css'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { ProjectCard } from '@/components/ui/project-card'

export function MyProjectPage() {
  const { data: projects = [], isLoading, isError, refetch } = useProjects()

  if (isLoading) {
    return (
      <main className={`${styles.card} ${styles.internCanvas}`} aria-live="polite">
        <BikeLoader label="Loading your assigned projects" size={125} />
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

      <section
        aria-label="Your assigned projects"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}
      >
        {projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}
      </section>
    </main>
  )
}

export default MyProjectPage
