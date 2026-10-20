import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/pages/DashboardPages.module.css'

export function MyProjectPage() {
 return <main className={`${styles.card} ${styles.internCanvas}`}><div className={styles.internContent}>
  
  <span className={styles.internIcon} aria-hidden="true">▤</span>
  <div><h1 className={styles.internTitle}>No project assigned yet</h1><p className={styles.internText}>Welcome, Lebo! Your mentor will place you in a project team soon. You’ll get a notification when that happens.</p></div>
  <div className={styles.actions}><Link className={`${styles.button} ${styles.primaryButton}`} to="/intern/profile/edit">Complete your profile</Link></div>
  
 </div></main>
}
export default MyProjectPage
