// In-app notifications and the email log.
// GET /notifications only ever returns the signed-in user's own notifications, so every role
// (admin, WIL Handler, mentor, intern) sees just what concerns them.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, endpoints } from '@/api'
import { tokenStorage } from '@/utils/tokenStorage'

export type NotificationType = 'APPLICATION_UPDATE' | 'PROJECT_ASSIGNED' | 'TASK_ASSIGNED' | 'TASK_APPROVED' | 'SYSTEM'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  /** Page to open, already inside the user's own area (e.g. /handler/applicants). */
  link: string | null
  isRead: boolean
  createdAt: string
}

/** One email the system sent (or tried to): GET /emails/logs, ADMIN and WIL_HANDLER only. */
export interface EmailLogEntry {
  id: string
  toEmail: string
  subject: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  error: string | null
  createdAt: string
  sentAt: string | null
  template: { key: string } | null
  user: { fullName: string } | null
}

const NOTIFICATIONS_KEY = ['notifications', 'mine'] as const

/**
 * The signed-in user's notifications (refreshed every minute). Shared by the bell and the page,
 * so reading one on the page clears the bell too. Skipped without a real login (local previews).
 */
export function useMyNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => (await apiClient.get<AppNotification[]>(endpoints.notifications)).data,
    enabled: Boolean(tokenStorage.get()),
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.put(`${endpoints.notifications}/${encodeURIComponent(id)}/read`),
    onMutate: (id) => queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (list) => list?.map((n) => (n.id === id ? { ...n, isRead: true } : n))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.put(`${endpoints.notifications}/read-all`),
    onMutate: () => queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (list) => list?.map((n) => ({ ...n, isRead: true }))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useEmailLog(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'email-log'],
    queryFn: async () => (await apiClient.get<EmailLogEntry[]>('/emails/logs')).data,
    enabled: enabled && Boolean(tokenStorage.get()),
  })
}
