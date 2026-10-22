import { AppBar, Avatar, Badge, Box, IconButton, InputBase, Toolbar, Typography } from '@mui/material'
import { Bell, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { rolePrefix } from '@/routes/paths'
import styles from './DashboardLayout.module.css'

const titles: Record<string, string> = {
  dashboard: 'Dashboard', applicants: 'Applicants', interns: 'Interns', campuses: 'Campuses & Intakes',
  'past-interns': 'Past Interns', projects: 'Projects', tasks: 'Task Board', calendar: 'Calendar',
  gantt: 'Gantt Chart', reports: 'Reports', users: 'Users', notifications: 'Notifications',
  project: 'My Project', profile: 'My Profile',
}
export function Topbar({ menuOpen, phone, onMenuClick }: { menuOpen: boolean; phone: boolean; onMenuClick: () => void }) {
  const { user } = useAuth()
  const location = useLocation()
  const pageKey = location.pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const title = titles[pageKey] ?? 'ICEP Workspace'
  const profilePath = user ? `${rolePrefix[user.role]}/profile` : '/login'
  const notificationsPath = user ? `${rolePrefix[user.role]}/notifications` : '/login'
  const menuLabel = phone ? (menuOpen ? 'Close navigation' : 'Open navigation') : (menuOpen ? 'Collapse sidebar' : 'Expand sidebar')
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
  return <AppBar position="sticky" color="inherit" elevation={0} className={styles.topbar}>
    <Toolbar className={styles['topbar-toolbar']}>
      {/* Three lines that fold into a collapse arrow (desktop, sidebar open) or an X (phone, menu open) */}
      <button type="button" className={styles.burger} data-state={menuOpen ? (phone ? 'close' : 'collapse') : 'menu'}
        aria-label={menuLabel} aria-controls="dashboard-sidebar" aria-expanded={menuOpen} onClick={onMenuClick}>
        <span /><span /><span />
      </button>
      <Typography component="h1" className={styles['page-title']}>{title}</Typography>
      <Box className={styles['topbar-actions']}>
        <Box className={styles['topbar-search']}><Search size={19} aria-hidden="true" /><InputBase placeholder="Search" inputProps={{ 'aria-label': 'Search this workspace' }} /></Box>
        <IconButton component={Link} to={notificationsPath} aria-label="Notifications" className={styles['topbar-icon']}><Badge variant="dot" color="error"><Bell size={21} /></Badge></IconButton>
        <IconButton component={Link} to={profilePath} aria-label="Open profile" className={styles['profile-link']}><Avatar className={styles['topbar-avatar']}>{initials}</Avatar></IconButton>
      </Box>
    </Toolbar>
  </AppBar>
}