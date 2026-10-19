import type { ChipProps } from '@mui/material'
import type { BadgeTone } from '@/types'
import { internStatus } from '@/constants/status'

// Handles both the frontend wording (applicant, past_intern, ...) and the
// backend enums (PENDING, ACTIVE, COMPLETED, IN_PROGRESS, ...).
const extra: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
  active: { label: 'Active', tone: 'success' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  planned: { label: 'Planned', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'success' },
  on_hold: { label: 'On hold', tone: 'warning' },
  todo: { label: 'To do', tone: 'neutral' },
}

export function statusKey(raw?: string) {
  return (raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function titleCase(raw: string) {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function statusMeta(raw?: string): { label: string; tone: BadgeTone } {
  const key = statusKey(raw)
  return extra[key] ?? internStatus[key] ?? { label: key ? titleCase(key) : 'Unknown', tone: 'neutral' }
}

export const toneColor: Record<BadgeTone, ChipProps['color']> = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  error: 'error',
  neutral: 'default',
}

export const isPendingApplicant = (status?: string) => ['pending', 'applicant'].includes(statusKey(status))
export const isInterviewee = (status?: string) => statusKey(status) === 'interviewee'
export const isPastIntern = (status?: string) => ['past_intern', 'completed'].includes(statusKey(status))
export const isActiveIntern = (status?: string) => ['intern', 'active'].includes(statusKey(status))
