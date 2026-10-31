import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock3, ListChecks, Users } from 'lucide-react'
import type { Project } from './ProjectsPage'
import { fetchProject } from '@/features/projects/data/projectsApi'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { Tasks } from '@/api/services/tasks.service'
import type { ApiTaskStatus, TaskApiRecord } from '@/types'
import GanttPage from '@/features/gantt/pages/GanttPage'
import { CalendarPage } from '@/features/calendar/pages/CalendarPage'
import { ProjectTaskList } from '@/features/tasks/pages/components/ProjectTaskList'

const TABS = [
  ['overview', 'Overview'],
  ['tasks', 'Tasks'],
  ['gantt', 'Gantt chart'],
  ['calendar', 'Calendar'],
] as const
type Tab = (typeof TABS)[number][0]

const statusLabel: Record<ApiTaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
}

function taskState(task: TaskApiRecord) {
  if (task.status === 'BLOCKED') return { label: 'Blocked', tone: 'bg-[#FEE2E2] text-[#DC2626]' }
  if (task.status === 'TODO') return { label: statusLabel.TODO, tone: 'bg-[#F5F6F8] text-[#718096]' }
  if (task.status === 'IN_PROGRESS') return { label: statusLabel.IN_PROGRESS, tone: 'bg-[#DCFCE7] text-[#166534]' }
  if (!task.approvedAt) return { label: 'In review', tone: 'bg-[#FEF3C7] text-[#92400E]' }
  return { label: statusLabel.COMPLETED, tone: 'bg-[#DBEAFE] text-[#1D4ED8]' }
}

