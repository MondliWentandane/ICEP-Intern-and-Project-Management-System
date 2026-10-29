import { apiClient, endpoints } from '@/api'
import type { ApiTaskStatus, CalendarTaskEvent, CreateTaskInput, Task, TaskApiRecord } from '@/types'

export const Tasks = {
  list: () => apiClient.get<Task[]>(endpoints.tasks).then(res => res.data),
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
  updateStatus: (id: string, status: ApiTaskStatus) => apiClient
    .put<{ task: TaskApiRecord }>(`${endpoints.tasks}/${encodeURIComponent(id)}/status`, { status })
    .then(res => res.data.task),
  delete: (id: string) => apiClient.delete(`${endpoints.tasks}/${encodeURIComponent(id)}`),
}