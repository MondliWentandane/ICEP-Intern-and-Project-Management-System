import { Outlet } from 'react-router-dom'
import brandArtwork from '../../assets/icep-auth-artwork.png'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  return (
    <main className={styles.authShell}>
      <div className={styles.authFrame}>
        <section className={styles.brandPanel} aria-label="ICEP welcome">
          <div className={styles.brandContent}>
            <span className={styles.welcome}>Welcome to</span>
            <img className={styles.brandArtwork} src={brandArtwork} alt="ICEP logo artwork" />
          </div>
        </section>
        <section className={styles.formPanel} aria-label="Account access">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
export default AuthLayout
