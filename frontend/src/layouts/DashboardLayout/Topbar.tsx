import { AppBar, Avatar, Badge, Box, IconButton, InputBase, Toolbar, Typography } from '@mui/material'
import { Bell, Menu, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import styles from './DashboardLayout.module.css'

const titles: Record<string, string> = {
  dashboard: 'Dashboard', applicants: 'Applicants', interns: 'Interns', campuses: 'Campuses & Intakes',
  'past-interns': 'Past Interns', projects: 'Projects', tasks: 'Task Board', calendar: 'Calendar',
  gantt: 'Gantt Chart', reports: 'Reports', users: 'Users', notifications: 'Notifications',
  project: 'My Project', profile: 'My Profile',
}
export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  const location = useLocation()
  const pageKey = location.pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const title = titles[pageKey] ?? 'ICEP Workspace'
  const profilePath = user ? `/${user.role === 'wil_handler' ? 'handler' : user.role}/profile` : '/login'
  const notificationsPath = user ? `/${user.role === 'wil_handler' ? 'handler' : user.role}/notifications` : '/login'
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
  return <AppBar position="sticky" color="inherit" elevation={0} className={styles.topbar}>
    <Toolbar className={styles['topbar-toolbar']}>
      <IconButton aria-label="Open navigation" className={styles['mobile-menu']} onClick={onMenuClick}><Menu size={21} /></IconButton>
      <Typography component="h1" className={styles['page-title']}>{title}</Typography>
      <Box className={styles['topbar-actions']}>
        <Box className={styles['topbar-search']}><Search size={19} aria-hidden="true" /><InputBase placeholder="Search" inputProps={{ 'aria-label': 'Search this workspace' }} /></Box>
        <IconButton component={Link} to={notificationsPath} aria-label="Notifications" className={styles['topbar-icon']}><Badge variant="dot" color="error"><Bell size={21} /></Badge></IconButton>
        <IconButton component={Link} to={profilePath} aria-label="Open profile" className={styles['profile-link']}><Avatar className={styles['topbar-avatar']}>{initials}</Avatar></IconButton>
      </Box>
    </Toolbar>
  </AppBar>
}