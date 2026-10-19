import { Box } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './DashboardLayout.module.css'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <Box className={styles['dashboard-layout']}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box className={styles['dashboard-main']}>
        <Topbar onMenuClick={() => setMobileOpen((open) => !open)} />
        <Box component="main" className={styles['dashboard-content']}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
export default DashboardLayout
