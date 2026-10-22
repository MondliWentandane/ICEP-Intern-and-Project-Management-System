import { apiClient, endpoints } from '@/api'
import type { CampusView, IntakeView } from '@/features/shared/workspace/types'

// Feature-local API calls. '/intakes' and the POST/PATCH shapes are assumed until the backend
// team confirms them. Once confirmed, add `intakes` to src/api/endpoints.ts and move these
// into src/api/services/ (shared folders need Manthata's sign-off).
export interface CampusInput { name: string; address?: string; city?: string; province?: string }
export interface IntakeInput { name: string; startDate: string; endDate: string; isActive: boolean }

const byId = (base: string, id: string) => `${base}/${encodeURIComponent(id)}`

export const Intakes = {
  list: () => apiClient.get<IntakeView[]>('/intakes'),
  create: (input: IntakeInput) => apiClient.post<IntakeView>('/intakes', input),
  update: (id: string, input: IntakeInput) => apiClient.patch<IntakeView>(byId('/intakes', id), input),
}

export const CampusAdmin = {
  create: (input: CampusInput) => apiClient.post<CampusView>(endpoints.campuses, input),
  update: (id: string, input: CampusInput) => apiClient.patch<CampusView>(byId(endpoints.campuses, id), input),
}
