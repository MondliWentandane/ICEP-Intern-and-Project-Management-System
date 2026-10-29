// Past Interns archive: internships that ended (GET /api/past-interns, ADMIN or WIL_HANDLER).
// The backend stores COMPLETED or WITHDRAWN; a withdrawal is shown as "Withdrawn" (resigned)
// or "Terminated" (dismissed), from the reason the WIL Handler gave when ending it.
import { apiClient } from '@/api'

export type InternOutcome = 'Completed' | 'Withdrawn' | 'Terminated'
export const outcomes: InternOutcome[] = ['Completed', 'Withdrawn', 'Terminated']

export interface PastInternRecord {
  id: string
  name: string
  email: string
  campus: string
  department: string
  intake: string
  project: string | null
  mentor: string | null
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  outcome: InternOutcome
  /** Why it ended ("Placement period ended" when the system archived it). */
  reason: string | null
  /** Who ended it ("System" for automatic archiving). */
  endedBy: string | null
}

interface ApiPastIntern extends Omit<PastInternRecord, 'start' | 'end'> { startDate: string | null; endDate: string | null }

export async function fetchPastInterns(): Promise<PastInternRecord[]> {
  const { data } = await apiClient.get<{ data: ApiPastIntern[] }>('/past-interns')
  return data.data.map(({ startDate, endDate, ...record }) => ({ ...record, start: startDate ?? '', end: endDate ?? startDate ?? '' }))
}

const monthName = (ymd: string) => new Intl.DateTimeFormat('en-ZA', { month: 'short' }).format(new Date(`${ymd.slice(0, 7)}-01T00:00:00`))
const yearOf = (ymd: string) => ymd.slice(0, 4)

export function formatPeriod({ start, end }: Pick<PastInternRecord, 'start' | 'end'>) {
  if (!start) return '—'
  return yearOf(start) === yearOf(end)
    ? `${monthName(start)}–${monthName(end)} ${yearOf(end)}`
    : `${monthName(start)} ${yearOf(start)}–${monthName(end)} ${yearOf(end)}`
}

export function durationMonths({ start, end }: Pick<PastInternRecord, 'start' | 'end'>) {
  if (!start || !end) return 0
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm) + 1
}

export const intakeYear = (record: PastInternRecord) => yearOf(record.start)

export function summarise(records: PastInternRecord[]) {
  const completed = records.filter((record) => record.outcome === 'Completed').length
  const averageMonths = records.length ? Math.round(records.reduce((sum, record) => sum + durationMonths(record), 0) / records.length) : 0
  return {
    completed,
    completionRate: records.length ? Math.round((completed / records.length) * 100) : 0,
    averageMonths,
    endedEarly: records.length - completed,
  }
}

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
export function toCsv(records: PastInternRecord[]) {
  const header = ['Intern', 'Email', 'Campus', 'Department', 'Project', 'Mentor', 'Period', 'Outcome', 'Reason', 'Ended by']
  const lines = records.map((record) => [record.name, record.email, record.campus, record.department, record.project ?? '', record.mentor ?? '', formatPeriod(record), record.outcome, record.reason ?? '', record.endedBy ?? ''])
  return [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')
}
