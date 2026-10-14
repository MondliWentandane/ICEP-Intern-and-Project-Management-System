import { apiClient, endpoints } from '@/api'
import type { Position } from '@/types'

export const Public = {
  positions: () => apiClient.get<Position[]>(endpoints.public.positions),
  position: (id: string) => apiClient.get<Position>(endpoints.public.positions + '/' + encodeURIComponent(id)),
}
