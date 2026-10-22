// TODO: Implement the Figma screen and connect the matching feature service.
import { useEffect, useMemo, useState, type FormEvent, type JSX, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageScaffold } from '@/components/ui/PageScaffold'
import CreateProjectButton, { type Group, type Id, type NewProject } from '@/components/ui/CreateProjectButton'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: {
  title: string
  children?: ReactNode
}) => JSX.Element

// category and campus are optional: projects without a category are grouped under "Projects".
export type Project = NewProject & {
  id: number
  progress: number
  category?: string
  campus?: string
}

type Status = 'Active' | 'Pending' | 'Completed'

// TODO: replace with groups from your Team Builder feature service.
const GROUPS: Group[] = [
  { id: 1, name: 'Group 1', members: 3 },
  { id: 2, name: 'Group 2', members: 5 },
  { id: 7, name: 'Group 7', members: 4 },
]

const COVERS = [
  ['#0b2a5b', '#2f5fa8'],
  ['#13397d', '#5b8bd6'],
  ['#071b3f', '#1d4a99'],
  ['#2f5fa8', '#9cc0f2'],
  ['#0b2a5b', '#4a78c4'],
]
const COVER_HEIGHTS = [190, 130, 160, 150, 200, 170, 140]
const AVATARS = ['#0b2a5b', '#2f5fa8', '#13397d', '#5b8bd6', '#4a78c4']

const BADGE: Record<Status, string> = {
  Active: 'bg-[#dff3e7] text-[#1f8a4c]',
  Pending: 'bg-[#fdeccf] text-[#b86200]',
  Completed: 'bg-[#e0eafa] text-[#2f5fa8]',
}

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

const statusOf = (p: Project, group?: Group): Status =>
  p.progress >= 100 ? 'Completed' : group ? 'Active' : 'Pending'

const pill =
  'rounded-full border border-transparent bg-[#f1f4fa] px-5 py-3 text-sm text-[#0f1b33] focus:border-[#0b2a5b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20'

/* ---------- shared modal ---------- */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#0f1b33]">{title}</h2>
        {children}
      </div>
    </div>
  )
}

