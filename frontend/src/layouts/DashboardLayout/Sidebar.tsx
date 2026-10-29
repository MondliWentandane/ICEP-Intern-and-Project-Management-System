import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Box, IconButton, InputBase, Typography } from '@mui/material'
import { Link as RouterLink, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Building2, CalendarDays, ChartNoAxesGantt, ClipboardList, FolderKanban, History, LayoutDashboard, LogOut, Search, Users, X } from 'lucide-react'
import { getNavigation, type NavigationItem, type NavigationSection } from '@/config/navigation'
import icepLogo from '@/assets/icep-logo-b&w.png'
import { useAuth } from '@/hooks/useAuth'
import { homeByRole } from '@/routes/paths'
import styles from './DashboardLayout.module.css'

const icons: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard, Applicants: ClipboardList, Interns: Users, 'Campuses & Intakes': Building2,
  'Past Interns': History, Projects: FolderKanban, 'My Project': FolderKanban, 'Task Board': ClipboardList,
  Calendar: CalendarDays, 'Gantt Chart': ChartNoAxesGantt, Gantt: ChartNoAxesGantt, Reports: ClipboardList,
  Users: Users, Notifications: Bell, 'My Profile': Users, 'Email Templates': ClipboardList,
}
const sectionLabels: Record<NavigationSection, string> = {
  MAIN: 'Main', PROJECTS: 'Projects', COMMUNICATION: 'Communication', ADMIN: 'Admin',
}
const sections: NavigationSection[] = ['MAIN', 'PROJECTS', 'COMMUNICATION', 'ADMIN']
const roleLabels: Record<string, string> = { ADMIN: 'Administrator', WIL_HANDLER: 'WIL Handler', MENTOR: 'Mentor', INTERN: 'Intern' }

export function Sidebar({ mobileOpen, collapsed, onClose }: { mobileOpen: boolean; collapsed: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const tabRef = useRef<HTMLSpanElement>(null)
  const links = useMemo(() => user ? getNavigation(user.role).filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : [], [user, query])

  // The active "tab" is one element that slides to whichever link is active,
  // and follows it when the list changes size (collapse, search, window resize).
  useLayoutEffect(() => {
    const nav = navRef.current
    const tab = tabRef.current
    if (!nav || !tab) return
    const place = () => {
      const active = nav.querySelector<HTMLElement>(`.${styles['nav-link-active']}`)
      tab.style.opacity = active ? '1' : '0'
      if (active) { tab.style.top = `${active.offsetTop}px`; tab.style.height = `${active.offsetHeight}px` }
    }
    place()
    // No slide on first paint; animate every move after that.
    const frame = requestAnimationFrame(() => tab.setAttribute('data-ready', 'true'))
    const observer = new ResizeObserver(place)
    observer.observe(nav)
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [location.pathname, links, collapsed])

  if (!user) return null
  const displayName = user.name?.trim() || user.email || 'User'
  const initials = displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const handleLogout = () => { logout(); navigate('/login') }

  return <>
    {mobileOpen && <button className={styles.scrim} aria-label="Close navigation" onClick={onClose} />}
    <Box component="aside" id="dashboard-sidebar" className={`${styles.sidebar} ${mobileOpen ? styles['sidebar-open'] : ''}`}>
      <Box className={styles['sidebar-brand']}>
        <Box component={RouterLink} to={homeByRole[user.role]} aria-label="Go to dashboard" className={styles['brand-link']} onClick={onClose}>
          <Box component="img" src={icepLogo} alt="ICEP" className={styles['brand-logo']} />
        </Box>
        <IconButton className={styles['mobile-close']} aria-label="Close menu" onClick={onClose}><X size={20} /></IconButton>
      </Box>
      <Box className={styles['sidebar-search']}>
        <Search size={18} aria-hidden="true" />
        <InputBase value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" inputProps={{ 'aria-label': 'Filter navigation' }} />
      </Box>
      <Box component="nav" ref={navRef} aria-label="Main navigation" className={styles['sidebar-nav']}>
        <span ref={tabRef} className={styles['nav-tab']} aria-hidden="true" />
        {sections.map((section) => {
          const items = links.filter((item) => item.section === section)
          if (!items.length) return null
          return <Box component="section" key={section} className={styles['nav-section']}>
            <Typography component="h2" className={styles['nav-heading']}>{sectionLabels[section]}</Typography>
            {items.map((item: NavigationItem) => {
              const Icon = icons[item.label] ?? LayoutDashboard
              return <NavLink key={item.path} to={item.path} onClick={onClose} end data-label={item.label}
                aria-label={collapsed ? item.label : undefined}
                className={({ isActive }) => `${styles['nav-link']} ${isActive || location.pathname.startsWith(`${item.path}/`) ? styles['nav-link-active'] : ''}`}>
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                <span className={styles['nav-label']}>{item.label}</span>
                {item.readOnly && <span className={styles['read-only']}>View only</span>}
              </NavLink>
            })}
          </Box>
        })}
      </Box>
      <Box className={styles['sidebar-user']}>
        <Box className={styles['user-avatar']} title={collapsed ? displayName : undefined}>{initials}</Box>
        <Box className={styles['user-copy']}><Typography className={styles['user-name']}>{displayName}</Typography><Typography className={styles['user-role']}>{roleLabels[user.role] ?? user.role}</Typography></Box>
        <IconButton aria-label="Sign out" className={styles['logout-button']} onClick={handleLogout}><LogOut size={18} /></IconButton>
      </Box>
    </Box>
  </>
}