function projectStatus(status: Project['status']) {
  switch (status) {
    case 'IN_PROGRESS': return { label: 'In progress', tone: 'bg-[#DCFCE7] text-[#166534]' }
    case 'COMPLETED': return { label: 'Completed', tone: 'bg-[#DBEAFE] text-[#1D4ED8]' }
    case 'ON_HOLD': return { label: 'On hold', tone: 'bg-[#FEE2E2] text-[#B91C1C]' }
    default: return { label: 'Planned', tone: 'bg-[#FEF3C7] text-[#92400E]' }
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'No date set'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? 'No date set' : new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date)
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

function TaskPreview({ task }: { task: TaskApiRecord }) {
  const state = taskState(task)
  const assignee = task.assigneeName?.trim() || 'Unassigned'
  return (
    <article className="rounded-xl border border-[#D1D9E2] bg-[#F5F6F8] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${state.tone}`}>{state.label}</span>
        <span className="text-xs text-[#718096]">{task.priority ? `${task.priority.toLowerCase()} priority` : 'Medium priority'}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[#1A202C]">{task.title}</h3>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#718096]">
        <span className="inline-flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1B3A5C] text-[10px] font-semibold text-white">{initials(assignee)}</span>
          {assignee}
        </span>
        <span className="inline-flex items-center gap-1.5"><Clock3 size={13} aria-hidden="true" />Due {formatDate(task.dueDate)}</span>
      </div>
    </article>
  )
}

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { state: locationState } = useLocation() as { state: { project?: Project; tab?: Tab } | null }
  const [tab, setTab] = useState<Tab>(locationState?.tab ?? 'overview')

  const loaded = useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !locationState?.project && Boolean(projectId),
  })
  const project = locationState?.project ?? loaded.data
  const taskQuery = useQuery({
    queryKey: ['projects', project?.id, 'overview-tasks'],
    queryFn: () => Tasks.getGanttData(project!.id),
    enabled: Boolean(project?.id) && tab === 'overview',
    refetchInterval: tab === 'overview' ? 30_000 : false,
  })

  if (!project) {
    return (
      <div className="p-6">
        {loaded.isLoading ? <BikeLoader label="Loading project" size={110} /> : (
          <div>
            <p className="text-[#718096]">Project not found.</p>
            <button onClick={() => navigate(-1)} className="mt-4 rounded-lg bg-[#1B3A5C] px-5 py-2.5 text-sm font-semibold text-white">Back to projects</button>
          </div>
        )}
      </div>
    )
  }

  const members = project.members ?? []
  const tasks = taskQuery.data ?? []
  const completion = Math.max(0, Math.min(100, project.progress ?? 0))
  const projectState = projectStatus(project.status)
  const totalTasks = tasks.length
  const activeTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length
  const pendingTasks = tasks.filter((task) => task.status === 'TODO').length
  const reviewTasks = tasks.filter((task) => task.status === 'COMPLETED' && !task.approvedAt).length
  const blockedTasks = tasks.filter((task) => task.status === 'BLOCKED').length
  const overviewTasks = tasks.slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 text-[#1A202C] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-medium text-[#718096] transition hover:text-[#1B3A5C]">
          <span aria-hidden="true">←</span> Back to projects
        </button>
        <nav role="tablist" aria-label="Project views" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#E9EEF4] p-1">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${tab === key ? 'bg-white text-[#1B3A5C] shadow-sm' : 'text-[#718096] hover:text-[#1A202C]'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <section className="rounded-xl border border-[#D1D9E2] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#E9EEF4] px-3 py-1 text-xs font-semibold text-[#1B3A5C]">{project.groupName || 'Project team'}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${projectState.tone}`}>{projectState.label}</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-[#1A202C] sm:text-3xl">{project.name}</h1>
                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#718096]">
                  {project.problemStatement || 'No project overview has been added yet.'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-4 text-sm text-[#718096]">
                <span className="inline-flex items-center gap-2"><Users size={16} aria-hidden="true" />{members.length} {members.length === 1 ? 'team member' : 'team members'}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays size={16} aria-hidden="true" />Due {formatDate(project.endDate)}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-[#E7ECF1] pt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[#718096]">
                <span>Project progress</span>
                <span className="font-semibold text-[#1B3A5C]">{completion}% complete</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#E7ECF1]" role="progressbar" aria-label="Project progress" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#1B3A5C] transition-[width] duration-500" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </section>

          <section aria-label="Project task summary" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Total tasks', value: taskQuery.isLoading || taskQuery.isError ? '—' : totalTasks, icon: ListChecks, tone: 'text-[#1B3A5C] bg-[#E9EEF4]' },
              { label: 'Active', value: taskQuery.isLoading || taskQuery.isError ? '—' : activeTasks, icon: Clock3, tone: 'text-[#166534] bg-[#DCFCE7]' },
              { label: 'Pending', value: taskQuery.isLoading || taskQuery.isError ? '—' : pendingTasks, icon: ListChecks, tone: 'text-[#92400E] bg-[#FEF3C7]' },
              { label: 'In review', value: taskQuery.isLoading || taskQuery.isError ? '—' : reviewTasks, icon: Clock3, tone: 'text-[#1D4ED8] bg-[#DBEAFE]' },
              { label: 'Blocked', value: taskQuery.isLoading || taskQuery.isError ? '—' : blockedTasks, icon: ListChecks, tone: 'text-[#B91C1C] bg-[#FEE2E2]' },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-[#D1D9E2] bg-white p-3 shadow-sm sm:p-4">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={17} aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block text-lg font-bold leading-5 text-[#1A202C]">{value}</span><span className="mt-1 block text-xs text-[#718096]">{label}</span></span>
              </div>
            ))}
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
            <section className="rounded-xl border border-[#D1D9E2] bg-white p-4 shadow-sm sm:p-5" aria-labelledby="project-task-preview-title">
              <header className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="project-task-preview-title" className="text-lg font-bold text-[#1A202C]">Project tasks</h2>
                  <p className="mt-0.5 text-sm text-[#718096]">A quick look at the team’s current work.</p>
                </div>
                <span className="rounded-full bg-[#E9EEF4] px-2.5 py-1 text-xs font-semibold text-[#1B3A5C]">{totalTasks}</span>
              </header>
              {taskQuery.isLoading ? <BikeLoader label="Loading project tasks" size={85} /> : taskQuery.isError ? (
                <p role="alert" className="rounded-lg bg-[#FEE2E2] p-3 text-sm text-[#B91C1C]">Project tasks could not be loaded.</p>
              ) : overviewTasks.length === 0 ? (
                <div className="rounded-xl bg-[#F5F6F8] p-6 text-center text-sm text-[#718096]">No tasks have been added to this project yet.</div>
              ) : (
                <div className="space-y-3">{overviewTasks.map((task) => <TaskPreview key={task.id} task={task} />)}</div>
              )}
              {totalTasks > overviewTasks.length && (
                <button type="button" onClick={() => setTab('tasks')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1B3A5C] hover:underline">
                  View all tasks <ArrowRight size={15} aria-hidden="true" />
                </button>
              )}
            </section>

            <section className="rounded-xl border border-[#D1D9E2] bg-white p-4 shadow-sm sm:p-5" aria-labelledby="project-members-title">
              <header className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="project-members-title" className="text-lg font-bold text-[#1A202C]">Group members</h2>
                  <p className="mt-0.5 text-sm text-[#718096]">People assigned to this project.</p>
                </div>
                <span className="rounded-full bg-[#E9EEF4] px-2.5 py-1 text-xs font-semibold text-[#1B3A5C]">{members.length}</span>
              </header>
              {members.length === 0 ? (
                <div className="rounded-xl bg-[#F5F6F8] p-5 text-center text-sm text-[#718096]">No team members are assigned yet.</div>
              ) : (
                <ul className="space-y-2.5">
                  {members.map((member) => {
                    const scrumMaster = member.role === 'Scrum Master'
                    return (
                      <li key={member.internId} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E7ECF1] bg-[#F8FAFC] p-3">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white ${scrumMaster ? 'bg-[#1B3A5C]' : 'bg-[#54708D]'}`}>{initials(member.name)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#1A202C]">{member.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#718096]">{scrumMaster ? 'Project lead' : member.role || 'Team member'}</span>
                        </span>
                        {scrumMaster && <span className="shrink-0 rounded-full bg-[#E9EEF4] px-2 py-1 text-[10px] font-bold text-[#1B3A5C]">Scrum Master</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'tasks' && <div className="rounded-xl border border-[#D1D9E2] bg-white p-4 shadow-sm sm:p-5"><ProjectTaskList projectId={project.id} /></div>}
      {tab === 'gantt' && <div className="rounded-xl border border-[#D1D9E2] bg-white p-4 shadow-sm"><GanttPage projectId={project.id} /></div>}
      {tab === 'calendar' && <div className="rounded-xl border border-[#D1D9E2] bg-white p-4 shadow-sm"><CalendarPage projectId={project.id} projectName={project.name} /></div>}
    </div>
  )
}

export default ProjectDetailPage
