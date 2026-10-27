// Projects and their groups come from the database (features/projects/data/projectsApi.ts).
import { useEffect, useState, type FormEvent, type JSX, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageScaffold } from '@/components/ui/PageScaffold'
import CreateProjectButton, { type Group, type NewProject } from '@/components/ui/CreateProjectButton'
import { TeamMemberPicker } from '@/features/projects/components/TeamMemberPicker'
import {
  teamError, useCreateProject, useDeleteProject, useProjects, useUpdateProject,
  type ProjectRecord, type TeamMemberInput,
} from '@/features/projects/data/projectsApi'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: {
  title: string
  children?: ReactNode
}) => JSX.Element

export type Project = ProjectRecord

/** The project's group (name + member count), or undefined while nobody is assigned. */
const groupOf = (project: Project): Group | undefined =>
  project.members.length || project.groupName
    ? { id: project.id, name: project.groupName ?? 'Unnamed group', members: project.members.length }
    : undefined

const errorText = (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
  return data?.error ?? data?.message ?? fallback
}

const COVERS = [
  ['#0b2a5b', '#2f5fa8'],
  ['#13397d', '#5b8bd6'],
  ['#071b3f', '#1d4a99'],
  ['#2f5fa8', '#9cc0f2'],
  ['#0b2a5b', '#4a78c4'],
]
const AVATARS = ['#0b2a5b', '#2f5fa8', '#13397d', '#5b8bd6', '#4a78c4']

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

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
  const field =
    'w-full rounded-2xl border border-transparent bg-[#f1f4fa] px-4 py-3 text-sm text-[#0f1b33] focus:border-[#0b2a5b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20'

  const save = async (e: FormEvent) => {
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
    <Modal title="Edit project" onClose={onClose}>
      <form onSubmit={(e) => void save(e)} noValidate className="mt-5 space-y-4">
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
          <label htmlFor="edit-group" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Group name</label>
          <input id="edit-group" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Group 7" className={field} />
          {showErrors && groupError && <p className="mt-1 text-xs text-red-700">{groupError}</p>}
        </div>
        <TeamMemberPicker value={members} onChange={setMembers} currentProjectId={project.id} showErrors={showErrors} />
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d] disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------- delete ---------- */
function DeleteProjectDialog({ project, onConfirm, onClose, busy, error }: { project: Project; onConfirm: () => void; onClose: () => void; busy?: boolean; error?: string }) {
  return (
    <Modal title="Delete project?" onClose={onClose}>
      <p className="mt-3 text-sm text-[#55627a]">
        <b className="text-[#0f1b33]">{project.name}</b> will be permanently removed. This can't be undone.
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
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
  const members = group?.members ?? 0
  const shown = Math.min(members, 4)
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
      className="cursor-pointer overflow-hidden rounded-3xl bg-white shadow-[0_1px_3px_rgba(11,42,91,.08),0_14px_30px_rgba(11,42,91,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(11,42,91,.12),0_20px_40px_rgba(11,42,91,.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2a5b]"
    >
      <div className="relative flex h-36 items-end overflow-hidden p-5" style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/20" />
        <div className="absolute bottom-[-2.5rem] right-16 h-24 w-24 rounded-full bg-white/10" />
        <span className="relative text-5xl font-extrabold tracking-tight text-white">{initials(project.name)}</span>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-[#0f1b33]">{project.name}</h3>
        <p className="mb-3 text-sm text-[#55627a]">{group ? group.name : 'No group yet'}</p>

        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${group ? 'bg-[#dff3e7] text-[#1f8a4c]' : 'bg-[#fdeccf] text-[#b86200]'}`}>
            {group ? 'Active' : 'Pending'}
          </span>
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

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#d5dbe6]">
          <div className="h-full rounded-full bg-[#0b2a5b]" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-[#55627a]">
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
  const { pathname } = useLocation()
  const { data: projects = [], isLoading, isError, error, refetch } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState('')

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

  return (
    <PageScaffoldWithChildren title="Projects">
      <div className="mb-6 flex justify-end">
        <CreateProjectButton onCreate={handleCreate} />
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
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const group = groupOf(p)
            return (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                group={group}
                onOpen={() => navigate(`${pathname.replace(/\/$/, '')}/${p.id}`, { state: { project: p, group } })}
                onEdit={() => setEditing(p)}
                onDelete={() => { setDeleteError(''); setDeleting(p) }}
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