import { apiClient, endpoints } from '@/api'
import type { Campus } from '@/types'

export const Campuses = {
  list: () => apiClient.get<Campus[]>(endpoints.campuses),
  get: (id: string) => apiClient.get<Campus>(String(endpoints.campuses) + '/' + encodeURIComponent(id)),
}
