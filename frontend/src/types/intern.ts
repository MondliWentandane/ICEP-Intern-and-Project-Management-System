import type { ID } from './common'
export interface Intern { id: ID; fullName: string; studentNumber?: string; email?: string; status: string; campusId?: ID }
export interface InternProfile extends Intern { skills?: string[]; department?: string; supervisor?: string }
export type PastIntern = InternProfile