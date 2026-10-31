import { useEffect, useMemo, useState } from 'react'
import { Tasks } from '@/api/services/tasks.service'
import { BikeLoader } from '@/components/ui/BikeLoader'

interface ApiTask {
  id: string
  title: string
  description?: string | null
  assigneeName?: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  blockedReason?: string | null
  approvedAt?: string | null
  dueDate?: string | null
  endDate?: string | null
}

const COLUMNS = ['To Do', 'In Progress', 'Done', 'Blocked'] as const
type Column = (typeof COLUMNS)[number]
const columnOf = (t: ApiTask): Column => (t.status === 'TODO' ? 'To Do' : t.status === 'IN_PROGRESS' ? 'In Progress' : t.status === 'BLOCKED' ? 'Blocked' : 'Done')
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
const due = (t: ApiTask) => {
  const d = (t.dueDate ?? t.endDate)?.slice(0, 10)
  return d ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${d}T12:00:00`)) : 'No due date'
}

export function ProjectTaskList({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    Tasks.getGanttData(projectId)
      .then((data) => { if (!cancelled) setTasks(data as ApiTask[]) })
      .catch(() => { if (!cancelled) { setTasks([]); setFailed(true) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => !q || t.title.toLowerCase().includes(q) || (t.assigneeName ?? '').toLowerCase().includes(q))
  }, [tasks, search])

  if (loading) return <BikeLoader label="Loading tasks" size={105} />
  if (failed) return <p role="alert" className="text-sm text-red-700">Tasks could not be loaded.</p>

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks"
        aria-label="Search tasks"
        className="mb-4 w-full max-w-xs rounded-full border border-transparent bg-[#f1f4fa] px-5 py-2.5 text-sm focus:border-[#0b2a5b] focus:bg-white focus:outline-none"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => columnOf(t) === col)
          return (
            <div key={col} className="rounded-2xl bg-[#f1f4fa] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-[#0f1b33]">{col}</span>
                <span className="text-xs text-[#55627a]">{items.length}</span>
              </div>
              {items.length === 0 && <p className="px-1 py-3 text-sm text-[#55627a]">No tasks</p>}
              {items.map((t) => (
                <div key={t.id} className="mb-2 rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-[#0f1b33]">{t.title}</p>
                  {t.description && <p className="text-xs text-[#55627a]">{t.description}</p>}
                  {t.status === 'BLOCKED' && t.blockedReason && <p className="mt-2 text-xs font-medium text-red-700">Blocked: {t.blockedReason}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#55627a]">
                    <span className="flex items-center gap-1.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0b2a5b] text-[10px] font-semibold text-white">
                        {initials(t.assigneeName ?? '?')}
                      </span>
                      {t.assigneeName ?? 'Unassigned'}
                    </span>
                    <span>{due(t)}</span>
                  </div>
                  {t.status === 'COMPLETED' && !t.approvedAt && (
                    <span className="mt-2 inline-block rounded-full bg-[#fdeccf] px-2.5 py-0.5 text-[11px] font-semibold text-[#b86200]">Awaiting approval</span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
