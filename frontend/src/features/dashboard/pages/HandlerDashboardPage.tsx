import { Link } from 'react-router-dom'
import styles from './DashboardPages.module.css'

const pending = [
 { initials: 'TM', name: 'Thabo Molefe', course: 'Soshanguve South · Computer Science', date: '30 Sep 2026' },
 { initials: 'LD', name: 'Lerato Dlamini', course: 'Arcadia · Information Technology', date: '30 Sep 2026' },
 { initials: 'NK', name: 'Naledi Khumalo', course: 'Soshanguve North · Multimedia Computing', date: '29 Sep 2026' },
 { initials: 'ZM', name: 'Zanele Mokoena', course: 'Polokwane · Informatics', date: '27 Sep 2026' },
 { initials: 'PR', name: 'Palesa Radebe', course: 'eMalahleni · Computer Science', date: '26 Sep 2026' },
]
const notices = [
 ['Acceptance email sent to Kabelo Sithole', '2 hours ago'], ['3 new applications for Soshanguve South', 'Yesterday'],
 ['Sarah Johnson submitted Weekly Report (Week 4)', '2 days ago'], ["Tshepo Mahlangu's application was rejected", '26 Sep 2026'],
 ['12 past interns are missing final reports', '1 week ago'],
]
function Metric({ title, value, note, icon, to, wide = false }: { title: string; value: string; note: string; icon: string; to: string; wide?: boolean }) {
 return <section className={`${styles.card} ${styles.metricCard} ${wide ? styles.handlerMetricWide : styles.handlerMetric}`}><div><span className={styles.metricIcon}>{icon}</span><span className={styles.metricTitle}>{title}</span></div><p className={styles.metricValue}>{value}</p><p className={styles.metricNote}>{note}</p><Link className={styles.actionLink} to={to}>View {title.toLowerCase()} →</Link></section>
}
export function HandlerDashboardPage() {
 return <main className={styles.page}><header><h1 className={styles.heading}>Welcome back, Sam</h1><p className={styles.subheading}>A summary of everything you manage as WIL Handler.</p></header>
  <div className={styles.handlerMetrics}><Metric title="Applicants" value="21" note="Awaiting approval" icon="▤" to="/handler/applicants" /><Metric title="Interns" value="42" note="Currently on placement" icon="♙" to="/handler/interns" /><Metric title="Campuses & Intakes" value="3" note="Campuses with open intakes" icon="▦" to="/handler/campuses" /><Metric title="Past Interns" value="148" note="Completed placements · 92% completed" icon="◷" to="/handler/past-interns" wide /><Metric title="Notifications" value="3" note="Unread notifications" icon="♧" to="/handler/notifications" wide /></div>
  <div className={styles.twoColumns}><section className={`${styles.card} ${styles.listCard}`}><header className={styles.listHeader}><h2 className={styles.cardTitle}>Awaiting approval</h2><Link className={styles.link} to="/handler/applicants">View all</Link></header>{pending.map((row) => <div className={styles.listRow} key={row.name}><span className={styles.avatar}>{row.initials}</span><div className={styles.rowMain}><p className={styles.rowTitle}>{row.name}</p><p className={styles.rowNote}>{row.course}</p></div><span className={styles.muted}>{row.date}</span><span className={`${styles.pill} ${styles.yellow}`}>Pending</span></div>)}</section>
   <section className={`${styles.card} ${styles.listCard}`}><header className={styles.listHeader}><h2 className={styles.cardTitle}>Recent notifications</h2><Link className={styles.link} to="/handler/notifications">View all</Link></header>{notices.map(([title, when], index) => <div className={styles.listRow} key={title}><span className={styles.noticeDot} style={{ opacity: index < 3 ? 1 : .25 }} /><div><p className={styles.rowTitle}>{title}</p><p className={styles.rowNote}>{when}</p></div></div>)}</section></div>
 </main>
}
export default HandlerDashboardPage
