import { apiClient, endpoints } from '@/api'
import type { CareerPosition } from '@/features/public-site/data/positions'
import type { ApplicationValues } from './applicationSchema'

export interface SubmittedApplication {
  reference: string
  submittedAt: string
  firstName: string
  email: string
  positionTitle: string
  campus: string
}

/** What POST /api/applications answers with (201). */
interface CreatedApplication {
  id: string
  referenceCode: string
  status: string
  createdAt: string
  fullName: string
  email: string
  position: { id: string; title: string; campus: string }
}

// Sends the application (details + the three PDFs) to the backend, which stores it in the database as PENDING.
export async function submitApplication(values: ApplicationValues, position: CareerPosition): Promise<SubmittedApplication> {
  const form = new FormData()
  form.append('positionId', values.positionId)
  form.append('firstName', values.firstName.trim())
  form.append('surname', values.surname.trim())
  form.append('email', values.email.trim())
  form.append('phone', values.phone.trim())
  form.append('idNumber', values.idNumber.trim())
  form.append('studentNumber', values.studentNumber.trim())
  form.append('category', values.category)
  form.append('qualification', values.qualification.trim())
  form.append('yearOfStudy', values.yearOfStudy)
  form.append('skills', JSON.stringify(values.skills))
  form.append('cv', values.cv)
  form.append('idDocument', values.idDocument)
  form.append('academicRecord', values.academicRecord)

  // Uploads can take a while on a slow connection, so allow longer than the default timeout.
  const { data } = await apiClient.post<CreatedApplication>(endpoints.public.applications, form, { timeout: 120000 })

  const result: SubmittedApplication = {
    reference: data.referenceCode,
    submittedAt: data.createdAt,
    firstName: values.firstName,
    email: data.email,
    positionTitle: data.position?.title ?? position.title,
    campus: data.position?.campus ?? position.campus,
  }
  return result
}
