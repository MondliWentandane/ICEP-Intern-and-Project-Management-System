import { useMemo, useState, type FormEvent, type JSX, type ReactNode } from 'react'
import { Check, Plus, Search, UsersRound } from 'lucide-react'
import { PageScaffold } from '@/components/ui/PageScaffold'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { TeamMemberPicker } from '@/features/projects/components/TeamMemberPicker'
import type { TeamMemberInput } from '@/features/projects/data/projectsApi'
import { teamError, useCreateProject, useProjects, useUpdateProject, type ProjectInput, type ProjectRecord } from '@/features/projects/data/projectsApi'
import { errorText } from '@/features/projects/components/Shared'
import { useAuth } from '@/hooks/useAuth'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: {
  title: string
  children?: ReactNode
}) => JSX.Element

const avatarColors = ['#be123c', '#d97706', '#4f46e5', '#0891b2', '#0f766e', '#2563eb']
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('')

function TeamEditor({
  project,
  onSave,
  onSaved,
  onCancel,
  showCancel,
}: {
  project?: ProjectRecord
  onSave: (input: ProjectInput & { id?: string }) => Promise<ProjectRecord>
  onSaved: (project: ProjectRecord) => void
  onCancel: () => void
  showCancel: boolean
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.problemStatement ?? '')
  const [members, setMembers] = useState<TeamMemberInput[]>(
    project?.members.map((member) => ({ internId: member.internId, projectRole: member.role ?? '' })) ?? [],
  )
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const nameError = name.trim().length < 3 ? 'Enter a team name with at least 3 characters.' : name.trim().length > 120 ? 'Keep the team name under 120 characters.' : ''
  const descriptionError = description.trim().length < 20 ? 'Add a description of at least 20 characters.' : ''
  const memberError = members.length < 2 ? 'Choose at least 2 team members.' : teamError(members)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    setError('')
    setSuccess('')
    if (nameError || descriptionError || memberError) return

    setSaving(true)
    try {
      const saved = await onSave({
        ...(project ? { id: project.id } : {}),
        name: name.trim(),
        problemStatement: description.trim(),
        groupName: project?.groupName ?? '',
        members,
      })
      setSuccess(project ? 'Team updated successfully.' : 'Team created successfully.')
      onSaved(saved)
    } catch (cause) {
      setError(errorText(cause, 'The team could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex min-h-[620px] flex-col">
      <div className="border-b border-[#edf0f5] px-6 py-5 sm:px-8">
        <h2 className="text-lg font-bold text-[#172033]">{project ? 'Edit team' : 'Create team'}</h2>
        <p className="mt-1 text-sm text-[#748198]">Describe the project team, pick active interns and assign their roles.</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
        <div>
          <label htmlFor="team-name" className="mb-1.5 block text-sm font-semibold text-[#35445c]">Team name</label>
          <input
            id="team-name"
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name your team"
            className="w-full rounded-xl border border-[#e6eaf0] bg-[#f8f9fc] px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#9aa5b6] focus:border-[#315bb6] focus:bg-white focus:ring-4 focus:ring-[#315bb6]/10"
          />
          {showErrors && nameError && <p className="mt-1.5 text-xs text-red-700">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="team-description" className="mb-1.5 block text-sm font-semibold text-[#35445c]">Description</label>
          <textarea
            id="team-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the project and what the team will work on"
            className="w-full resize-y rounded-xl border border-[#e6eaf0] bg-[#f8f9fc] px-4 py-3 text-sm leading-6 text-[#172033] outline-none transition placeholder:text-[#9aa5b6] focus:border-[#315bb6] focus:bg-white focus:ring-4 focus:ring-[#315bb6]/10"
          />
          {showErrors && descriptionError && <p className="mt-1.5 text-xs text-red-700">{descriptionError}</p>}
        </div>

        <TeamMemberPicker value={members} onChange={setMembers} currentProjectId={project?.id} showErrors={showErrors} />
        {showErrors && memberError && <p role="alert" className="-mt-3 text-xs text-red-700">{memberError}</p>}
        <p className="text-xs leading-5 text-[#748198]">Choose exactly one Scrum Master. Saving creates or updates a project with these team members.</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[#edf0f5] px-6 py-4 sm:px-8">
        {showCancel && <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#56647a] transition hover:bg-[#f3f5f8]">Cancel</button>}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#214db4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193f9d] disabled:cursor-wait disabled:opacity-60">
          {project ? <Check size={16} /> : <Plus size={16} />}
          {saving ? 'Saving…' : project ? 'Save changes' : 'Create team'}
        </button>
      </div>
    </form>
  )
}

export function TeamBuilderPage() {
  const { user } = useAuth()
  const { data: projects = [], isLoading, isError, error, refetch } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(true)
  const [savedProject, setSavedProject] = useState<ProjectRecord | null>(null)

  const availableProjects = useMemo(() => user?.role === 'ADMIN'
    ? projects
    : projects.filter((project) => project.canManage), [projects, user?.role])
  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return availableProjects
    return availableProjects.filter((project) =>
      project.name.toLowerCase().includes(term) || (project.groupName ?? '').toLowerCase().includes(term),
    )
  }, [availableProjects, search])
  const selectedProject = availableProjects.find((project) => project.id === selectedId)
    ?? (savedProject?.id === selectedId ? savedProject : undefined)

  const saveProject = async (input: ProjectInput & { id?: string }) => {
    if (input.id) return updateProject.mutateAsync({ ...input, id: input.id })
    return createProject.mutateAsync(input)
  }

  const startCreating = () => {
    setSelectedId(null)
    setSavedProject(null)
    setCreating(true)
  }

  const handleSaved = (project: ProjectRecord) => {
    setSelectedId(project.id)
    setSavedProject(project)
    setCreating(false)
  }

  return (
    <PageScaffoldWithChildren title="Team builder">
      <section className="overflow-hidden rounded-2xl border border-[#e7eaf0] bg-white shadow-[0_8px_28px_rgba(20,35,60,.07)]">
        <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[minmax(260px,.82fr)_minmax(0,1.35fr)]">
          <aside className="border-b border-[#e7eaf0] bg-[#fcfcfd] lg:border-b-0 lg:border-r" aria-labelledby="all-teams-title">
            <div className="px-5 py-5 sm:px-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="all-teams-title" className="text-lg font-bold text-[#172033]">All teams</h2>
                  <p className="mt-1 text-xs text-[#8490a3]">{availableProjects.length} project {availableProjects.length === 1 ? 'team' : 'teams'}</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf2ff] text-[#315bb6]" aria-hidden="true"><UsersRound size={18} /></span>
              </div>

              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search teams"
                  aria-label="Search teams"
                  className="w-full rounded-xl border border-[#e7eaf0] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#9aa5b6] focus:border-[#315bb6] focus:ring-4 focus:ring-[#315bb6]/10"
                />
              </label>

              <button type="button" onClick={startCreating} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#284fba] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c409f]">
                <Plus size={16} /> New team
              </button>
            </div>

            <div className="max-h-[490px] space-y-1 overflow-y-auto px-3 pb-4 sm:px-4" role="listbox" aria-label="Project teams">
              {isLoading && <div className="py-8"><BikeLoader label="Loading teams" size={100} /></div>}
              {isError && (
                <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {errorText(error, 'Teams could not be loaded.')}{' '}
                  <button type="button" onClick={() => void refetch()} className="font-semibold underline">Try again</button>
                </div>
              )}
              {!isLoading && !isError && visibleProjects.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-[#8490a3]">{availableProjects.length ? 'No teams match your search.' : 'No project teams yet. Create one to get started.'}</p>
              )}
              {visibleProjects.map((project, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={!creating && selectedId === project.id}
                  key={project.id}
                  onClick={() => { setSelectedId(project.id); setSavedProject(null); setCreating(false) }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${!creating && selectedId === project.id ? 'bg-[#edf2ff] ring-1 ring-inset ring-[#cbd8fa]' : 'hover:bg-[#f1f4f8]'}`}
                >
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full text-sm font-bold text-white" style={{ background: avatarColors[index % avatarColors.length] }} aria-hidden="true">
                    {initials(project.groupName || project.name).slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#26364e]">{project.groupName || project.name}</span>
                    <span className="block text-xs text-[#8a95a7]">{project.members.length} {project.members.length === 1 ? 'member' : 'members'}</span>
                  </span>
                  <span className="text-xs font-medium text-[#8792a3]">›</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 bg-white">
            {creating || !selectedProject ? (
              <TeamEditor
                key="new-team"
                onSave={saveProject}
                onSaved={handleSaved}
                onCancel={() => selectedId ? setCreating(false) : undefined}
                showCancel={Boolean(selectedProject)}
              />
            ) : (
              <TeamEditor
                key={selectedProject.id}
                project={selectedProject}
                onSave={saveProject}
                onSaved={handleSaved}
                onCancel={startCreating}
                showCancel
              />
            )}
          </div>
        </div>
      </section>
    </PageScaffoldWithChildren>
  )
}

export default TeamBuilderPage
