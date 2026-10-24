// What the "Create project" form produces, shaped like the Prisma Project model.
//
// BACKEND HOOK-UP (still to do): send `NewProjectInput` to POST /api/projects.
//  - departmentId and supervisorId are NOT in the form on purpose: the backend should take them from
//    the signed-in mentor (their Mentor.departmentId and Mentor.id). Today ProjectService.create still
//    requires departmentId in the body, so that needs changing on the backend.
//  - createdById comes from the login token (ProjectController already does this).
//  - progress is not asked for: the schema calculates it from the project's tasks, so it starts at 0.
//  - requiredSkills are skill NAMES; the backend should match them to Skill rows (create missing ones)
//    and save them as ProjectSkill links. The Team Builder uses them to suggest interns.
//  - projectRoutes is not mounted in backend/src/server.ts yet, so /api/projects answers 404.

/** Same values as the ProjectStatus enum in the Prisma schema. */
export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
}

export interface NewProjectInput {
  name: string
  groupName?: string
  description?: string
  status: ProjectStatus
  /** YYYY-MM-DD */
  startDate?: string
  /** YYYY-MM-DD */
  endDate?: string
  requiredSkills: string[]
}

/** Skills ICEP interns list most often (the proposal's examples). Mentors can also type their own. */
export const SKILL_SUGGESTIONS = ['React', 'TypeScript', 'Node.js', 'SQL', 'Python', 'UI/UX design', 'Networking', 'Testing', 'Documentation']

export const NAME_MAX = 120
export const GROUP_MAX = 60
export const DESCRIPTION_MAX = 1000

/** Raw form values -> NewProjectInput (trimmed, empty optional fields left out). */
export function toNewProject(form: { name: string; groupName: string; description: string; status: ProjectStatus; startDate: string; endDate: string; requiredSkills: string[] }): NewProjectInput {
  return {
    name: form.name.trim(),
    ...(form.groupName.trim() ? { groupName: form.groupName.trim() } : {}),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    status: form.status,
    ...(form.startDate ? { startDate: form.startDate } : {}),
    ...(form.endDate ? { endDate: form.endDate } : {}),
    requiredSkills: form.requiredSkills,
  }
}

/** The first problem with the input, or null when it can be saved. Mirrors the backend's checks. */
export function validateNewProject(input: NewProjectInput): string | null {
  if (input.name.length < 3) return 'Enter a project name (at least 3 characters).'
  if (input.name.length > NAME_MAX) return `Keep the project name under ${NAME_MAX} characters.`
  if ((input.groupName?.length ?? 0) > GROUP_MAX) return `Keep the group name under ${GROUP_MAX} characters.`
  if ((input.description?.length ?? 0) > DESCRIPTION_MAX) return `Keep the description under ${DESCRIPTION_MAX} characters.`
  if (input.startDate && input.endDate && input.endDate < input.startDate) return 'The end date cannot be before the start date.'
  if (input.status === 'COMPLETED') return 'A new project cannot start as Completed.'
  return null
}
