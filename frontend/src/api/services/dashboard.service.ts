import { apiClient, endpoints } from '@/api'
import type { DashboardSummary } from '@/types'

export const Dashboard = {
  list: () => apiClient.get<DashboardSummary[]>(endpoints.dashboards),
  get: (id: string) => apiClient.get<DashboardSummary>(String(endpoints.dashboards) + '/' + encodeURIComponent(id)),
}
