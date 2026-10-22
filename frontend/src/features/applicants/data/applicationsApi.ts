// Backend calls for submitted intern applications (Applicants page + Interns page).
// All of these need an ADMIN or WIL_HANDLER login (the JWT is added by apiClient).
import axios from 'axios'
import { apiClient, endpoints } from '@/api'

export type ApiApplicationStatus = 'PENDING' | 'INTERVIEWEE' | 'ACCEPTED' | 'REJECTED'

/** One row of GET /api/applicants (Prisma Application with position, skills and documents). */
export interface ApiApplication {
  id: string
  referenceCode: string
  status: ApiApplicationStatus
  fullName: string
  email: string
  phone: string | null
  /** SA ID number (POPIA-sensitive): only shown masked. */
  idNumber?: string | null
  studentNumber: string
  institution: string
  qualification: string
  yearOfStudy: number | null
  interviewAt: string | null
  interviewVenue?: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedBy?: { id: string; fullName: string; email: string } | null
  createdAt: string
  updatedAt: string
  position: {
    id: string
    title: string
    campus: { name: string }
    department: { name: string }
    intake: { name: string; startDate: string; endDate: string }
  }
  skills: Array<{ skill: { name: string } }>
  documents: Array<{ id: string; type: 'CV' | 'ID_COPY' | 'ACADEMIC_RECORD' | string; fileName: string; mimeType?: string | null; sizeBytes?: number | null; uploadedAt?: string }>
}

export const fetchApplications = async () => (await apiClient.get<ApiApplication[]>(endpoints.applicants)).data

const url = (id: string, action: string) => `${endpoints.applicants}/${encodeURIComponent(id)}/${action}`

export const scheduleInterview = async (id: string, interviewAt: string, interviewVenue: string) =>
  (await apiClient.put<ApiApplication>(url(id, 'interview'), { interviewAt, interviewVenue })).data

export const acceptApplication = async (id: string) => (await apiClient.put<ApiApplication>(url(id, 'accept'))).data

export const rejectApplication = async (id: string, rejectionReason: string) =>
  (await apiClient.put<ApiApplication>(url(id, 'reject'), { rejectionReason })).data

/** Downloads one uploaded document by id and saves it in the browser. */
export async function downloadDocumentById(applicationId: string, documentId: string, fileName: string) {
  const { data } = await apiClient.get<Blob>(`${url(applicationId, 'documents')}/${encodeURIComponent(documentId)}/download`, { responseType: 'blob', timeout: 60000 })
  const href = URL.createObjectURL(data)
  const link = window.document.createElement('a')
  link.href = href
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/** Downloads one of the applicant's uploaded PDFs (CV by default) and saves it in the browser. */
export async function downloadApplicationDocument(application: Pick<ApiApplication, 'id' | 'documents' | 'fullName'>, type = 'CV') {
  const document = application.documents.find((item) => item.type === type)
  if (!document) throw new Error('No document of that type was uploaded.')
  const { data } = await apiClient.get<Blob>(`${url(application.id, 'documents')}/${encodeURIComponent(document.id)}/download`, { responseType: 'blob', timeout: 60000 })
  const href = URL.createObjectURL(data)
  const link = window.document.createElement('a')
  link.href = href
  link.download = document.fileName || `${application.fullName.replace(/\s+/g, '_')}_${type}.pdf`
  link.click()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/** 1 -> "1st year" */
export function yearLabel(year: number | null | undefined) {
  if (!year) return ''
  const suffix = year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'
  return `${year}${suffix} year`
}

/** Readable message from a failed request. */
export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
    if (error.response?.status === 403) return 'Your account is not allowed to view applicants.'
    const data = error.response?.data as { error?: string; message?: string } | undefined
    if (data?.error || data?.message) return data.error || data.message || fallback
    if (!error.response) return 'The server could not be reached. Is the backend running?'
  }
  return error instanceof Error && error.message ? error.message : fallback
}
