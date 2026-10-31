import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout/DashboardLayout'
import { ProtectedRoute } from './ProtectedRoute'

const guarded = (roles: Array<'ADMIN' | 'WIL_HANDLER' | 'MENTOR' | 'INTERN'>, element: import('react').ReactNode) => <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
const lazyPage = <T extends object, K extends keyof T>(load: () => Promise<T>, componentName: K) => ({
  lazy: async () => ({
    Component: (await load())[componentName] as import('react').ComponentType,
  }),
})

export const router = createBrowserRouter([
  {
    path: '/', element: <PublicLayout />, children: [
      { index: true, ...lazyPage(() => import('@/features/public-site/pages/HomePage.tsx'), 'HomePage') },
      { path: 'about', ...lazyPage(() => import('@/features/public-site/pages/AboutPage.tsx'), 'AboutPage') },
      { path: 'careers', ...lazyPage(() => import('@/features/public-site/pages/CareersPage.tsx'), 'CareersPage') },
      { path: 'careers/:positionId', ...lazyPage(() => import('@/features/public-site/pages/PositionDetailPage.tsx'), 'PositionDetailPage') },
      { path: 'contact', ...lazyPage(() => import('@/features/public-site/pages/ContactPage.tsx'), 'ContactPage') },
      { path: 'track', ...lazyPage(() => import('@/features/application/pages/TrackLoginPage.tsx'), 'TrackLoginPage') },
      { path: 'track/:reference', ...lazyPage(() => import('@/features/application/pages/TrackApplicationPage.tsx'), 'TrackApplicationPage') },
    ]
  },
  // The application form is a pop-up (?apply=…) mounted in PublicLayout; these paths redirect to it.
  { path: '/careers/:positionId/apply/*', ...lazyPage(() => import('@/features/application/pages/ApplyPage.tsx'), 'ApplyPage') },
  { path: '/apply/*', ...lazyPage(() => import('@/features/application/pages/ApplyPage.tsx'), 'ApplyPage') },
  {
    element: <AuthLayout />, children: [
      { path: '/login', ...lazyPage(() => import('@/features/auth/pages/LoginPage'), 'LoginPage') },
      { path: '/forgot-password', ...lazyPage(() => import('@/features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage') },
      // The account email links to /reset-password?token=…; the path-token forms are kept for older links.
      { path: '/reset-password', ...lazyPage(() => import('@/features/auth/pages/SetPasswordPage'), 'SetPasswordPage') },
      { path: '/create-password/:token', ...lazyPage(() => import('@/features/auth/pages/SetPasswordPage'), 'SetPasswordPage') },
      { path: '/set-password/:token', ...lazyPage(() => import('@/features/auth/pages/SetPasswordPage'), 'SetPasswordPage') },
    ]
  },
  {
    path: '/handler', element: guarded(['WIL_HANDLER'], <DashboardLayout />), children: [
      { path: 'dashboard', ...lazyPage(() => import('@/features/dashboard/pages/HandlerDashboardPage.tsx'), 'HandlerDashboardPage') },
      { path: 'applicants', ...lazyPage(() => import('@/features/applicants/pages/ApplicantsPage.tsx'), 'ApplicantsPage') },
      { path: 'interns', ...lazyPage(() => import('@/features/interns/pages/InternsPage.tsx'), 'InternsPage') },
      { path: 'interns/:internId', ...lazyPage(() => import('@/features/interns/pages/InternProfilePage.tsx'), 'InternProfilePage') },
      { path: 'campuses', ...lazyPage(() => import('@/features/campuses/pages/CampusesIntakesPage.tsx'), 'CampusesIntakesPage') },
      { path: 'past-interns', ...lazyPage(() => import('@/features/past-interns/pages/PastInternsPage.tsx'), 'PastInternsPage') },
      { path: 'notifications', ...lazyPage(() => import('@/features/notifications/pages/NotificationsPage.tsx'), 'NotificationsPage') },
      { path: 'profile', ...lazyPage(() => import('@/features/profile/pages/MyProfilePage.tsx'), 'MyProfilePage') },
      { path: 'profile/edit', ...lazyPage(() => import('@/features/profile/pages/EditProfilePage.tsx'), 'EditProfilePage') },
    ]
  },
  {
    path: '/admin', element: guarded(['ADMIN'], <DashboardLayout />), children: [
      { path: 'dashboard', ...lazyPage(() => import('@/features/dashboard/pages/AdminDashboardPage.tsx'), 'AdminDashboardPage') },
      { path: 'applicants', ...lazyPage(() => import('@/features/applicants/pages/ApplicantsPage.tsx'), 'ApplicantsPage') },
      { path: 'interns', ...lazyPage(() => import('@/features/interns/pages/InternsPage.tsx'), 'InternsPage') },
      { path: 'interns/:internId', ...lazyPage(() => import('@/features/interns/pages/InternProfilePage.tsx'), 'InternProfilePage') },
      { path: 'campuses', ...lazyPage(() => import('@/features/campuses/pages/CampusesIntakesPage.tsx'), 'CampusesIntakesPage') },
      { path: 'past-interns', ...lazyPage(() => import('@/features/past-interns/pages/PastInternsPage.tsx'), 'PastInternsPage') },
      { path: 'projects', ...lazyPage(() => import('@/features/projects/pages/ProjectsPage.tsx'), 'ProjectsPage') },
      { path: 'projects/:projectId', ...lazyPage(() => import('@/features/projects/pages/ProjectDetailPage.tsx'), 'ProjectDetailPage') },
      { path: 'team-builder/:projectId', ...lazyPage(() => import('@/features/team-builder/pages/TeamBuilderPage.tsx'), 'TeamBuilderPage') },
      { path: 'projects', ...lazyPage(() => import('@/features/projects/pages/ProjectsPage.tsx'), 'ProjectsPage') },
      { path: 'projects/:projectId', ...lazyPage(() => import('@/features/projects/pages/ProjectDetailPage.tsx'), 'ProjectDetailPage') },
      { path: 'team-builder', ...lazyPage(() => import('@/features/team-builder/pages/TeamBuilderPage.tsx'), 'TeamBuilderPage') },
      { path: 'tasks', ...lazyPage(() => import('@/features/tasks/pages/TaskBoardOverviewPage.tsx'), 'TaskBoardOverviewPage') },
      { path: 'tasks/review', ...lazyPage(() => import('@/features/tasks/pages/ReviewQueuePage.tsx'), 'ReviewQueuePage') },
      { path: 'calendar', ...lazyPage(() => import('@/features/calendar/pages/CalendarPage.tsx'), 'CalendarPage') },
      { path: 'gantt', ...lazyPage(() => import('@/features/gantt/pages/GanttPage.tsx'), 'GanttPage') },
      { path: 'reports', ...lazyPage(() => import('@/features/reports/pages/ReportsPage.tsx'), 'ReportsPage') },
      { path: 'users', ...lazyPage(() => import('@/features/users/pages/UsersPage.tsx'), 'UsersPage') },
      { path: 'notifications', ...lazyPage(() => import('@/features/notifications/pages/NotificationsPage.tsx'), 'NotificationsPage') },
      { path: 'emails', ...lazyPage(() => import('@/features/notifications/pages/EmailTemplatesPage.tsx'), 'EmailTemplatesPage') },
      { path: 'profile', ...lazyPage(() => import('@/features/profile/pages/MyProfilePage.tsx'), 'MyProfilePage') },
      { path: 'profile/edit', ...lazyPage(() => import('@/features/profile/pages/EditProfilePage.tsx'), 'EditProfilePage') },
    ]
  },
  {
    path: '/mentor', element: guarded(['MENTOR'], <DashboardLayout />), children: [
      { path: 'dashboard', ...lazyPage(() => import('@/features/dashboard/pages/MentorDashboardPage.tsx'), 'MentorDashboardPage') },
      { path: 'projects', ...lazyPage(() => import('@/features/projects/pages/ProjectsPage.tsx'), 'ProjectsPage') },
      { path: 'projects/:projectId', ...lazyPage(() => import('@/features/projects/pages/ProjectDetailPage.tsx'), 'ProjectDetailPage') },
      { path: 'team-builder/:projectId', ...lazyPage(() => import('@/features/team-builder/pages/TeamBuilderPage.tsx'), 'TeamBuilderPage') },
      { path: 'tasks', ...lazyPage(() => import('@/features/tasks/pages/TaskBoardOverviewPage.tsx'), 'TaskBoardOverviewPage') },
      { path: 'tasks/review', ...lazyPage(() => import('@/features/tasks/pages/ReviewQueuePage.tsx'), 'ReviewQueuePage') },
      { path: 'calendar', ...lazyPage(() => import('@/features/calendar/pages/CalendarPage.tsx'), 'CalendarPage') },
      { path: 'gantt', ...lazyPage(() => import('@/features/gantt/pages/GanttPage.tsx'), 'GanttPage') },
      { path: 'notifications', ...lazyPage(() => import('@/features/notifications/pages/NotificationsPage.tsx'), 'NotificationsPage') },
      { path: 'profile', ...lazyPage(() => import('@/features/profile/pages/MyProfilePage.tsx'), 'MyProfilePage') },
      { path: 'profile/edit', ...lazyPage(() => import('@/features/profile/pages/EditProfilePage.tsx'), 'EditProfilePage') },
      { path: 'dashboard', ...lazyPage(() => import('@/features/dashboard/pages/MentorDashboardPage.tsx'), 'MentorDashboardPage') },
      { path: 'projects', ...lazyPage(() => import('@/features/projects/pages/ProjectsPage.tsx'), 'ProjectsPage') },
      { path: 'projects/:projectId', ...lazyPage(() => import('@/features/projects/pages/ProjectDetailPage.tsx'), 'ProjectDetailPage') },
      { path: 'team-builder', ...lazyPage(() => import('@/features/team-builder/pages/TeamBuilderPage.tsx'), 'TeamBuilderPage') },
      { path: 'tasks', ...lazyPage(() => import('@/features/tasks/pages/TaskBoardOverviewPage.tsx'), 'TaskBoardOverviewPage') },
      { path: 'tasks/review', ...lazyPage(() => import('@/features/tasks/pages/ReviewQueuePage.tsx'), 'ReviewQueuePage') },
    ]
  },
  {
    path: '/intern', element: guarded(['INTERN'], <DashboardLayout />), children: [
      { path: 'project', ...lazyPage(() => import('@/features/projects/pages/MyProjectPage.tsx'), 'MyProjectPage') },
      { path: 'projects/:projectId', ...lazyPage(() => import('@/features/projects/pages/ProjectDetailPage.tsx'), 'ProjectDetailPage') },
      { path: 'tasks', ...lazyPage(() => import('@/features/tasks/pages/InternTaskBoardPage.tsx'), 'InternTaskBoardPage') },
      { path: 'tasks/review', ...lazyPage(() => import('@/features/tasks/pages/ReviewQueuePage.tsx'), 'ReviewQueuePage') },
      { path: 'calendar', ...lazyPage(() => import('@/features/calendar/pages/CalendarPage.tsx'), 'CalendarPage') },
      { path: 'gantt', ...lazyPage(() => import('@/features/gantt/pages/GanttPage.tsx'), 'GanttPage') },
      { path: 'notifications', ...lazyPage(() => import('@/features/notifications/pages/NotificationsPage.tsx'), 'NotificationsPage') },
      { path: 'profile', ...lazyPage(() => import('@/features/profile/pages/MyProfilePage.tsx'), 'MyProfilePage') },
      { path: 'profile/edit', ...lazyPage(() => import('@/features/profile/pages/EditProfilePage.tsx'), 'EditProfilePage') },
    ]
  },
  { path: '/403', ...lazyPage(() => import('@/features/misc/NotFoundPage.tsx'), 'NotFoundPage') },
  { path: '*', ...lazyPage(() => import('@/features/misc/NotFoundPage.tsx'), 'NotFoundPage') },
])
