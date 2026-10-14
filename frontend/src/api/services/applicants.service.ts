import { apiClient, endpoints } from '@/api'
import type { Applicant } from '@/types'

export const Applicants = {
  list: () => apiClient.get<Applicant[]>(endpoints.applicants),
  get: (id: string) => apiClient.get<Applicant>(String(endpoints.applicants) + '/' + encodeURIComponent(id)),
}
