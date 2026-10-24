import { apiClient, endpoints } from '@/api'
import type { InternDocument, InternView } from '@/features/shared/workspace/types'
import { downloadBlob } from '@/utils/format'

/** Intern record as GET /interns and GET /interns/:id return it (Prisma Intern with its relations). */
interface ApiIntern {
  id: string
  status: string
  studentNumber: string
  institution: string
  qualification: string
  yearOfStudy: number | null
  campusId: string
  intakeId: string
  startDate: string | null
  endDate: string | null
  user: { fullName: string; email: string; phone: string | null }
  campus?: { name: string }
  intake?: { name: string }
  department?: { name: string }
  mentor?: { user: { fullName: string } } | null
  skills?: Array<{ skill: { name: string } }>
  documents?: InternDocument[]
  assignments?: Array<{ projectRole: string | null; leftAt: string | null; project: { id: string; name: string; status: string } }>
  ending?: InternView['ending']
}

/** Flattens the API record into the shape the intern pages and dashboards use. */
function toInternView(intern: ApiIntern): InternView {
  return {
    id: intern.id,
    fullName: intern.user.fullName,
    email: intern.user.email,
    phone: intern.user.phone ?? undefined,
    status: intern.status,
    studentNumber: intern.studentNumber,
    institution: intern.institution,
    qualification: intern.qualification,
    yearOfStudy: intern.yearOfStudy ?? undefined,
    campusId: intern.campusId,
    campusName: intern.campus?.name,
    intakeId: intern.intakeId,
    intakeName: intern.intake?.name,
    department: intern.department?.name,
    mentorName: intern.mentor?.user.fullName,
    startDate: intern.startDate ?? undefined,
    endDate: intern.endDate ?? undefined,
    skills: intern.skills?.map((item) => item.skill.name),
    documents: intern.documents,
    projects: intern.assignments?.map((item) => ({ id: item.project.id, name: item.project.name, role: item.projectRole ?? undefined, status: item.project.status, current: !item.leftAt })),
    ending: intern.ending ?? null,
  }
}

export const Interns = {
  list: async () => {
    const response = await apiClient.get<{ data: ApiIntern[] }>(endpoints.interns)
    return { ...response, data: Array.isArray(response.data?.data) ? response.data.data.map(toInternView) : response.data as unknown as InternView[] }
  },
  /** Downloads one of the intern's documents (stored privately, so it comes through the backend). */
  downloadDocument: async (internId: string, doc: Pick<InternDocument, 'id' | 'fileName'>) => {
    const url = `${String(endpoints.interns)}/${encodeURIComponent(internId)}/documents/${encodeURIComponent(doc.id)}/download`
    const { data } = await apiClient.get<Blob>(url, { responseType: 'blob', timeout: 60000 })
    downloadBlob(data, doc.fileName)
  },
  get: async (id: string) => {
    const response = await apiClient.get<{ data: ApiIntern }>(String(endpoints.interns) + '/' + encodeURIComponent(id))
    return { ...response, data: response.data?.data?.user ? toInternView(response.data.data) : response.data as unknown as InternView }
  },
}
