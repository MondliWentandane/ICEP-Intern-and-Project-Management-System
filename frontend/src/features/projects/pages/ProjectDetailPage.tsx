import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PageScaffold } from '@/components/ui/PageScaffold'
import type { Project } from './ProjectsPage'
import type { Group } from '@/components/ui/CreateProjectButton'
import { fetchProject } from '@/features/projects/data/projectsApi'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { state } = useLocation() as { state: { project?: Project; group?: Group } | null }
  // Opened from a notification (no page state): load the project from the database.
  const loaded = useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !state?.project && Boolean(projectId),
  })
  const project = state?.project ?? loaded.data
  const group = state?.group ?? (project && (project.members.length || project.groupName)
    ? { id: project.id, name: project.groupName ?? 'Unnamed group', members: project.members.length }
    : undefined)

  if (!project) {
    return (
      <PageScaffold title="Project">
        <p className="text-[#55627a]">{loaded.isLoading ? 'Loading project…' : 'Project not found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white">
          Back to projects
        </button>
      </PageScaffold>
    )
  }

  return (
    <PageScaffold title={project.name}>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-[#0b2a5b]">← Back</button>
      <p className="text-sm text-[#55627a]">{group ? group.name : 'No group yet'}</p>
      <p className="mt-3 text-[#0f1b33]">{project.problemStatement}</p>
      <p className="mt-3 text-sm text-[#55627a]">{project.progress}% complete</p>
      {project.members.length > 0 && (
        <ul className="mt-3 text-sm text-[#0f1b33]">
          {project.members.map((m) => <li key={m.internId}>{m.name}{m.role ? ` – ${m.role}` : ''}</li>)}
        </ul>
      )}
    </PageScaffold>
  )
}

export default ProjectDetailPage
