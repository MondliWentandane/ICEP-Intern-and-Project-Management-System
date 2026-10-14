import { apiClient, endpoints } from '@/api'
import type { Task } from '@/types'

export const Tasks = {
  list: () => apiClient.get<Task[]>(endpoints.tasks),
  get: (id: string) => apiClient.get<Task>(String(endpoints.tasks) + '/' + encodeURIComponent(id)),
}
