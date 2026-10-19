import type { Applicant, Task } from '@/types'
import type { CampusView, IntakeView, InternView, ProjectView } from './types'

// SAMPLE DATA, used only by the Vite dev server when the backend is unreachable.
const DAY = 86_400_000
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

export const sampleCampuses: CampusView[] = [
  { id: 'c1', name: 'Polokwane', city: 'Polokwane', province: 'Limpopo', address: '1 Example Street' },
  { id: 'c2', name: 'Pretoria', city: 'Pretoria', province: 'Gauteng', address: '2 Example Avenue' },
  { id: 'c3', name: 'Johannesburg', city: 'Johannesburg', province: 'Gauteng', address: '3 Example Road' },
]

export const sampleIntakes: IntakeView[] = [
  { id: 'i1', name: '2026 Intake 1', startDate: '2026-01-12', endDate: '2026-06-30', isActive: true, positionCount: 4 },
  { id: 'i2', name: '2026 Intake 2', startDate: '2026-07-06', endDate: '2026-12-18', isActive: true, positionCount: 6 },
  { id: 'i3', name: '2027 Intake 1', startDate: '2027-01-11', endDate: '2027-06-30', isActive: true, positionCount: 3 },
  { id: 'i0', name: '2025 Intake 2', startDate: '2025-07-07', endDate: '2025-12-19', isActive: false, positionCount: 5 },
]

export const sampleApplicants: Applicant[] = [
  { id: 'a1', fullName: 'Lerato Sample', email: 'lerato@example.com', status: 'PENDING', campusId: 'c1' },
  { id: 'a2', fullName: 'Sipho Sample', email: 'sipho@example.com', status: 'PENDING', campusId: 'c2' },
  { id: 'a3', fullName: 'Naledi Sample', email: 'naledi@example.com', status: 'INTERVIEWEE', campusId: 'c1' },
  { id: 'a4', fullName: 'Kabelo Sample', email: 'kabelo@example.com', status: 'PENDING', campusId: 'c3' },
  { id: 'a5', fullName: 'Zanele Sample', email: 'zanele@example.com', status: 'INTERVIEWEE', campusId: 'c2' },
  { id: 'a6', fullName: 'Tshepo Sample', email: 'tshepo@example.com', status: 'ACCEPTED', campusId: 'c1' },
  { id: 'a7', fullName: 'Palesa Sample', email: 'palesa@example.com', status: 'REJECTED', campusId: 'c3' },
]

