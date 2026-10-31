import { apiClient, endpoints } from '@/api'
import type {
  ApiTaskPriority,
  ApiTaskStatus,
  CalendarTaskEvent,
  CreateTaskInput,
  Task,
  TaskApiRecord,
} from '@/types'

export type InternTaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'BLOCKED'
export type TaskWorkflowStatus = InternTaskStatus
export type TaskPriority = ApiTaskPriority

interface InternBoardApiTask extends Omit<TaskApiRecord, 'project' | 'assignedTo' | 'priority' | 'dueDate'> {
  project: { name: string; status: string }
  assignedTo: { user: { fullName: string | null } } | null
  canUpdateStatus: boolean
  dueDate: string | null
  priority: ApiTaskPriority
}

export type InternBoardTask = Omit<InternBoardApiTask, 'status'> & {
  status: InternTaskStatus
}

interface MentorBoardApiTask extends Omit<TaskApiRecord, 'project' | 'assignedTo' | 'priority' | 'dueDate'> {
  project: { name: string }
  assignedTo: { user: { fullName: string | null } } | null
  dueDate: string | null
  priority: ApiTaskPriority
}

export type MentorTaskRecord = Omit<MentorBoardApiTask, 'status'> & {
  status: TaskWorkflowStatus
}

function workflowStatus(task: Pick<TaskApiRecord, 'status' | 'approvedAt'>): TaskWorkflowStatus {
  if (task.status === 'BLOCKED') return 'BLOCKED'
  if (task.status === 'TODO') return 'TO_DO'
  if (task.status === 'COMPLETED') return task.approvedAt ? 'COMPLETED' : 'SUBMITTED'
  return task.status
}

export const Tasks = {
  list: () => apiClient.get<Task[]>(endpoints.tasks).then(res => res.data),
  listForMentorBoard: () => apiClient
    .get<{ tasks: MentorBoardApiTask[] }>(endpoints.tasks)
    .then((response) => ({
      ...response,
      data: {
        ...response.data,
        tasks: response.data.tasks.map((task): MentorTaskRecord => ({
          ...task,
          status: workflowStatus(task),
        })),
      },
    })),
  listReviewQueue: () => apiClient
    .get<{ tasks: MentorBoardApiTask[] }>(`${endpoints.tasks}/review`)
    .then((response) => ({
      ...response,
      data: {
        ...response.data,
        tasks: response.data.tasks.map((task): MentorTaskRecord => ({
          ...task,
          status: workflowStatus(task),
        })),
      },
    })),
  listForInternBoard: () => apiClient
    .get<{ tasks: InternBoardApiTask[] }>(endpoints.tasks)
    .then((response) => ({
      ...response,
      data: {
        ...response.data,
        tasks: response.data.tasks.map((task): InternBoardTask => ({
          ...task,
          status: workflowStatus(task),
        })),
      },
    })),
  get: (id: string) => apiClient.get<Task>(`${endpoints.tasks}/${encodeURIComponent(id)}`).then(res => res.data),
  getProjectTasks: (projectId: string) => apiClient
    .get<{ tasks: TaskApiRecord[] }>(`${endpoints.projects}/${encodeURIComponent(projectId)}/tasks`)
    .then(res => res.data.tasks),
  getGanttData: (projectId: string) => apiClient
    .get<{ tasks: TaskApiRecord[] }>(`${endpoints.projects}/${encodeURIComponent(projectId)}/gantt`)
    .then(res => res.data.tasks),
  getCalendarEvents: () => apiClient.get<{ events: CalendarTaskEvent[] }>('/calendar').then(res => res.data.events),
  create: (payload: CreateTaskInput) => apiClient.post<{ task: TaskApiRecord }>(endpoints.tasks, payload).then(res => res.data.task),
  update: (id: string, payload: Partial<CreateTaskInput>) => apiClient
    .put<{ task: TaskApiRecord }>(`${endpoints.tasks}/${encodeURIComponent(id)}`, payload)
    .then(res => res.data.task),
  updateStatus: (id: string, status: ApiTaskStatus, blockedReason?: string | null) => apiClient
    .put<{ task: TaskApiRecord }>(`${endpoints.tasks}/${encodeURIComponent(id)}/status`, { status, blockedReason })
    .then(res => res.data.task),
  approve: (id: string) => apiClient
    .put<{ task: TaskApiRecord }>(`${endpoints.tasks}/${encodeURIComponent(id)}/approve`)
    .then((response) => response.data.task),
  requestChanges: (id: string, feedback: string) => apiClient
    .put<{ task: TaskApiRecord }>(`${endpoints.tasks}/${encodeURIComponent(id)}/request-changes`, { feedback })
    .then((response) => response.data.task),
  delete: (id: string) => apiClient.delete(`${endpoints.tasks}/${encodeURIComponent(id)}`),
}