/* ---------- edit ---------- */
function EditProjectDialog({
  project, groups, onSave, onClose,
}: { project: Project; groups: Group[]; onSave: (p: Project) => void; onClose: () => void }) {
  const [name, setName] = useState(project.name)
  const [statement, setStatement] = useState(project.problemStatement)
  const [groupId, setGroupId] = useState<Id | null>(project.groupId)
  const [showErrors, setShowErrors] = useState(false)

  const nameError = name.trim().length < 3 ? 'Enter a project name (at least 3 characters).' : ''
  const statementError = statement.trim().length < 20 ? 'Describe the problem in at least 20 characters.' : ''
  const field =
    'w-full rounded-2xl border border-transparent bg-[#f1f4fa] px-4 py-3 text-sm text-[#0f1b33] focus:border-[#0b2a5b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20'

  const save = (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (nameError || statementError) return
    onSave({ ...project, name: name.trim(), problemStatement: statement.trim(), groupId })
  }

  return (
    <Modal title="Edit project" onClose={onClose}>
      <form onSubmit={save} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Project name</label>
          <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          {showErrors && nameError && <p className="mt-1 text-xs text-red-700">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="edit-statement" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Problem statement</label>
          <textarea id="edit-statement" rows={5} value={statement} onChange={(e) => setStatement(e.target.value)} className={`${field} resize-none`} />
          {showErrors && statementError && <p className="mt-1 text-xs text-red-700">{statementError}</p>}
        </div>
        <div>
          <label htmlFor="edit-group" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Group</label>
          <select
            id="edit-group"
            value={groupId === null ? '' : String(groupId)}
            onChange={(e) => setGroupId(groups.find((g) => String(g.id) === e.target.value)?.id ?? null)}
            className={field}
          >
            <option value="">Not assigned</option>
            {groups.map((g) => (
              <option key={g.id} value={String(g.id)}>{g.name} ({g.members} members)</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
          <button type="submit" className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d]">Save changes</button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------- delete ---------- */
function DeleteProjectDialog({ project, onConfirm, onClose }: { project: Project; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal title="Delete project?" onClose={onClose}>
      <p className="mt-3 text-sm text-[#55627a]">
        <b className="text-[#0f1b33]">{project.name}</b> will be permanently removed. This can't be undone.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
        <button type="button" onClick={onConfirm} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800">Delete</button>
      </div>
    </Modal>
  )
}

/* ---------- card ---------- */
function ProjectCard({ project, index, group, onOpen, onEdit, onDelete }: {
  project: Project; index: number; group?: Group
  onOpen: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [from, to] = COVERS[index % COVERS.length]
  const height = COVER_HEIGHTS[index % COVER_HEIGHTS.length]
  const members = group?.members ?? 0
  const shown = Math.min(members, 4)
  const status = statusOf(project, group)

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open ${project.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="mb-[18px] cursor-pointer break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-[0_1px_3px_rgba(11,42,91,.08),0_14px_30px_rgba(11,42,91,.07)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_2px_4px_rgba(11,42,91,.1),0_22px_40px_rgba(11,42,91,.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2a5b]"
    >
      <div
        className="relative flex items-end overflow-hidden px-[18px] py-4"
        style={{ height, backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/20" />
        <div className="absolute bottom-[-2.5rem] right-16 h-24 w-24 rounded-full bg-white/10" />
        <span className="relative text-5xl font-extrabold tracking-tight text-white">{initials(project.name)}</span>
      </div>

      <div className="px-[18px] pb-[18px] pt-3.5">
        <h3 className="text-[17px] font-bold text-[#0f1b33]">{project.name}</h3>
        <p className="mb-2.5 mt-0.5 text-[13px] text-[#55627a]">{group ? group.name : 'No group yet'}</p>

        <div className="flex items-center justify-between gap-2">
          <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status]}`}>{status}</span>
          {/* TODO: replace the placeholder letters with real member initials */}
          <div className="flex">
            {Array.from({ length: shown }).map((_, i) => (
              <span key={i} className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white first:ml-0" style={{ background: AVATARS[i % AVATARS.length] }}>
                {'ABCD'[i]}
              </span>
            ))}
            {members > 4 && (
              <span className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#8a97b0] text-[11px] font-semibold text-white">+{members - 4}</span>
            )}
          </div>
        </div>

        <div className="mb-1.5 mt-3 h-1.5 overflow-hidden rounded-full bg-[#d5dbe6]">
          <div className="h-full rounded-full bg-[#0b2a5b]" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="flex justify-between text-[13px] text-[#55627a]">
          <span>{project.progress > 0 ? `${project.progress}% complete` : 'Not started'}</span>
          <span>{members > 0 ? `${members} members` : 'No members'}</span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-[#55627a]">{project.problemStatement}</p>

        <div className="mt-4 flex gap-2 border-t border-[#e7ecf4] pt-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="flex-1 rounded-full bg-[#e9eef7] px-4 py-2 text-sm font-semibold text-[#0b2a5b] hover:bg-[#dbe5f5]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-1 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- page ---------- */
export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [campusFilter, setCampusFilter] = useState('all')

  const handleCreate = (project: NewProject) => {
    // TODO: save through your projects service, then update the list from its response.
    setProjects((list) => [{ ...project, id: Date.now(), progress: 0 }, ...list])
  }

  const handleSave = (updated: Project) => {
    // TODO: update through your projects service.
    setProjects((list) => list.map((p) => (p.id === updated.id ? updated : p)))
    setEditing(null)
  }

  const handleDelete = () => {
    if (!deleting) return
    // TODO: delete through your projects service.
    setProjects((list) => list.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  const campuses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.campus).filter((c): c is string => !!c))),
    [projects],
  )

  // Filter, then group by category (keeps each project's original index for its cover).
  const sections = useMemo(() => {
    const q = search.trim().toLowerCase()
    const map = new Map<string, { project: Project; index: number }[]>()
    projects.forEach((project, index) => {
      const group = GROUPS.find((g) => g.id === project.groupId)
      if (q && !project.name.toLowerCase().includes(q) && !(group?.name.toLowerCase().includes(q))) return
      if (statusFilter !== 'all' && statusOf(project, group) !== statusFilter) return
      if (campusFilter !== 'all' && project.campus !== campusFilter) return
      const key = project.category ?? 'Projects'
      map.set(key, [...(map.get(key) ?? []), { project, index }])
    })
    return Array.from(map.entries())
  }, [projects, search, statusFilter, campusFilter])

  return (
    <PageScaffoldWithChildren title="Projects">
      <p className="mb-5 text-base text-[#55627a]">Admins see every project. Mentors see only their own.</p>

      <div className="mb-2 flex flex-wrap items-center gap-2.5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project or group name"
          aria-label="Search projects"
          className={`${pill} min-w-[180px] flex-1`}
        />
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)} className={pill}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
        <select aria-label="Campus" value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className={pill}>
          <option value="all">All campuses</option>
          {campuses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <CreateProjectButton groups={GROUPS} onCreate={handleCreate} />
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">
          No projects yet. Click <b>Create project</b> to add one.
        </p>
      ) : sections.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">No projects match your filters.</p>
      ) : (
        sections.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3.5 mt-8 flex items-center gap-2.5 text-xl font-bold text-[#0f1b33]">
              {category}
              <span className="text-[13px] font-normal text-[#55627a]">
                {items.length} {items.length === 1 ? 'project' : 'projects'}
              </span>
            </h2>
            <div className="columns-1 gap-[18px] sm:columns-2 lg:columns-3">
              {items.map(({ project, index }) => {
                const group = GROUPS.find((g) => g.id === project.groupId)
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    group={group}
                    onOpen={() => navigate(String(project.id), { state: { project, group } })}
                    onEdit={() => setEditing(project)}
                    onDelete={() => setDeleting(project)}
                  />
                )
              })}
            </div>
          </section>
        ))
      )}

      {editing && <EditProjectDialog project={editing} groups={GROUPS} onSave={handleSave} onClose={() => setEditing(null)} />}
      {deleting && <DeleteProjectDialog project={deleting} onConfirm={handleDelete} onClose={() => setDeleting(null)} />}
    </PageScaffoldWithChildren>
  )
}

export default ProjectsPage