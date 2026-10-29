import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/pages/DashboardPages.module.css'
import { useMyProjects } from '@/features/projects/data/useMyProjects'

export function MyProjectPage() {
  const { data: projects = [], isLoading } = useMyProjects()

  if (isLoading) {
    return <main className={`${styles.card} ${styles.internCanvas}`}><p className={styles.internText}>Loading your project…</p></main>
  }

  if (projects.length === 0) {
    return (
      <main className={`${styles.card} ${styles.internCanvas}`}><div className={styles.internContent}>
        <span className={styles.internIcon} aria-hidden="true">▤</span>
        <div><h1 className={styles.internTitle}>No project assigned yet</h1><p className={styles.internText}>Your mentor will place you in a project team soon. You’ll get a notification when that happens.</p></div>
        <div className={styles.actions}><Link className={`${styles.button} ${styles.primaryButton}`} to="/intern/profile/edit">Complete your profile</Link></div>
      </div></main>
    )
  }

  return (
    <main className={`${styles.card} ${styles.internCanvas}`}><div className={styles.internContent}>
      <span className={styles.internIcon} aria-hidden="true">▤</span>
      {projects.map((p) => (
        <div key={p.id}>
          <h1 className={styles.internTitle}>{p.name}</h1>
          <p className={styles.internText}>{p.groupName ? `${p.groupName} · ` : ''}{p.role ?? 'Team member'}</p>
          <div className={styles.actions}><Link className={`${styles.button} ${styles.primaryButton}`} to={`/intern/projects/${p.id}`}>Open project</Link></div>
        </div>
      ))}
    </div></main>
  )
}
export default MyProjectPage