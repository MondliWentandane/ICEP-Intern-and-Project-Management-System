import type { UserRole } from '@/types'
export const rolePrefix: Record<UserRole, string> = { ADMIN: '/admin', WIL_HANDLER: '/handler', MENTOR: '/mentor', INTERN: '/intern' }
export const homeByRole: Record<UserRole, string> = { ADMIN: '/admin/dashboard', WIL_HANDLER: '/handler/dashboard', MENTOR: '/mentor/dashboard', INTERN: '/intern/project' }
export const profileByRole: Record<UserRole, string> = { ADMIN: '/admin/profile', WIL_HANDLER: '/handler/profile', MENTOR: '/mentor/profile', INTERN: '/intern/profile' }