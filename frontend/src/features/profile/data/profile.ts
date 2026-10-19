import { z } from 'zod'
import type { User, UserRole } from '@/types'

// Demo profile store kept in memory until the profile API exists. Edits last until the page is refreshed.
// TODO: replace fetchProfile/updateProfile/changePassword with services in src/api/services once endpoints are agreed.

export interface ProfileCv { name: string; size: number; updatedAt: string; file?: File }
export interface Profile {
  fullName: string
  email: string
  phone: string
  campus?: string
  studentNumber?: string
  qualification?: string
  intake?: string
  skills: string[]
  cv?: ProfileCv
}

export const qualifications = ['Diploma in Informatics', 'Diploma in Computer Science', 'Diploma in Information Technology', 'Advanced Diploma in ICT', 'Bachelor of Information Technology']
export const intakes = ['January 2026', 'July 2026', 'January 2027']

const statusLabels: Record<UserRole, string> = { intern: 'Active intern', mentor: 'Mentor', wil_handler: 'WIL Handler', admin: 'Administrator' }
export const profileStatusLabel = (role: UserRole) => statusLabels[role]

const store = new Map<string, Profile>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function seed(user: User): Profile {
  const base = { fullName: user.name, email: user.email, phone: '079 299 0983', skills: [] }
  if (user.role !== 'intern') return base
  return {
    ...base,
    campus: 'Polokwane', studentNumber: '241189694', qualification: 'Diploma in Informatics', intake: 'July 2026',
    skills: ['React', 'JavaScript', 'SQL', 'UI design'],
    cv: { name: `${user.name.replace(/\s+/g, '_')}_CV.pdf`, size: 248 * 1024, updatedAt: '2026-07-02' },
  }
}

export async function fetchProfile(user: User): Promise<Profile> {
  await wait(250)
  if (!store.has(user.id)) store.set(user.id, seed(user))
  return { ...store.get(user.id)! }
}

export async function updateProfile(user: User, changes: Partial<Profile>): Promise<Profile> {
  await wait(400)
  const next = { ...(store.get(user.id) ?? seed(user)), ...changes }
  store.set(user.id, next)
  return { ...next }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await wait(400)
  if (currentPassword === newPassword) throw new Error('Your new password must be different from your current password.')
}

const phonePattern = /^(\+27|0)[6-8]\d{8}$/
export const editProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().refine((value) => phonePattern.test(value.replace(/\s+/g, '')), 'Enter a South African mobile number, e.g. 079 299 0982.'),
  qualification: z.string().optional(),
  intake: z.string().optional(),
  skills: z.array(z.string()).max(15, 'Add up to 15 skills.'),
  newCv: z.custom<File>((value) => value instanceof File).optional()
    .refine((file) => !file || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'), 'Upload a PDF file.')
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, 'The file must be 5 MB or smaller.'),
})
export type EditProfileInput = z.input<typeof editProfileSchema>
export type EditProfileValues = z.output<typeof editProfileSchema>

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string()
    .min(8, 'Use 8+ characters, an uppercase letter, a number and a symbol.')
    .regex(/[A-Z]/, 'Add an uppercase letter.')
    .regex(/[0-9]/, 'Add a number.')
    .regex(/[^A-Za-z0-9]/, 'Add a symbol.'),
})
export type PasswordValues = z.infer<typeof passwordSchema>
