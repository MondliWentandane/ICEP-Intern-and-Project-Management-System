import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/pages/DashboardPages.module.css'

export function MyProjectPage() {
 return <main className={`${styles.card} ${styles.internCanvas}`}><div className={styles.internContent}>
  <span className={`${styles.pill} ${styles.purple}`}>● &nbsp; Active Intern · July 2026, Polokwane</span>
  <span className={styles.internIcon} aria-hidden="true">▤</span>
  <div><h1 className={styles.internTitle}>No project assigned yet</h1><p className={styles.internText}>Welcome, Lebo! Your mentor will place you in a project team soon. You’ll get a notification when that happens.</p></div>
  <div className={styles.actions}><Link className={`${styles.button} ${styles.primaryButton}`} to="/intern/profile/edit">Complete your profile</Link><a className={styles.button} href="mailto:wil-support@example.com">Contact coordinator</a></div>
  <div className={styles.internWidgets}><section className={styles.widget}><h2 className={styles.widgetTitle}>☑ &nbsp; Getting Started</h2>{['Upload your CV', 'Check your details', 'Set a strong password'].map((label) => <label className={styles.checkRow} key={label}><input type="checkbox" />{label}</label>)}</section><section className={`${styles.widget} ${styles.upcoming}`}><h2 className={styles.widgetTitle}>▢ &nbsp; Upcoming</h2><span className={styles.muted}>Nothing scheduled yet.</span></section></div>
  <p className={styles.muted}>☼ &nbsp; Tip: Check the Calendar for upcoming dates.</p>
 </div></main>
}
export default MyProjectPage
