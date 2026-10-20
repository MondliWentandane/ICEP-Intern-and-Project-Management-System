import type { Campus, ID, InternProfile, Project } from '@/types'

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
