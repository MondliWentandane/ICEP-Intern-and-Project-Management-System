import { Link } from 'react-router-dom'
import styles from './DashboardPages.module.css'

const campuses = [
  { name: 'Pretoria', applicants: 4, interviewees: 2, interns: 12 },
  { name: 'Soshanguve South', applicants: 5, interviewees: 2, interns: 9 },
  { name: 'Soshanguve North', applicants: 3, interviewees: 1, interns: 5 },
  { name: 'Arcadia', applicants: 2, interviewees: 1, interns: 4 },
  { name: 'Ga-Rankuwa', applicants: 2, interviewees: 1, interns: 3 },
  { name: 'eMalahleni', applicants: 2, interviewees: 1, interns: 4 },
  { name: 'Mbombela', applicants: 1, interviewees: 0, interns: 2 },
  { name: 'Polokwane', applicants: 2, interviewees: 1, interns: 3 },
]
function SummaryCard({ label, value, detail, badge, badgeClass }: { label: string; value: string; detail: string; badge: string; badgeClass: string }) {
 return <section className={`${styles.card} ${styles.metric}`}><div className={styles.toolbar}><span className={styles.metricLabel}>{label}</span><span className={`${styles.pill} ${styles[badgeClass]}`}>{badge}</span></div><p className={styles.metricValue}>{value}</p><p className={styles.metricNote}>{detail}</p></section>
}
export function AdminDashboardPage() {
 return <main className={styles.page}>
  <div className={styles.toolbar}><p className={styles.subheading}>Interns overview across all campuses.</p><label className={styles.inline}><span className={styles.muted}>Campus</span><select aria-label="Campus" className={styles.button}><option>All campuses</option>{campuses.map(({ name }) => <option key={name}>{name}</option>)}</select></label></div>
  <div className={styles.metrics}><SummaryCard label="Applicants" value="21" detail="Awaiting approval" badge="+6 this week" badgeClass="blue" /><SummaryCard label="Interviewees" value="9" detail="Accepted, before placement" badge="3 interviews this week" badgeClass="yellow" /><SummaryCard label="Active interns" value="42" detail="Currently on placement" badge="92% completion rate" badgeClass="green" /></div>
  <section className={`${styles.card} ${styles.tableCard}`}><header className={styles.cardHeader}><h2 className={styles.cardTitle}>By campus</h2><p className={styles.subheading}>Applicants, interviewees and active interns for each campus.</p></header><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Campus</th><th>Applicants</th><th>Interviewees</th><th>Active interns</th><th /></tr></thead><tbody>{campuses.map((campus) => <tr key={campus.name}><td><strong>{campus.name}</strong></td><td>{campus.applicants}</td><td>{campus.interviewees}</td><td><div className={styles.inline}><span>{campus.interns}</span><div className={styles.progress}><span style={{ width: `${campus.interns / 12 * 100}%` }} /></div></div></td><td><Link className={styles.link} to="/admin/campuses">View →</Link></td></tr>)}</tbody><tfoot><tr><td>Total</td><td>21</td><td>9</td><td>42</td><td /></tr></tfoot></table></div></section>
 </main>
}
export default AdminDashboardPage
