import { apiClient, endpoints } from '@/api'
import type { Project } from '@/types'

export const Projects = {
  list: () => apiClient.get<Project[]>(endpoints.projects),
  get: (id: string) => apiClient.get<Project>(String(endpoints.projects) + '/' + encodeURIComponent(id)),
}
