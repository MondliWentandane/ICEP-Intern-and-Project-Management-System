import type { ID } from './common'
export interface Task { id: ID; title: string; status: 'todo' | 'in_progress' | 'completed'; projectId?: ID; dueAt?: string }