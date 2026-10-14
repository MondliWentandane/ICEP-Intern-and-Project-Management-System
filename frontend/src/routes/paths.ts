import type { UserRole } from '@/types'
export const rolePrefix: Record<UserRole, string> = { admin: '/admin', wil_handler: '/handler', mentor: '/mentor', intern: '/intern' }
export const homeByRole: Record<UserRole, string> = { admin: '/admin/dashboard', wil_handler: '/handler/dashboard', mentor: '/mentor/dashboard', intern: '/intern/project' }
export const profileByRole: Record<UserRole, string> = { admin: '/admin/profile', wil_handler: '/handler/profile', mentor: '/mentor/profile', intern: '/intern/profile' }
