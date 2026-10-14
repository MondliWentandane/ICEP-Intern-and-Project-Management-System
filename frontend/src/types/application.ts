import type { ID } from './common'
export interface Applicant { id: ID; fullName: string; email: string; status: string; campusId?: ID }
export interface ApplicationForm { fullName?: string; email?: string; studentNumber?: string; campusId?: ID }