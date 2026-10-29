import { useMemo, useState, type SyntheticEvent, type JSX, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageScaffold } from '@/components/ui/PageScaffold'
import type { Group, NewProject } from '@/components/ui/CreateProjectButton'
import { TeamMemberPicker } from '@/features/projects/components/TeamMemberPicker'
import { CreateProjectFlow } from '@/features/projects/components/CreateProjectFlow'
import { ModalShell, FIELD, errorText } from '@/features/projects/components/Shared'
import {
  teamError, useCreateProject, useDeleteProject, useProjects, useUpdateProject,
  type ProjectRecord, type TeamMemberInput,
} from '@/features/projects/data/projectsApi'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: {
  title: string
  children?: ReactNode
}) => JSX.Element

export type Project = ProjectRecord
type Status = 'Active' | 'Pending' | 'Completed'

/** The project's group (name + member count), or undefined while nobody is assigned. */
const groupOf = (project: Project): Group | undefined =>
  project.members.length || project.groupName
    ? { id: project.id, name: project.groupName ?? 'Unnamed group', members: project.members.length }
    : undefined

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

/* ---------- edit ---------- */
function EditProjectDialog({
  project, onSave, onClose,
}: { project: Project; onSave: (p: NewProject & { id: string }) => Promise<unknown>; onClose: () => void }) {
  const [name, setName] = useState(project.name)
  const [statement, setStatement] = useState(project.problemStatement)
  const [groupName, setGroupName] = useState(project.groupName ?? '')
  const [members, setMembers] = useState<TeamMemberInput[]>(project.members.map((m) => ({ internId: m.internId, projectRole: m.role ?? '' })))
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const nameError = name.trim().length < 3 ? 'Enter a project name (at least 3 characters).' : ''
  const statementError = statement.trim().length < 20 ? 'Describe the problem in at least 20 characters.' : ''
  const groupError = members.length > 0 && !groupName.trim() ? 'Give the group a name.' : ''

  const save = async (e: SyntheticEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (nameError || statementError || groupError || teamError(members)) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave({ id: project.id, name: name.trim(), problemStatement: statement.trim(), groupName: groupName.trim(), members })
    } catch (error) {
      setSaveError(errorText(error, 'Your changes could not be saved. Please try again.'))
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Edit project" onClose={onClose}>
      <form onSubmit={(e) => void save(e)} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Project name</label>
          <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
          {showErrors && nameError && <p className="mt-1 text-xs text-red-700">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="edit-statement" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Problem statement</label>
          <textarea id="edit-statement" rows={5} value={statement} onChange={(e) => setStatement(e.target.value)} className={`${FIELD} resize-none`} />
          {showErrors && statementError && <p className="mt-1 text-xs text-red-700">{statementError}</p>}
        </div>
        <div>
          <label htmlFor="edit-group" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Group name</label>
          <input id="edit-group" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Group 7" className={FIELD} />
          {showErrors && groupError && <p className="mt-1 text-xs text-red-700">{groupError}</p>}
        </div>
        <TeamMemberPicker value={members} onChange={setMembers} currentProjectId={project.id} showErrors={showErrors} />
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d] disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </ModalShell>
  )
}

/* ---------- delete ---------- */
function DeleteProjectDialog({ project, onConfirm, onClose, busy, error }: { project: Project; onConfirm: () => void; onClose: () => void; busy?: boolean; error?: string }) {
  return (
    <ModalShell title="Delete project?" onClose={onClose}>
      <p className="mt-3 text-sm text-[#55627a]">
        <b className="text-[#0f1b33]">{project.name}</b> will be permanently removed. This can't be undone.
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
      </div>
    </ModalShell>
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
  const scrum = project.members.find((m) => m.role === 'Scrum Master')?.name

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
        <p className="mb-2.5 mt-0.5 text-[13px] text-[#55627a]">
          {group ? group.name : 'No group yet'}{scrum ? ` · Scrum master: ${scrum}` : ''}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status]}`}>{status}</span>
          <div className="flex">
            {project.members.slice(0, shown).map((member, i) => (
              <span key={member.internId} title={`${member.name}${member.role ? ` – ${member.role}` : ''}`} className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white first:ml-0" style={{ background: AVATARS[i % AVATARS.length] }}>
                {initials(member.name)}
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
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit() }} className="flex-1 rounded-full bg-[#e9eef7] px-4 py-2 text-sm font-semibold text-[#0b2a5b] hover:bg-[#dbe5f5]">Edit</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete() }} className="flex-1 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- page ---------- */
export function ProjectsPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: projects = [], isLoading, isError, error, refetch } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')

  // Saved to the database; each assigned intern is notified of their group and role.
  const handleCreate = (project: NewProject) => createProject.mutateAsync(project)

  const handleSave = async (updated: NewProject & { id: string }) => {
    await updateProject.mutateAsync(updated)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteError('')
    try {
      await deleteProject.mutateAsync(deleting.id)
      setDeleting(null)
    } catch (cause) {
      setDeleteError(errorText(cause, 'The project could not be deleted.'))
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects
      .map((project, index) => ({ project, index }))
      .filter(({ project }) => {
        if (q && !project.name.toLowerCase().includes(q) && !(project.groupName ?? '').toLowerCase().includes(q)) return false
        if (statusFilter !== 'all' && statusOf(project, groupOf(project)) !== statusFilter) return false
        return true
      })
  }, [projects, search, statusFilter])

  return (
    <PageScaffoldWithChildren title="Projects">
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
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
        <CreateProjectFlow onCreate={handleCreate} />
      </div>

      {isLoading ? (
        <p className="rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">Loading projects…</p>
      ) : isError ? (
        <p role="alert" className="rounded-3xl bg-red-50 p-10 text-center text-red-700">
          {errorText(error, 'Projects could not be loaded.')}{' '}
          <button type="button" onClick={() => void refetch()} className="font-semibold underline">Try again</button>
        </p>
      ) : projects.length === 0 ? (
        <p className="rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">
          No projects yet. Click <b>Create project</b> to add one.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">No projects match your filters.</p>
      ) : (
        <div className="columns-1 gap-[18px] sm:columns-2 lg:columns-3">
          {visible.map(({ project, index }) => {
            const group = groupOf(project)
            return (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                group={group}
                onOpen={() => navigate(`${pathname.replace(/\/$/, '')}/${project.id}`, { state: { project, group } })}
                onEdit={() => setEditing(project)}
                onDelete={() => { setDeleteError(''); setDeleting(project) }}
              />
            )
          })}
        </div>
      )}

      {editing && <EditProjectDialog project={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      {deleting && <DeleteProjectDialog project={deleting} onConfirm={() => void handleDelete()} onClose={() => setDeleting(null)} busy={deleteProject.isPending} error={deleteError} />}
    </PageScaffoldWithChildren>
  )
}

export default ProjectsPage