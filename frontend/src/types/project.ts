import type { ID } from './common'
export interface Project {
  id: ID
  name: string
  status: string
  createdById?: ID | null
  department?: string | { id: ID; name: string; description?: string | null } | null
  description?: string
  supervisor?: { user?: { id?: ID } | null } | null
  assignments?: Array<{
    internId: ID
    projectRole?: string | null
    intern?: { id?: ID; user?: { id?: ID; fullName?: string } }
  }>
}
