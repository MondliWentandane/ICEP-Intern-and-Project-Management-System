import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { AppLayout } from '../layouts/AppLayout'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { SetPasswordPage } from '../features/auth/pages/SetPasswordPage'
import { PlaceholderPage } from '../features/shared/pages/PlaceholderPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/set-password/:token', element: <SetPasswordPage /> },
    ],
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="ICEP workspace" /> },
      { path: 'dashboard', element: <PlaceholderPage title="Dashboard" /> },
      { path: 'profile', element: <PlaceholderPage title="My profile" /> },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <PlaceholderPage title="Page not found" /> },
])
