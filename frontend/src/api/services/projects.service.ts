import { apiClient, endpoints } from '@/api'
import type { Project } from '@/types'

export interface MentorProject extends Omit<Project, 'supervisor' | 'assignments'> {
  supervisor: { user: { id: string } } | null
  assignments: Array<{ intern: { id: string; user: { fullName: string } } }>
}

export const Projects = {
  list: () => apiClient.get<Project[]>(endpoints.projects),
  listForMentor: async (mentorUserId: string) => {
    const response = await apiClient.get<Project[]>(endpoints.projects)
    return {
      ...response,
      data: response.data
        .filter((project) => project.supervisor?.user?.id === mentorUserId || project.createdById === mentorUserId)
        .map((project): MentorProject => ({
          ...project,
          supervisor: project.supervisor?.user?.id
            ? { user: { id: project.supervisor.user.id } }
            : null,
          assignments: (project.assignments ?? []).flatMap((assignment) =>
            assignment.intern?.id && assignment.intern.user?.fullName
              ? [{ intern: { id: assignment.intern.id, user: { fullName: assignment.intern.user.fullName } } }]
              : [],
          ),
        })),
    }
  },
  get: (id: string) => apiClient.get<Project>(String(endpoints.projects) + '/' + encodeURIComponent(id)),
}
