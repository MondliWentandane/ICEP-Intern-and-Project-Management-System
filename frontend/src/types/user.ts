import type { ID } from './common'
export type UserRole = 'ADMIN' | 'WIL_HANDLER' | 'MENTOR' | 'INTERN'
export interface User { id: ID; name: string; email: string; role: UserRole }
export interface LoginCredentials { email: string; password: string }
export interface AuthResponse { token: string; user: User }
