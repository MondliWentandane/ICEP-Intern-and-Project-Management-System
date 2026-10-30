import type { ID } from './common'
export interface Task { id: ID; title: string; status: 'todo' | 'in_progress' | 'completed'; projectId?: ID; dueAt?: string }

export type ApiTaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
export type ApiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface TaskApiRecord {
  id: ID
  title: string
  description?: string | null
  category?: string
  projectId: ID
  assignedToId?: ID | null
  assigneeName?: string | null
  assignedTo?: { user?: { fullName?: string | null } | null } | null
  status: ApiTaskStatus
  priority?: ApiTaskPriority
  progress?: number
  startDate?: string | null
  dueDate?: string | null
  endDate?: string | null
  approvedAt?: string | null
  project?: { status?: string } | null
}

export interface CalendarTaskEvent extends Pick<TaskApiRecord, 'id' | 'title' | 'projectId' | 'assignedToId' | 'startDate' | 'dueDate' | 'status' | 'approvedAt'> {
  projectName: string
  assigneeName?: string | null
}

export interface CreateTaskInput {
  title: string
  projectId: string
  description?: string | null
  assignedToId?: string | null
  priority?: ApiTaskPriority
  status?: ApiTaskStatus
  startDate?: string | null
  dueDate?: string | null
}