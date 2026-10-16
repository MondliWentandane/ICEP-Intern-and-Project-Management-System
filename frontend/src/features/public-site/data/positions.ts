// Demo positions for the public Careers pages.
// TODO: replace fetchPositions/fetchPosition with Public.positions()/Public.position() once the backend API exists.

export type PositionCategory = 'Software Development' | 'Cybersecurity' | 'Systems Engineering'

export interface CareerPosition {
  id: string
  title: string
  category: PositionCategory
  campus: string
  durationMonths: number
  startDate: string
  closingDate: string
  openings: number
  summary: string
  responsibilities: string[]
  requirements: string[]
}

export const positionCategories: PositionCategory[] = ['Software Development', 'Cybersecurity', 'Systems Engineering']
export const campuses = ['Soshanguve', 'Pretoria', 'eMalahleni', 'Polokwane', 'Mbombela', 'Ga-Rankuwa']

const demoPositions: CareerPosition[] = [
  {
    id: 'software-development-intern', title: 'Software Development Intern', category: 'Software Development', campus: 'Soshanguve',
    durationMonths: 12, startDate: '2027-02-01', closingDate: '2026-12-15', openings: 6,
    summary: 'Join the Software Development team for a 12-month work-integrated learning placement. You will build and maintain features for real client projects, guided by a mentor and reviewed weekly.',
    responsibilities: ['Build features from approved designs and specifications.', 'Write and review code with your mentor each week.', 'Update your tasks on the Task Board and report progress.', 'Present your work at the monthly project review.'],
    requirements: ['Enrolled in or recently completed an IT or Computer Science qualification.', 'Working knowledge of at least one programming language.', 'Able to work full time on the Soshanguve campus.', 'Certified academic record and a signed WIL letter from your institution.'],
  },
  {
    id: 'cybersecurity-intern', title: 'Cybersecurity Intern', category: 'Cybersecurity', campus: 'eMalahleni',
    durationMonths: 12, startDate: '2027-02-01', closingDate: '2026-10-25', openings: 3,
    summary: 'Help the Cybersecurity team protect ICEP systems for a 12-month placement. You will monitor alerts, test controls and document findings with a mentor.',
    responsibilities: ['Monitor security alerts and escalate incidents.', 'Assist with vulnerability scans and remediation tracking.', 'Document findings and security procedures.', 'Present your work at the monthly project review.'],
    requirements: ['Enrolled in or recently completed an IT or Computer Science qualification.', 'Basic understanding of networks and operating systems.', 'Able to work full time on the eMalahleni campus.', 'Certified academic record and a signed WIL letter from your institution.'],
  },
  {
    id: 'systems-engineering-intern', title: 'Systems Engineering Intern', category: 'Systems Engineering', campus: 'Polokwane',
    durationMonths: 12, startDate: '2027-02-01', closingDate: '2026-12-31', openings: 4,
    summary: 'Work with the Systems Engineering team on servers, deployments and internal tooling for a 12-month placement.',
    responsibilities: ['Help maintain servers and deployment pipelines.', 'Automate routine tasks with scripts.', 'Update your tasks on the Task Board and report progress.', 'Present your work at the monthly project review.'],
    requirements: ['Enrolled in or recently completed an IT or Computer Science qualification.', 'Familiarity with Linux or Windows Server.', 'Able to work full time on the Polokwane campus.', 'Certified academic record and a signed WIL letter from your institution.'],
  },
  {
    id: 'web-developer-intern', title: 'Web Developer Intern', category: 'Software Development', campus: 'Polokwane',
    durationMonths: 12, startDate: '2027-02-01', closingDate: '2026-11-30', openings: 4,
    summary: 'Join the Software Engineering team for a 12-month work-integrated learning placement. You will build and maintain web features for real client projects, guided by a mentor and reviewed weekly.',
    responsibilities: ['Build responsive pages and components from approved designs.', 'Write and review code with your mentor each week.', 'Update your tasks on the Task Board and report progress.', 'Present your work at the monthly project review.'],
    requirements: ['Enrolled in or recently completed an IT or Computer Science qualification.', 'Working knowledge of HTML, CSS and JavaScript.', 'Able to work full time on the Polokwane campus.', 'Certified academic record and a signed WIL letter from your institution.'],
  },
  {
    id: 'information-security-intern', title: 'Information Security Intern', category: 'Cybersecurity', campus: 'Soshanguve',
    durationMonths: 12, startDate: '2027-02-01', closingDate: '2026-12-20', openings: 2,
    summary: 'Support information security policy, access reviews and awareness training across ICEP for a 12-month placement.',
    responsibilities: ['Run user access reviews with the security lead.', 'Help prepare security awareness material.', 'Keep policy documents up to date.', 'Present your work at the monthly project review.'],
    requirements: ['Enrolled in or recently completed an IT or Computer Science qualification.', 'Strong written communication skills.', 'Able to work full time on the Soshanguve campus.', 'Certified academic record and a signed WIL letter from your institution.'],
  },
  {
    id: 'it-infrastructure-intern', title: 'IT Infrastructure Intern', category: 'Systems Engineering', campus: 'eMalahleni',
    durationMonths: 12, startDate: '2027-02-01', closingDate: '2026-10-28', openings: 3,
    summary: 'Support campus networks, devices and helpdesk requests for a 12-month placement.',
    responsibilities: ['Set up and maintain campus devices.', 'Resolve helpdesk tickets and record fixes.', 'Assist with network cabling and configuration.', 'Present your work at the monthly project review.'],
    requirements: ['Enrolled in or recently completed an IT or Computer Science qualification.', 'Interest in networking and hardware.', 'Able to work full time on the eMalahleni campus.', 'Certified academic record and a signed WIL letter from your institution.'],
  },
]

const DAY = 24 * 60 * 60 * 1000
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function daysUntilClosing(position: CareerPosition, now = new Date()) {
  const closing = new Date(`${position.closingDate}T23:59:59`)
  return Math.ceil((closing.getTime() - now.getTime()) / DAY)
}

export function positionStatus(position: CareerPosition): 'open' | 'closing-soon' | 'closed' {
  const days = daysUntilClosing(position)
  if (days < 0) return 'closed'
  return days <= 14 ? 'closing-soon' : 'open'
}

export async function fetchPositions(): Promise<CareerPosition[]> {
  await wait(250)
  return demoPositions.filter((position) => positionStatus(position) !== 'closed')
}

export async function fetchPosition(id: string): Promise<CareerPosition | null> {
  await wait(200)
  return demoPositions.find((position) => position.id === id) ?? null
}
