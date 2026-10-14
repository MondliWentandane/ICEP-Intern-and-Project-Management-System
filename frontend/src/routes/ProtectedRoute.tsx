import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) {
  const { user, isAuthenticated } = useAuth(); const location = useLocation()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/403" replace />
  return children
}
