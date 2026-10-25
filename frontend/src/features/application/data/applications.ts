// "Track application": the applicant looks up their application with the email they applied with
// plus their reference number (POST /api/applications/track). No account is needed.
// TODO: the "email me a sign-in link" option is still a demo until POST /applications/track/link exists.
import axios from 'axios'
import { apiClient } from '@/api'

export type ApplicationStage = 'submitted' | 'under_review' | 'outcome' | 'placement'
export const stageOrder: ApplicationStage[] = ['submitted', 'under_review', 'outcome', 'placement']

export interface TrackedApplication {
  reference: string
  email: string
  firstName: string
  surname: string
  positionTitle: string
  campus: string
  submittedAt: string
  updatedAt: string
  /** The stage currently in progress. Earlier stages are complete. */
  stage: ApplicationStage
  documents: string[]
  /** Interview booked by the WIL Handler (status INTERVIEWEE). */
  interview?: { at: string; venue?: string }
  /** Set once the placement team has decided. Accepted applicants receive a WIL placement letter. */
  outcome?: 'accepted' | 'rejected'
  /** Placement details shown on the WIL placement letter. */
  placement?: {
    acceptedAt: string
    studentNumber?: string
    institution?: string
    qualification?: string
    department?: string
    intake?: string
    startDate?: string
    endDate?: string
    signatory?: string
  }
}

/** What POST /api/applications/track answers with. */
interface TrackResponse {
  referenceCode: string
  email: string
  fullName: string
  status: 'PENDING' | 'INTERVIEWEE' | 'ACCEPTED' | 'REJECTED'
  studentNumber: string
  institution: string
  qualification: string
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  positionTitle: string
  campus: string
  department: string
  intake: { name: string; startDate: string; endDate: string }
  interview: { at: string; venue: string | null } | null
  documents: string[]
  reviewerName: string | null
}

const documentNames: Record<string, string> = { CV: 'Curriculum vitae', ID_COPY: 'ID document', ACADEMIC_RECORD: 'Academic record' }

function toTracked(data: TrackResponse): TrackedApplication {
  const [firstName = data.fullName, ...rest] = data.fullName.trim().split(/\s+/)
  const base = {
    reference: data.referenceCode,
    email: data.email,
    firstName,
    surname: rest.join(' '),
    positionTitle: data.positionTitle,
    campus: data.campus,
    submittedAt: data.createdAt,
    updatedAt: data.updatedAt,
    documents: data.documents.map((type) => documentNames[type] ?? type),
    ...(data.interview ? { interview: { at: data.interview.at, venue: data.interview.venue ?? undefined } } : {}),
  }
  switch (data.status) {
    case 'PENDING': return { ...base, stage: 'under_review' }
    case 'INTERVIEWEE': return { ...base, stage: 'outcome' }
    case 'REJECTED': return { ...base, stage: 'outcome', outcome: 'rejected' }
    case 'ACCEPTED': return {
      ...base,
      stage: 'placement',
      outcome: 'accepted',
      placement: {
        acceptedAt: data.reviewedAt ?? data.updatedAt,
        studentNumber: data.studentNumber,
        institution: data.institution,
        qualification: data.qualification,
        department: data.department,
        intake: data.intake.name,
        startDate: data.intake.startDate,
        endDate: data.intake.endDate,
        signatory: data.reviewerName ?? undefined,
      },
    }
  }
}

/** Null when no application matches that email and reference (the server does not say which one is wrong). */
export async function findApplication(email: string, reference: string): Promise<TrackedApplication | null> {
  try {
    const { data } = await apiClient.post<TrackResponse>('/applications/track', { email: email.trim(), reference: reference.trim() })
    return toTracked(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

/** Demo only: a real backend would email a one-time sign-in link. Always resolves so it never reveals whether an email has applied. */
export async function requestSignInLink(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  void email
}

const SESSION_KEY = 'icep.track.session'

// The "signed in" tracking session for this browser tab.
export interface TrackSession { email: string; reference: string }

export function startTrackSession(session: TrackSession) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch { /* ignore */ }
}

export function readTrackSession(): TrackSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as TrackSession) : null
  } catch {
    return null
  }
}

export function endTrackSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
}
