import type { BadgeTone } from '@/types'
export const internStatus: Record<string, { label: string; tone: BadgeTone }> = {
  applicant: { label: 'Applicant', tone: 'warning' }, interviewee: { label: 'Interviewee', tone: 'info' },
  intern: { label: 'Intern', tone: 'success' }, past_intern: { label: 'Past Intern', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'error' }, completed: { label: 'Completed', tone: 'info' },
}
