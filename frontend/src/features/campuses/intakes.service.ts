import { apiClient } from '@/api'
import type { IntakeView } from '@/features/shared/workspace/types'

// GET /api/intakes (backend internRoutes): every intake, newest first, with internCount and positionCount.
// Could move into src/api/services/ with an `intakes` entry in endpoints.ts (shared folders need Manthata's sign-off).
export const Intakes = {
  list: () => apiClient.get<IntakeView[]>('/intakes'),
}
