import type { ID } from './common'
export interface CalendarEvent { id: ID; title: string; startsAt: string; endsAt?: string; taskId?: ID }