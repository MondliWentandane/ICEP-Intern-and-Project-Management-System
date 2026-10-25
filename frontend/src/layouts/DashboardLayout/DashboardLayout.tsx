import { Box, useMediaQuery } from '@mui/material'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './DashboardLayout.module.css'

const COLLAPSED_KEY = 'icep.sidebar.collapsed'
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSED_KEY) === '1' } catch { return false } }

export function DashboardLayout() {
  const phone = useMediaQuery('(max-width: 760px)')
  const [mobileOpen, setMobileOpen] = useState(false)
  // Desktop: the sidebar can shrink to an icon rail. Remembered between visits.
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => { try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0') } catch { /* storage unavailable */ } }, [collapsed])
  // The drawer only exists on phones, so it never stays open after switching to a wider screen.
  const drawerOpen = phone && mobileOpen
  const toggleMenu = () => (phone ? setMobileOpen((open) => !open) : setCollapsed((value) => !value))
  const menuOpen = phone ? drawerOpen : !collapsed

  return (
    <Box className={`${styles['dashboard-layout']} ${collapsed && !phone ? styles.collapsed : ''}`}>
      <Sidebar mobileOpen={drawerOpen} collapsed={collapsed && !phone} onClose={() => setMobileOpen(false)} />
      <Box className={styles['dashboard-main']}>
        <Topbar menuOpen={menuOpen} phone={phone} onMenuClick={toggleMenu} />
        <Box component="main" className={styles['dashboard-content']}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
export default DashboardLayout
