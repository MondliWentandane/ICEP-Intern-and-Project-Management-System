import { apiClient } from '@/api'
import type { IntakeView } from '@/features/shared/workspace/types'

// '/intakes' is an assumed route (same status as the other endpoints in src/api/endpoints.ts).
// Once the backend team confirms it, add `intakes` to endpoints.ts and move this
// service into src/api/services/ (shared folders need Manthata's sign-off).
export const Intakes = {
  list: () => apiClient.get<IntakeView[]>('/intakes'),
}
