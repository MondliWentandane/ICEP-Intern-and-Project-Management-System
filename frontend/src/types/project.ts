import type { ID } from './common'
export interface Project { id: ID; name: string; status: string; department?: string; description?: string }