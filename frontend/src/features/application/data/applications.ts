// Demo application store for tracking. Submitted applications are kept in this browser's localStorage
// so "Track application" still works after a refresh or a later visit.
// TODO: replace with API calls (look up by email + reference, magic sign-in link) once the backend exists.

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
}

const STORE_KEY = 'icep.demo.applications'
const SESSION_KEY = 'icep.track.session'

// One example so the tracking pages can be tried without submitting first.
const demoApplication: TrackedApplication = {
  reference: 'ICEP-2026-01428', email: 'applicant@example.com', firstName: 'Demo', surname: 'Applicant',
  positionTitle: 'Web Developer Intern', campus: 'Polokwane', submittedAt: '2026-10-05T09:30:00', updatedAt: '2026-10-07T14:00:00',
  stage: 'under_review', documents: ['Curriculum vitae', 'ID document', 'Academic record'],
}

function readStore(): TrackedApplication[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    const saved = raw ? (JSON.parse(raw) as TrackedApplication[]) : []
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function writeStore(applications: TrackedApplication[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(applications)) } catch { /* storage unavailable: tracking lasts for this visit only */ }
}

const memory: TrackedApplication[] = []
function allApplications() {
  const stored = readStore()
  return [demoApplication, ...stored, ...memory.filter((item) => !stored.some((saved) => saved.reference === item.reference))]
}
const normalise = (value: string) => value.trim().toLowerCase()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function saveApplication(application: TrackedApplication) {
  memory.push(application)
  const stored = readStore()
  writeStore([...stored.filter((item) => item.reference !== application.reference), application])
}

export async function findApplication(email: string, reference: string): Promise<TrackedApplication | null> {
  await wait(400)
  return allApplications().find((item) => normalise(item.email) === normalise(email) && normalise(item.reference) === normalise(reference)) ?? null
}

/** Demo only: a real backend would email a one-time sign-in link. Always resolves so it never reveals whether an email has applied. */
export async function requestSignInLink(email: string): Promise<void> {
  await wait(500)
  void email
}

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
