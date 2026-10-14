import { apiClient, endpoints } from '@/api'
import type { EmailTemplate, Notification } from '@/types'
export const NotificationsService = {
  list: () => apiClient.get<Notification[]>(endpoints.notifications),
  emailTemplates: () => apiClient.get<EmailTemplate[]>(endpoints.emailTemplates),
}
