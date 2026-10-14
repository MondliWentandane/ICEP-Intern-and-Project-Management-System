import type { ID } from './common'
export type UserRole = 'admin' | 'wil_handler' | 'mentor' | 'intern'
export interface User { id: ID; name: string; email: string; role: UserRole }
export interface LoginCredentials { email: string; password: string }
export interface AuthResponse { token: string; user: User }
