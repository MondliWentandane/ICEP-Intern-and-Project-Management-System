import { useMemo, useState } from 'react'
import { Box, IconButton, InputBase, Typography } from '@mui/material'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Building2, CalendarDays, ChartNoAxesGantt, ClipboardList, FolderKanban, History, LayoutDashboard, LogOut, Search, Users, X } from 'lucide-react'
import { getNavigation, type NavigationItem } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import styles from './DashboardLayout.module.css'

const icons: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard, Applicants: ClipboardList, Interns: Users, 'Campuses & Intakes': Building2,
  'Past Interns': History, Projects: FolderKanban, 'My Project': FolderKanban, 'Task Board': ClipboardList,
  Calendar: CalendarDays, 'Gantt Chart': ChartNoAxesGantt, Reports: ClipboardList, Users: Users,
  Notifications: Bell, 'My Profile': Users,
}
const sectionLabels: Record<NavigationItem['section'], string> = {
  MAIN: 'Main', PROJECTS: 'Projects', ADMIN: 'Admin',
}
const roleLabels: Record<string, string> = { admin: 'Administrator', wil_handler: 'WIL Handler', mentor: 'Mentor', intern: 'Intern' }

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const links = useMemo(() => user ? getNavigation(user.role).filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : [], [user, query])
  if (!user) return null
  const sections: NavigationItem['section'][] = ['MAIN', 'PROJECTS', 'ADMIN']
  const initials = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const handleLogout = () => { logout(); navigate('/login') }

  return <>
    {mobileOpen && <button className={styles.scrim} aria-label="Close navigation" onClick={onClose} />}
    <Box component="aside" className={`${styles.sidebar} ${mobileOpen ? styles['sidebar-open'] : ''}`}>
      <Box className={styles['sidebar-brand']}>
        <Typography component="span" className={styles['brand-wordmark']}>ICEP.</Typography>
        <IconButton className={styles['mobile-close']} aria-label="Close menu" onClick={onClose}><X size={20} /></IconButton>
      </Box>
      <Box className={styles['sidebar-search']}>
        <Search size={18} aria-hidden="true" />
        <InputBase value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" inputProps={{ 'aria-label': 'Filter navigation' }} />
      </Box>
      <Box component="nav" aria-label="Main navigation" className={styles['sidebar-nav']}>
        {sections.map((section) => {
          const items = links.filter((item) => item.section === section)
          if (!items.length) return null
          return <Box component="section" key={section} className={styles['nav-section']}>
            <Typography component="h2" className={styles['nav-heading']}>{sectionLabels[section]}</Typography>
            {items.map((item) => {
              const Icon = icons[item.label] ?? LayoutDashboard
              return <NavLink key={item.path} to={item.path} onClick={onClose} end className={({ isActive }) => `${styles['nav-link']} ${isActive || location.pathname.startsWith(`${item.path}/`) ? styles['nav-link-active'] : ''}`}>
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
                <span>{item.label}</span>
                {item.readOnly && <span className={styles['read-only']}>View only</span>}
              </NavLink>
            })}
          </Box>
        })}
      </Box>
      <Box className={styles['sidebar-user']}>
        <Box className={styles['user-avatar']}>{initials}</Box>
        <Box className={styles['user-copy']}><Typography className={styles['user-name']}>{user.name}</Typography><Typography className={styles['user-role']}>{roleLabels[user.role] ?? user.role}</Typography></Box>
        <IconButton aria-label="Sign out" className={styles['logout-button']} onClick={handleLogout}><LogOut size={18} /></IconButton>
      </Box>
    </Box>
  </>
}


