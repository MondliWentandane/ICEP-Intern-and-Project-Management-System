import type { CareerPosition } from '@/features/public-site/data/positions'
import type { ApplicationValues } from './applicationSchema'
import { saveApplication } from './applications'

export interface SubmittedApplication {
  reference: string
  submittedAt: string
  firstName: string
  email: string
  positionTitle: string
  campus: string
}

// Demo submit. TODO: post multipart FormData to endpoints.public.applications once the backend API exists.
export async function submitApplication(values: ApplicationValues, position: CareerPosition): Promise<SubmittedApplication> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const now = new Date()
  const serial = String(Math.floor(10000 + Math.random() * 90000))
  const result: SubmittedApplication = {
    reference: `ICEP-${now.getFullYear()}-${serial}`,
    submittedAt: now.toISOString(),
    firstName: values.firstName,
    email: values.email.trim(),
    positionTitle: position.title,
    campus: position.campus,
  }
  // Keep it so the applicant can track it later with their email and reference number.
  saveApplication({ ...result, surname: values.surname, updatedAt: result.submittedAt, stage: 'under_review', documents: ['Curriculum vitae', 'ID document', 'Academic record'] })
  return result
}
