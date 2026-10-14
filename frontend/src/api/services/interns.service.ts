import { apiClient, endpoints } from '@/api'
import type { Intern } from '@/types'

export const Interns = {
  list: () => apiClient.get<Intern[]>(endpoints.interns),
  get: (id: string) => apiClient.get<Intern>(String(endpoints.interns) + '/' + encodeURIComponent(id)),
}
