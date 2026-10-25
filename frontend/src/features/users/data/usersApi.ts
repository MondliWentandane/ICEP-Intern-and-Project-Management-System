// Backend calls for the admin Users page. All need an ADMIN login (the JWT is added by apiClient).
// New staff accounts are created without a password; the backend emails them a set-password link.
import axios from 'axios'
import { apiClient, endpoints } from '@/api'

export type UserRole = 'ADMIN' | 'WIL_HANDLER' | 'MENTOR' | 'INTERN'
/** Roles an admin can add. The admin comes from the backend seed script; interns from accepted applications. */
export type StaffRole = Exclude<UserRole, 'ADMIN' | 'INTERN'>
/** INVITED = account created, password not set yet. */
export type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE'

/** One row of GET /api/users. */
export interface ApiUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  department: { id: string; name: string } | null
  campus: string | null
}

export interface Department { id: string; name: string }

export interface NewUser { fullName: string; email: string; role: StaffRole; phone?: string; departmentId?: string }

export const fetchUsers = async () => (await apiClient.get<ApiUser[]>(endpoints.users)).data

export const fetchDepartments = async () => (await apiClient.get<Department[]>('/departments')).data

/** Creates the account and sends the set-password email. `emailSent` is false if the account was created but the email failed. */
export const createUser = async (user: NewUser) =>
  (await apiClient.post<{ user: ApiUser; emailSent: boolean }>(endpoints.users, user)).data

export const resendInvite = async (id: string) =>
  (await apiClient.post<{ message: string }>(`${endpoints.users}/${encodeURIComponent(id)}/resend-invite`)).data

export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'Only administrators can manage users.'
    const data = error.response?.data as { error?: string; message?: string } | undefined
    if (data?.error || data?.message) return data.error || data.message || fallback
    if (!error.response) return 'The server could not be reached. Is the backend running?'
  }
  return error instanceof Error && error.message ? error.message : fallback
}