export const sampleInterns: InternView[] = [
  {
    id: 'n1', fullName: 'Thandi Sample', studentNumber: '2023001', email: 'thandi@example.com', status: 'ACTIVE', campusId: 'c1',
    phone: '071 000 0001', institution: 'Example University', qualification: 'BSc Computer Science', yearOfStudy: 3,
    intakeId: 'i2', intakeName: '2026 Intake 2', campusName: 'Polokwane', department: 'Software Development', mentorName: 'Mr M. Mentor',
    startDate: '2026-07-06', endDate: '2026-12-18', skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    projects: [{ id: 'p1', name: 'Intern Management System', role: 'Frontend Developer', status: 'IN_PROGRESS', current: true }],
    documents: [{ id: 'd1', type: 'CV', fileName: 'thandi-cv.pdf' }, { id: 'd2', type: 'Academic record', fileName: 'thandi-academic-record.pdf' }],
  },
  {
    id: 'n2', fullName: 'Bongani Sample', studentNumber: '2023002', email: 'bongani@example.com', status: 'ACTIVE', campusId: 'c2',
    institution: 'Example University of Technology', qualification: 'Diploma in ICT', yearOfStudy: 3,
    intakeId: 'i2', intakeName: '2026 Intake 2', campusName: 'Pretoria', department: 'Cybersecurity & Informatics', mentorName: 'Ms L. Mentor',
    startDate: '2026-07-06', endDate: '2026-12-18', skills: ['Python', 'Networking', 'Linux'],
    projects: [{ id: 'p2', name: 'Security Audit Dashboard', role: 'Team Lead', status: 'IN_PROGRESS', current: true }],
    documents: [{ id: 'd3', type: 'CV', fileName: 'bongani-cv.pdf' }],
  },
  { id: 'n3', fullName: 'Refilwe Sample', studentNumber: '2023003', email: 'refilwe@example.com', status: 'ACTIVE', campusId: 'c1', intakeId: 'i2', intakeName: '2026 Intake 2', campusName: 'Polokwane', department: 'Software Development', skills: ['Java', 'Spring'] },
  { id: 'n4', fullName: 'Mpho Sample', studentNumber: '2023004', email: 'mpho@example.com', status: 'ACTIVE', campusId: 'c3', intakeId: 'i2', intakeName: '2026 Intake 2', campusName: 'Johannesburg', department: 'Systems Engineering' },
  { id: 'n5', fullName: 'Karabo Sample', studentNumber: '2023005', email: 'karabo@example.com', status: 'ACTIVE', campusId: 'c2', intakeId: 'i2', intakeName: '2026 Intake 2', campusName: 'Pretoria', department: 'Software Development' },
  {
    id: 'n6', fullName: 'Ayanda Sample', studentNumber: '2022011', email: 'ayanda@example.com', status: 'COMPLETED', campusId: 'c1',
    phone: '071 000 0006', institution: 'Example University', qualification: 'BSc Information Systems', yearOfStudy: 3,
    intakeId: 'i1', intakeName: '2026 Intake 1', campusName: 'Polokwane', department: 'Software Development', mentorName: 'Mr M. Mentor',
    startDate: '2026-01-12', endDate: '2026-06-30', skills: ['Vue', 'Laravel', 'MySQL'],
    projects: [{ id: 'p0', name: 'Campus Booking Portal', role: 'Full-stack Developer', status: 'COMPLETED', current: false }],
    documents: [{ id: 'd4', type: 'CV', fileName: 'ayanda-cv.pdf' }],
  },
  { id: 'n7', fullName: 'Lwazi Sample', studentNumber: '2022012', email: 'lwazi@example.com', status: 'COMPLETED', campusId: 'c2', intakeId: 'i1', intakeName: '2026 Intake 1', campusName: 'Pretoria', department: 'Cybersecurity & Informatics' },
  { id: 'n8', fullName: 'Dineo Sample', studentNumber: '2021020', email: 'dineo@example.com', status: 'COMPLETED', campusId: 'c3', intakeId: 'i0', intakeName: '2025 Intake 2', campusName: 'Johannesburg', department: 'Systems Engineering' },
]

export const sampleProjects: ProjectView[] = [
  { id: 'p1', name: 'Intern Management System', status: 'IN_PROGRESS', department: 'Software Development', progress: 62, endDate: daysFromNow(45) },
  { id: 'p2', name: 'Security Audit Dashboard', status: 'IN_PROGRESS', department: 'Cybersecurity & Informatics', progress: 35, endDate: daysFromNow(60) },
  { id: 'p3', name: 'Asset Tracking App', status: 'PLANNED', department: 'Systems Engineering', progress: 0, endDate: daysFromNow(120) },
  { id: 'p0', name: 'Campus Booking Portal', status: 'COMPLETED', department: 'Software Development', progress: 100, endDate: daysFromNow(-110) },
]

export const sampleTasks: Task[] = [
  { id: 't1', title: 'Finish login screens', status: 'completed', projectId: 'p1', dueAt: daysFromNow(-3) },
  { id: 't2', title: 'Applicant list API integration', status: 'in_progress', projectId: 'p1', dueAt: daysFromNow(2) },
  { id: 't3', title: 'Dashboard wireframes review', status: 'todo', projectId: 'p1', dueAt: daysFromNow(5) },
  { id: 't4', title: 'Threat model write-up', status: 'in_progress', projectId: 'p2', dueAt: daysFromNow(-2) },
  { id: 't5', title: 'Audit log table', status: 'todo', projectId: 'p2', dueAt: daysFromNow(9) },
  { id: 't6', title: 'Requirements sign-off', status: 'todo', projectId: 'p3', dueAt: daysFromNow(14) },
  { id: 't7', title: 'Test plan', status: 'completed', projectId: 'p1', dueAt: daysFromNow(-8) },
]
