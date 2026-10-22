import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout/PublicLayout'
import { ApplyLayout } from '@/layouts/ApplyLayout/ApplyLayout'
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout/DashboardLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { SetPasswordPage } from '@/features/auth/pages/SetPasswordPage'
import { HomePage } from '@/features/public-site/pages/HomePage.tsx'
import { AboutPage } from '@/features/public-site/pages/AboutPage.tsx'
import { CareersPage } from '@/features/public-site/pages/CareersPage.tsx'
import { PositionDetailPage } from '@/features/public-site/pages/PositionDetailPage.tsx'
import { ContactPage } from '@/features/public-site/pages/ContactPage.tsx'
import { ApplyPage } from '@/features/application/pages/ApplyPage.tsx'
import { ApplicationSubmittedPage } from '@/features/application/pages/ApplicationSubmittedPage.tsx'
import { HandlerDashboardPage } from '@/features/dashboard/pages/HandlerDashboardPage.tsx'
import { AdminDashboardPage } from '@/features/dashboard/pages/AdminDashboardPage.tsx'
import { MentorDashboardPage } from '@/features/dashboard/pages/MentorDashboardPage.tsx'
import { ApplicantsPage } from '@/features/applicants/pages/ApplicantsPage.tsx'
import { InternDashboardPage } from '@/features/dashboard/pages/InternDashboardPage.tsx'
import { InternsPage } from '@/features/interns/pages/InternsPage.tsx'
import { InternProfilePage } from '@/features/interns/pages/InternProfilePage.tsx'
import { PastInternsPage } from '@/features/past-interns/pages/PastInternsPage.tsx'
import { CampusesIntakesPage } from '@/features/campuses/pages/CampusesIntakesPage.tsx'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage.tsx'
import { MyProjectPage } from '@/features/projects/pages/MyProjectPage.tsx'
import { ProjectDetailPage } from '@/features/projects/pages/ProjectDetailPage.tsx'
import { TeamBuilderPage } from '@/features/team-builder/pages/TeamBuilderPage.tsx'
import { InternTaskBoardPage } from '@/features/tasks/pages/InternTaskBoardPage.tsx'
import { TaskBoardOverviewPage } from '@/features/tasks/pages/TaskBoardOverviewPage.tsx'
import { ReviewQueuePage } from '@/features/tasks/pages/ReviewQueuePage.tsx'
import { CalendarPage } from '@/features/calendar/pages/CalendarPage.tsx'
import { GanttPage } from '@/features/gantt/pages/GanttPage.tsx'
import { ReportsPage } from '@/features/reports/pages/ReportsPage.tsx'
import { UsersPage } from '@/features/users/pages/UsersPage.tsx'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage.tsx'
import { EmailTemplatesPage } from '@/features/notifications/pages/EmailTemplatesPage.tsx'
import { MyProfilePage } from '@/features/profile/pages/MyProfilePage.tsx'
import { EditProfilePage } from '@/features/profile/pages/EditProfilePage.tsx'
import { NotFoundPage } from '@/features/misc/NotFoundPage.tsx'

const guarded = (roles: Array<'admin' | 'wil_handler' | 'mentor' | 'intern'>, element: import('react').ReactNode) => <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
export const router = createBrowserRouter([
  { path: '/', element: <PublicLayout />, children: [
    { index: true, element: <HomePage /> }, { path: 'about', element: <AboutPage /> }, { path: 'careers', element: <CareersPage /> },
    { path: 'careers/:positionId', element: <PositionDetailPage /> }, { path: 'contact', element: <ContactPage /> },
  ] },
  { path: '/careers/:positionId/apply', element: <ApplyLayout />, children: [
    { index: true, element: <ApplyPage /> }, { path: 'submitted', element: <ApplicationSubmittedPage /> },
  ] },
  { element: <AuthLayout />, children: [
    { path: '/login', element: <LoginPage /> }, { path: '/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/create-password/:token', element: <SetPasswordPage /> }, { path: '/set-password/:token', element: <SetPasswordPage /> },
  ] },
  { path: '/handler', element: guarded(['wil_handler'], <DashboardLayout />), children: [
    { path: 'dashboard', element: <HandlerDashboardPage /> }, { path: 'applicants', element: <ApplicantsPage /> }, { path: 'interns', element: <InternsPage /> },
    { path: 'interns/:internId', element: <InternProfilePage /> }, { path: 'campuses', element: <CampusesIntakesPage /> }, { path: 'past-interns', element: <PastInternsPage /> },
    { path: 'notifications', element: <NotificationsPage /> }, { path: 'profile', element: <MyProfilePage /> }, { path: 'profile/edit', element: <EditProfilePage /> },
  ] },
  { path: '/admin', element: guarded(['admin'], <DashboardLayout />), children: [
    { path: 'dashboard', element: <AdminDashboardPage /> }, { path: 'applicants', element: <ApplicantsPage /> }, { path: 'interns', element: <InternsPage /> },
    { path: 'interns/:internId', element: <InternProfilePage /> }, { path: 'campuses', element: <CampusesIntakesPage /> }, { path: 'past-interns', element: <PastInternsPage /> },
    { path: 'projects', element: <ProjectsPage /> }, { path: 'projects/:projectId', element: <ProjectDetailPage /> }, { path: 'team-builder/:projectId', element: <TeamBuilderPage /> },
    { path: 'tasks', element: <TaskBoardOverviewPage /> }, { path: 'tasks/review', element: <ReviewQueuePage /> }, { path: 'calendar', element: <CalendarPage /> }, { path: 'gantt', element: <GanttPage /> },
    { path: 'reports', element: <ReportsPage /> }, { path: 'users', element: <UsersPage /> }, { path: 'notifications', element: <NotificationsPage /> }, { path: 'emails', element: <EmailTemplatesPage /> },
    { path: 'profile', element: <MyProfilePage /> }, { path: 'profile/edit', element: <EditProfilePage /> },
  ] },
  { path: '/mentor', element: guarded(['mentor'], <DashboardLayout />), children: [
    { path: 'dashboard', element: <MentorDashboardPage /> }, { path: 'projects', element: <ProjectsPage /> }, { path: 'projects/:projectId', element: <ProjectDetailPage /> },
    { path: 'team-builder/:projectId', element: <TeamBuilderPage /> }, { path: 'tasks', element: <TaskBoardOverviewPage /> }, { path: 'tasks/review', element: <ReviewQueuePage /> },
    { path: 'calendar', element: <CalendarPage /> }, { path: 'gantt', element: <GanttPage /> }, { path: 'profile', element: <MyProfilePage /> }, { path: 'profile/edit', element: <EditProfilePage /> },
  ] },
  { path: '/intern', element: guarded(['intern'], <DashboardLayout />), children: [
    { path: 'dashboard', element: <InternDashboardPage /> }, { path: 'project', element: <MyProjectPage /> }, { path: 'projects/:projectId', element: <ProjectDetailPage /> }, { path: 'tasks', element: <InternTaskBoardPage /> },
    { path: 'calendar', element: <CalendarPage /> }, { path: 'profile', element: <MyProfilePage /> }, { path: 'profile/edit', element: <EditProfilePage /> },
  ] },
  { path: '/403', element: <NotFoundPage /> }, { path: '*', element: <NotFoundPage /> },
])
