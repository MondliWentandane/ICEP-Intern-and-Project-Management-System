import type { Applicant, Campus, ID, InternProfile, Project, Task } from '@/types'

// Page-level view models. The shared types in src/types are still minimal and
// the backend response shapes are unconfirmed, so every extra field is optional.
export interface CampusView extends Campus {
  address?: string
  city?: string
  province?: string
}

export interface ProjectView extends Project {
  progress?: number
  endDate?: string
}

export interface InternProject {
  id: ID
  name: string
  role?: string
  status?: string
  current?: boolean
}

export interface InternDocument {
  id: ID
  type: string
  fileName: string
  fileUrl?: string
}

export interface InternView extends InternProfile {
  phone?: string
  institution?: string
  qualification?: string
  yearOfStudy?: number
  intakeId?: ID
  intakeName?: string
  campusName?: string
  mentorName?: string
  startDate?: string
  endDate?: string
  projects?: InternProject[]
  documents?: InternDocument[]
}

export interface IntakeView {
  id: ID
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  internCount?: number
  positionCount?: number
}

// Task as the database stores it: `dueDate`, uppercase status (TODO | IN_PROGRESS | COMPLETED).
// The older `dueAt` is still read so existing sample data and mocks keep working.
export interface TaskView extends Omit<Task, 'status' | 'dueAt'> {
  status: string
  dueDate?: string
  dueAt?: string
  priority?: string
  progress?: number
}

// Applicant fields added by the schema (interviewVenue / interviewAt).
export interface ApplicantView extends Applicant {
  interviewAt?: string
  interviewVenue?: string
}

// Intern rows from Prisma keep name/email/phone on a nested `user`, and campus/intake/mentor as relations.
export interface RawIntern extends Omit<InternView, 'department'> {
  user?: { fullName?: string; email?: string; phone?: string }
  campus?: { id?: string; name?: string }
  intake?: { id?: string; name?: string }
  mentor?: { fullName?: string; user?: { fullName?: string } }
  department?: string | { name?: string }
}

export function normalizeIntern(raw: RawIntern): InternView {
  const dept = raw.department
  return {
    ...raw,
    fullName: raw.fullName ?? raw.user?.fullName ?? '',
    email: raw.email ?? raw.user?.email,
    phone: raw.phone ?? raw.user?.phone,
    campusId: raw.campusId ?? raw.campus?.id,
    campusName: raw.campusName ?? raw.campus?.name,
    intakeId: raw.intakeId ?? raw.intake?.id,
    intakeName: raw.intakeName ?? raw.intake?.name,
    mentorName: raw.mentorName ?? raw.mentor?.fullName ?? raw.mentor?.user?.fullName,
    department: typeof dept === 'object' && dept ? dept.name : dept,
  }
}

export const taskDue = (task: TaskView) => task.dueDate ?? task.dueAt
