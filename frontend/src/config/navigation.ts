import type { UserRole } from '@/types'

export type NavigationSection = 'MAIN' | 'PROJECTS' | 'COMMUNICATION' | 'ADMIN'
export interface NavigationItem { label: string; path: string; section: NavigationSection; readOnly?: boolean }

const navigation: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', section: 'MAIN' },
    { label: 'Interns', path: '/admin/interns', section: 'MAIN' },
    { label: 'Applicants', path: '/admin/applicants', section: 'MAIN' },
    { label: 'Campuses & Intakes', path: '/admin/campuses', section: 'MAIN' },
    { label: 'Past Interns', path: '/admin/past-interns', section: 'MAIN' },
    { label: 'Projects', path: '/admin/projects', section: 'PROJECTS' },
    { label: 'Task Board', path: '/admin/tasks', section: 'PROJECTS' },
    { label: 'Calendar', path: '/admin/calendar', section: 'PROJECTS' },
    { label: 'Gantt Chart', path: '/admin/gantt', section: 'PROJECTS' },
    { label: 'Reports', path: '/admin/reports', section: 'ADMIN' },
    { label: 'Users', path: '/admin/users', section: 'ADMIN' },
    { label: 'Notifications', path: '/admin/notifications', section: 'ADMIN' },
    { label: 'Email Templates', path: '/admin/emails', section: 'ADMIN' },
  ],
  WIL_HANDLER: [
    { label: 'Dashboard', path: '/handler/dashboard', section: 'MAIN' },
    { label: 'Applicants', path: '/handler/applicants', section: 'MAIN' },
    { label: 'Interns', path: '/handler/interns', section: 'MAIN' },
    { label: 'Campuses & Intakes', path: '/handler/campuses', section: 'MAIN' },
    { label: 'Past Interns', path: '/handler/past-interns', section: 'MAIN' },
    { label: 'Notifications', path: '/handler/notifications', section: 'COMMUNICATION' },
  ],
  MENTOR: [
    { label: 'Dashboard', path: '/mentor/dashboard', section: 'MAIN' },
    { label: 'Projects', path: '/mentor/projects', section: 'PROJECTS' },
    { label: 'Task Board', path: '/mentor/tasks', section: 'PROJECTS' },
    { label: 'Calendar', path: '/mentor/calendar', section: 'PROJECTS' },
    { label: 'Gantt Chart', path: '/mentor/gantt', section: 'PROJECTS' },
    { label: 'Notifications', path: '/mentor/notifications', section: 'COMMUNICATION' },
  ],
  INTERN: [
    { label: 'My Project', path: '/intern/project', section: 'MAIN' },
    { label: 'My Profile', path: '/intern/profile', section: 'MAIN' },
    { label: 'Task Board', path: '/intern/tasks', section: 'PROJECTS', readOnly: true },
    { label: 'Calendar', path: '/intern/calendar', section: 'PROJECTS', readOnly: true },
    { label: 'Gantt Chart', path: '/intern/gantt', section: 'PROJECTS', readOnly: true },
    { label: 'Notifications', path: '/intern/notifications', section: 'COMMUNICATION' },
  ],
}

// Keep project-specific Team Builder navigation inside a selected project; role access
// and route availability remain governed by the existing router.
export function getNavigation(role: UserRole) { return navigation[role] }
