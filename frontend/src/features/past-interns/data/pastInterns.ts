// Demo archive for the Past Interns page.
// TODO: replace fetchPastInterns with an API service once the backend exposes completed internships.
// Note: "Terminated" is in the Figma design but not in the Prisma InternStatus enum (ACTIVE, COMPLETED, WITHDRAWN) — confirm with the backend team.

export type InternOutcome = 'Completed' | 'Withdrawn' | 'Terminated'
export const outcomes: InternOutcome[] = ['Completed', 'Withdrawn', 'Terminated']

export interface PastInternRecord {
  id: string
  name: string
  email: string
  campus: string
  project: string
  mentor: string
  start: string // YYYY-MM
  end: string // YYYY-MM
  outcome: InternOutcome
  finalReportSubmitted: boolean
}

type Row = [name: string, campus: string, project: string, mentor: string, start: string, end: string, outcome: InternOutcome, report: boolean]
const rows: Row[] = [
  ['Thandi Nkosi', 'Pretoria', 'ICEP Web Portal', 'John Doe', '2025-02', '2025-11', 'Completed', true],
  ['Sipho Dlamini', 'Soshanguve South', 'Campus Shuttle App', 'Lindiwe Mokoena', '2025-02', '2025-11', 'Completed', true],
  ['Lindi Maseko', 'eMalahleni', 'Library Booking System', 'Peter Smith', '2025-02', '2025-06', 'Withdrawn', false],
  ['Kabelo Sithole', 'Ga-Rankuwa', 'Student Help Desk', 'John Doe', '2024-07', '2025-01', 'Completed', true],
  ['Naledi Mokoena', 'Polokwane', 'Inventory Tracker', 'Grace Mahlangu', '2024-02', '2024-05', 'Terminated', false],
  ['Tebogo Peters', 'Pretoria', 'ICEP Web Portal', 'Peter Smith', '2024-02', '2024-11', 'Completed', true],
  ['Ayanda Zulu', 'Mbombela', 'Research Data Portal', 'Grace Mahlangu', '2024-02', '2024-11', 'Completed', false],
  ['Karabo Molefe', 'Soshanguve North', 'Timetable Planner', 'Lindiwe Mokoena', '2023-07', '2024-06', 'Completed', true],
  ['Lerato Khumalo', 'Polokwane', 'Municipality Service Delivery Web App', 'John Doe', '2025-02', '2025-12', 'Completed', true],
  ['Mpho Radebe', 'Soshanguve South', 'Campus Shuttle App', 'Lindiwe Mokoena', '2024-07', '2025-06', 'Completed', true],
  ['Zanele Mthembu', 'eMalahleni', 'Library Booking System', 'Peter Smith', '2024-07', '2025-06', 'Completed', false],
  ['Bongani Ndlovu', 'Ga-Rankuwa', 'Student Help Desk', 'Grace Mahlangu', '2025-02', '2025-04', 'Withdrawn', false],
  ['Palesa Mahlaba', 'Pretoria', 'Research Data Portal', 'John Doe', '2023-02', '2023-11', 'Completed', true],
  ['Sibusiso Nkuna', 'Mbombela', 'Inventory Tracker', 'Peter Smith', '2023-02', '2023-12', 'Completed', true],
  ['Refilwe Mabena', 'Polokwane', 'Lecture Room Booking System', 'Grace Mahlangu', '2023-07', '2024-06', 'Completed', true],
  ['Kagiso Baloyi', 'Soshanguve North', 'E-commerce UI', 'Lindiwe Mokoena', '2024-02', '2024-11', 'Completed', true],
  ['Nomsa Shabalala', 'Pretoria', 'Timetable Planner', 'John Doe', '2023-02', '2023-08', 'Terminated', false],
  ['Thabo Mokgadi', 'eMalahleni', 'ICEP Web Portal', 'Peter Smith', '2025-02', '2025-11', 'Completed', true],
  ['Precious Hlongwane', 'Ga-Rankuwa', 'Limpopo Varsity Hackathon Project', 'Grace Mahlangu', '2024-07', '2025-06', 'Completed', true],
  ['Lwazi Cele', 'Mbombela', 'Campus Shuttle App', 'Lindiwe Mokoena', '2023-07', '2024-06', 'Completed', false],
]

const demoRecords: PastInternRecord[] = rows.map(([name, campus, project, mentor, start, end, outcome, report], index) => ({
  id: `past-${index + 1}`,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@tut4life.ac.za`,
  campus, project, mentor, start, end, outcome, finalReportSubmitted: report,
}))

export async function fetchPastInterns(): Promise<PastInternRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return demoRecords
}

const monthName = (ym: string) => new Intl.DateTimeFormat('en-ZA', { month: 'short' }).format(new Date(`${ym}-01T00:00:00`))
const yearOf = (ym: string) => ym.slice(0, 4)

export function formatPeriod({ start, end }: Pick<PastInternRecord, 'start' | 'end'>) {
  return yearOf(start) === yearOf(end)
    ? `${monthName(start)}–${monthName(end)} ${yearOf(end)}`
    : `${monthName(start)} ${yearOf(start)}–${monthName(end)} ${yearOf(end)}`
}

export function durationMonths({ start, end }: Pick<PastInternRecord, 'start' | 'end'>) {
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
    missingReports: records.filter((record) => !record.finalReportSubmitted).length,
  }
}

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
export function toCsv(records: PastInternRecord[]) {
  const header = ['Intern', 'Email', 'Campus', 'Project', 'Mentor', 'Period', 'Outcome', 'Final report']
  const lines = records.map((record) => [record.name, record.email, record.campus, record.project, record.mentor, formatPeriod(record), record.outcome, record.finalReportSubmitted ? 'Submitted' : 'Missing'])
  return [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')
}
