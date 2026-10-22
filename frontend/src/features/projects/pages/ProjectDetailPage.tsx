import { useLocation, useNavigate } from 'react-router-dom'
import { PageScaffold } from '@/components/ui/PageScaffold'
import type { Project } from './ProjectsPage'
import type { Group } from '@/components/ui/CreateProjectButton'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { project?: Project; group?: Group } | null }
  const project = state?.project
  const group = state?.group

  if (!project) {
    return (
      <PageScaffold title="Project">
        <p className="text-[#55627a]">Project not found.</p>
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
    </PageScaffold>
  )
}

export default ProjectDetailPage