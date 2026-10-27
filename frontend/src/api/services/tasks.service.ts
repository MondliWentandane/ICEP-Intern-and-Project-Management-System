import { apiClient, endpoints } from '@/api'
import type { Task } from '@/types'

export const Tasks = {
  // Original methods
  list: () => apiClient.get<Task[]>(endpoints.tasks).then(res => res.data),
  get: (id: string) => apiClient.get<Task>(`${endpoints.tasks}/${encodeURIComponent(id)}`).then(res => res.data),

  // NEW: Project Board, Gantt, and Calendar endpoints
  getProjectTasks: (projectId: string) => apiClient.get(`${endpoints.projects}/${projectId}/tasks`).then(res => res.data.tasks),
  getGanttData: (projectId: string) => apiClient.get(`${endpoints.projects}/${projectId}/gantt`).then(res => res.data.tasks),
  getCalendarEvents: () => apiClient.get('/calendar').then(res => res.data.events),

  // NEW: Scrum Master / Mentor Management actions
  create: (payload: any) => apiClient.post(endpoints.tasks, payload).then(res => res.data.task),
  update: (id: string, payload: any) => apiClient.put(`${endpoints.tasks}/${id}`, payload).then(res => res.data.task),
  updateStatus: (id: string, status: string) => apiClient.put(`${endpoints.tasks}/${id}/status`, { status }).then(res => res.data.task),
  delete: (id: string) => apiClient.delete(`${endpoints.tasks}/${id}`),
}