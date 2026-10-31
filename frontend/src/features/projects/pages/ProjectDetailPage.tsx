import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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
  const [tab, setTab] = useState<Tab>(state?.tab ?? 'overview')

  const loaded = useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !state?.project && Boolean(projectId),
  })
  const project = state?.project ?? loaded.data

  if (!project) {
    return (
      <div className="p-6">
        {loaded.isLoading ? (
          <BikeLoader label="Loading project" size={110} />
        ) : (
          <div>
            <p className="text-[#55627a]">Project not found.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Back to projects
            </button>
          </div>
        )}
      </div>
    )
  }

  // Dynamic status phase indicators
  const getStatusBadge = (progress: number) => {
    if (progress === 100) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Completed
        </span>
      )
    }
    if (progress > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          In Progress
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Planning Phase
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ecf4] pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#55627a] hover:text-[#0b2a5b] transition-colors"
        >
          ← Back to projects
        </button>

        {/* View Switcher Buttons */}
        <div role="tablist" aria-label="Project views" className="flex items-center gap-2">
          {TABS.map(([key, label]) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#0b2a5b] text-white shadow-sm'
                    : 'bg-[#f1f5f9] text-[#55627a] hover:bg-[#e2e8f0] hover:text-[#0f1b33]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview View */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="rounded-xl border border-[#e7ecf4] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-md bg-[#e9eef7] px-2.5 py-1 text-xs font-semibold text-[#0b2a5b]">
                    {project.groupName ?? 'General Group'}
                  </span>
                  {getStatusBadge(project.progress)}
                </div>
                <h1 className="mt-3 text-2xl font-bold text-[#0f1b33]">
                  {project.name}
                </h1>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Overall Completion</span>
                <div className="text-2xl font-bold text-[#0b2a5b]">{project.progress}%</div>
              </div>
            </div>

            {/* Problem Statement Section */}
            <div className="mt-6 border-t border-[#f1f5f9] pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Problem Statement
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[#334155]">
                {project.problemStatement || 'No detailed problem statement provided.'}
              </p>
            </div>

            {/* Progress Graphic Bar */}
            <div className="mt-6">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.progress === 100 ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#0b2a5b] to-[#2563eb]'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e7ecf4] bg-white p-4 shadow-sm flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9eef7] text-[#0b2a5b] font-bold text-lg">
                👥
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-[#94a3b8]">Team Members</div>
                <div className="text-xl font-bold text-[#0f1b33]">{project.members.length} Assigned</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e7ecf4] bg-white p-4 shadow-sm flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#dbeafe] text-[#1e40af] font-bold text-lg">
                📊
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-[#94a3b8]">Current Phase</div>
                <div className="text-base font-bold text-[#0f1b33] mt-0.5">
                  {project.progress === 100 ? 'Completed' : project.progress > 0 ? 'In Progress' : 'Planning Phase'}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e7ecf4] bg-white p-4 shadow-sm flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309] font-bold text-lg">
                ⚡
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-[#94a3b8]">Group Name</div>
                <div className="text-xl font-bold text-[#0f1b33]">{project.groupName ?? 'Maradona'}</div>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          {project.members.length > 0 && (
            <div className="rounded-xl border border-[#e7ecf4] bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-4">
                Assigned Team Members ({project.members.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {project.members.map((m) => {
                  const initials = m.name
                    ? m.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'U'
                  return (
                    <div
                      key={m.internId}
                      className="flex items-center gap-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-3 hover:bg-[#f1f5f9] transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2a5b] text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-semibold text-[#0f1b33]">{m.name}</p>
                        {m.role && (
                          <span className="mt-0.5 inline-block rounded-full bg-[#e9eef7] px-2 py-0.5 text-xs font-medium text-[#0b2a5b]">
                            {m.role}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gantt Chart View */}
      {tab === 'gantt' && (
        <div className="rounded-xl border border-[#e7ecf4] bg-white p-4 shadow-sm">
          <GanttPage projectId={project.id} />
        </div>
      )}

      {/* Task List View */}
      {tab === 'tasks' && (
        <div className="rounded-xl border border-[#e7ecf4] bg-white p-4 shadow-sm">
          <ProjectTaskList projectId={project.id} />
        </div>
      )}
    </div>
  )
}

export default ProjectDetailPage