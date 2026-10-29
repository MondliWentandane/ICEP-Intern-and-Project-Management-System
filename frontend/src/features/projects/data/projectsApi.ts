// Projects and their groups (teams), saved in the database through the backend:
//   GET    /projects                  the signed-in mentor's projects (admin: all)
//   POST   /projects                  create; body may include members: [{ internId, projectRole }]
//   PUT    /projects/:id              edit; members (if sent) replaces the whole team
//   DELETE /projects/:id
//   GET    /interns                   every intern in the database, with the groups they are already in
// A project's group = its groupName + its members (ProjectAssignment rows, each with a role).
// The backend notifies each intern when they are added, when their role changes and when they are removed,
// and notifies admins when a project is created.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, endpoints } from '@/api'
import { Interns } from '@/api/services/interns.service'
import { tokenStorage } from '@/utils/tokenStorage'

/** Roles a mentor can give a group member. */
export const PROJECT_ROLES = ['Backend Developer', 'Frontend Developer', 'Scrum Master', 'UI/UX Designer', 'Tester'] as const

export interface TeamMemberInput { internId: string; projectRole: string }
/** First problem with the chosen members, or '' when they can be saved. */
export const teamError = (members: TeamMemberInput[]) =>
  members.some((m) => !m.projectRole) ? 'Choose a role for every selected member.' : ''

export interface ProjectMember { internId: string; name: string; role: string | null }

/** A project as the Projects page shows it. */
export interface ProjectRecord {
  id: string
  name: string
  problemStatement: string
  groupName: string | null
  members: ProjectMember[]
  progress: number
  canManage: boolean
}

/** An intern who can be put in a group, with the groups they are already in. */
export interface TeamCandidate {
  id: string
  name: string
  email: string
  studentNumber?: string
  status: string
  groups: { projectId: string; projectName: string; groupName: string | null; role: string | null }[]
}

interface ApiProject {
  id: string
  name: string
  groupName: string | null
  description: string | null
  progress: number
  supervisor?: { user?: { id: string } } | null
  assignments?: { internId: string; projectRole: string | null; intern?: { user?: { fullName: string } } }[]
}

const toRecord = (project: ApiProject): ProjectRecord => ({
  id: project.id,
  name: project.name,
  problemStatement: project.description ?? '',
  groupName: project.groupName,
  progress: project.progress ?? 0,
  canManage: project.supervisor?.user?.id === tokenStorage.getUser()?.id,
  members: (project.assignments ?? []).map((a) => ({ internId: a.internId, name: a.intern?.user?.fullName ?? 'Intern', role: a.projectRole })),
})

const PROJECTS_KEY = ['projects', 'mine'] as const
const INTERNS_KEY = ['projects', 'team-candidates'] as const
const signedIn = () => Boolean(tokenStorage.get())

export async function fetchProjects() {
  return (await apiClient.get<ApiProject[]>(endpoints.projects)).data.map(toRecord)
}

export function useProjects() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, tokenStorage.getUser()?.id ?? null],
    queryFn: fetchProjects,
    enabled: signedIn(),
  })
}

/** Every active intern from the database, with the groups they already belong to. */
export function useTeamCandidates() {
  return useQuery({
    queryKey: INTERNS_KEY,
    queryFn: async () => {
      const { data } = await Interns.list()
      return data
        .filter((intern) => (intern.status ?? 'ACTIVE') === 'ACTIVE')
        .map<TeamCandidate>((intern) => ({
          id: String(intern.id),
          name: intern.fullName,
          email: intern.email ?? '',
          studentNumber: intern.studentNumber,
          status: intern.status ?? 'ACTIVE',
          groups: (intern.projects ?? []).filter((p) => p.current !== false).map((p) => ({
            projectId: String(p.id), projectName: p.name, groupName: p.groupName ?? null, role: p.role ?? null,
          })),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    enabled: signedIn(),
  })
}

export interface ProjectInput { name: string; problemStatement: string; groupName: string; members: TeamMemberInput[] }
const toBody = (input: ProjectInput) => ({
  name: input.name,
  description: input.problemStatement,
  groupName: input.groupName.trim() || null,
  members: input.members,
})

function useRefresh() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    void queryClient.invalidateQueries({ queryKey: INTERNS_KEY })
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }
}

export function useCreateProject() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      const { groupName, ...body } = toBody(input)
      return toRecord((await apiClient.post<ApiProject>(endpoints.projects, { ...body, ...(groupName ? { groupName } : {}) })).data)
    },
    onSettled: refresh,
  })
}

export function useUpdateProject() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({ id, ...input }: ProjectInput & { id: string }) =>
      toRecord((await apiClient.put<ApiProject>(`${endpoints.projects}/${encodeURIComponent(id)}`, toBody(input))).data),
    onSettled: refresh,
  })
}

export function useDeleteProject() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${endpoints.projects}/${encodeURIComponent(id)}`),
    onSettled: refresh,
  })
}

export async function fetchProject(id: string) {
  return toRecord((await apiClient.get<ApiProject>(`${endpoints.projects}/${encodeURIComponent(id)}`)).data)
}

