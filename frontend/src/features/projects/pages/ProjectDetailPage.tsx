import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PageScaffold } from '@/components/ui/PageScaffold'
import type { Project } from './ProjectsPage'
import type { Group } from '@/components/ui/CreateProjectButton'
import { fetchProject } from '@/features/projects/data/projectsApi'
import { BikeLoader } from '@/components/ui/BikeLoader'
import GanttPage from '@/features/gantt/pages/GanttPage'
import { ProjectTaskList } from '@/features/tasks/pages/components/ProjectTaskList'

const TABS = [
  ['overview', 'Overview'],
  ['gantt', 'Gantt chart'],
  ['tasks', 'Task list'],
] as const
type Tab = (typeof TABS)[number][0]

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { state } = useLocation() as { state: { project?: Project; group?: Group; tab?: Tab } | null }
  // Callers such as the Mentor dashboard can open the page on a specific tab.
  const [tab, setTab] = useState<Tab>(state?.tab ?? 'overview')
  // Opened from a notification (no page state): load the project from the database.
  const loaded = useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !state?.project && Boolean(projectId),
  })
  const project = state?.project ?? loaded.data

  if (!project) {
    return (
      <PageScaffold title="Project">
        {loaded.isLoading ? <BikeLoader label="Loading project" size={110} /> : <p className="text-[#55627a]">Project not found.</p>}
        <button onClick={() => navigate(-1)} className="mt-4 rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white">
          Back to projects
        </button>
      </PageScaffold>
    )
  }

  return (
    <PageScaffold title={project.name}>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-[#0b2a5b]">← Back</button>

      <div role="tablist" aria-label="Project sections" className="mb-6 flex gap-2 border-b border-[#e7ecf4]">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === key ? 'border-[#0b2a5b] text-[#0b2a5b]' : 'border-transparent text-[#55627a] hover:text-[#0f1b33]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <p className="text-sm text-[#55627a]">{project.groupName ?? 'No group yet'}</p>
          <p className="mt-3 text-[#0f1b33]">{project.problemStatement}</p>
          <p className="mt-3 text-sm text-[#55627a]">{project.progress}% complete</p>
          {project.members.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-[#0f1b33]">
              {project.members.map((m) => (
                <li key={m.internId}>
                  {m.name}
                  {m.role && <span className="ml-2 rounded-full bg-[#e9eef7] px-2.5 py-0.5 text-xs font-semibold text-[#0b2a5b]">{m.role}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === 'gantt' && <GanttPage projectId={project.id} />}
      {tab === 'tasks' && <ProjectTaskList projectId={project.id} />}
    </PageScaffold>
  )
}

export default ProjectDetailPage