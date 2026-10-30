import { useMemo, useState, type FormEvent, type JSX, type ReactNode } from 'react'
import { Check, Plus, Search, UsersRound, X } from 'lucide-react'
import { PageScaffold } from '@/components/ui/PageScaffold'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { TeamMemberPicker } from '@/features/projects/components/TeamMemberPicker'
import { teamError, type TeamMemberInput } from '@/features/projects/data/projectsApi'
import { errorText } from '@/features/projects/components/Shared'
import { useDeleteTeam, useSaveTeam, useTeams, type Team, type TeamInput } from '@/features/team-builder/data/teamsApi'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: { title: string; children?: ReactNode }) => JSX.Element
const colors = ['#be123c', '#d97706', '#4f46e5', '#0891b2', '#0f766e', '#2563eb']
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'

function TeamEditor({
  team,
  onSave,
  onSaved,
  onDelete,
  deleting,
}: {
  team?: Team
  onSave: (input: TeamInput) => Promise<Team>
  onSaved: (team: Team) => void
  onDelete?: () => void
  deleting: boolean
}) {
  const [name, setName] = useState(team?.name ?? '')
  const [description, setDescription] = useState(team?.description ?? '')
  const [members, setMembers] = useState<TeamMemberInput[]>(team?.members.map((member) => ({
    internId: member.internId,
    projectRole: member.projectRole,
  })) ?? [])
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const nameError = name.trim().length < 3 ? 'Enter a team name with at least 3 characters.' : name.trim().length > 120 ? 'Keep the team name under 120 characters.' : ''
  const descriptionError = description.trim().length < 20 ? 'Add a description of at least 20 characters.' : ''
  const membersError = members.length < 2 ? 'Choose at least 2 team members.' : teamError(members)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    setError('')
    if (nameError || descriptionError || membersError) return

    setSaving(true)
    try {
      const saved = await onSave({
        ...(team ? { id: team.id } : {}),
        name: name.trim(),
        description: description.trim(),
        members,
      })
      onSaved(saved)
    } catch (cause) {
      setError(errorText(cause, 'The team could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex min-h-[620px] flex-col">
      <header className="border-b border-[#edf0f5] px-6 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#172033]">{team ? 'Edit team' : 'Create team'}</h2>
            <p className="mt-1 text-sm text-[#748198]">Save a team now, then select it when you create a project.</p>
          </div>
          {team && onDelete && (
            <button type="button" onClick={onDelete} disabled={deleting || saving} aria-label={`Delete ${team.name}`} title="Delete team" className="rounded-lg p-2 text-[#8b96a7] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
        <div>
          <label htmlFor="team-name" className="mb-1.5 block text-sm font-semibold text-[#35445c]">Team name</label>
          <input id="team-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Name your team" className="w-full rounded-xl border border-[#e6eaf0] bg-[#f8f9fc] px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#9aa5b6] focus:border-[#315bb6] focus:bg-white focus:ring-4 focus:ring-[#315bb6]/10" />
          {showErrors && nameError && <p className="mt-1.5 text-xs text-red-700">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="team-description" className="mb-1.5 block text-sm font-semibold text-[#35445c]">Description</label>
          <textarea id="team-description" rows={3} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the focus of this team" className="w-full resize-y rounded-xl border border-[#e6eaf0] bg-[#f8f9fc] px-4 py-3 text-sm leading-6 text-[#172033] outline-none transition placeholder:text-[#9aa5b6] focus:border-[#315bb6] focus:bg-white focus:ring-4 focus:ring-[#315bb6]/10" />
          {showErrors && descriptionError && <p className="mt-1.5 text-xs text-red-700">{descriptionError}</p>}
        </div>

        <TeamMemberPicker value={members} onChange={setMembers} showErrors={showErrors} />
        {showErrors && membersError && <p role="alert" className="-mt-3 text-xs text-red-700">{membersError}</p>}
        <p className="text-xs leading-5 text-[#748198]">Assign one Scrum Master and a role to every intern. These assignments will carry over when you select this team for a project.</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      </div>

      <footer className="flex justify-end border-t border-[#edf0f5] px-6 py-4 sm:px-8">
        <button type="submit" disabled={saving || deleting} className="inline-flex items-center gap-2 rounded-xl bg-[#284fba] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c409f] disabled:cursor-wait disabled:opacity-60">
          {team ? <Check size={16} /> : <Plus size={16} />}
          {saving ? 'Saving…' : team ? 'Save changes' : 'Create team'}
        </button>
      </footer>
    </form>
  )
}

export function TeamBuilderPage() {
  const { data: teams = [], isLoading, isError, error, refetch } = useTeams()
  const save = useSaveTeam()
  const remove = useDeleteTeam()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(true)
  const [notice, setNotice] = useState('')

  const visibleTeams = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? teams.filter((team) => team.name.toLowerCase().includes(term)) : teams
  }, [teams, search])
  const selectedTeam = teams.find((team) => team.id === selectedId)

  const startCreating = () => {
    setSelectedId(null)
    setCreating(true)
    setNotice('')
  }

  const handleSave = async (input: TeamInput) => save.mutateAsync(input)
  const handleSaved = (team: Team) => {
    setSelectedId(team.id)
    setCreating(false)
    setNotice(`“${team.name}” is saved and can now be selected when creating a project.`)
  }
  const handleDelete = async (team: Team) => {
    if (!window.confirm(`Delete the reusable team “${team.name}”?`)) return
    setNotice('')
    try {
      await remove.mutateAsync(team.id)
      startCreating()
      setNotice(`“${team.name}” was deleted.`)
    } catch (cause) {
      setNotice(errorText(cause, 'The team could not be deleted.'))
    }
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
                  <p className="mt-1 text-xs text-[#8490a3]">{teams.length} saved {teams.length === 1 ? 'team' : 'teams'}</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf2ff] text-[#315bb6]" aria-hidden="true"><UsersRound size={18} /></span>
              </div>
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" aria-hidden="true" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams" aria-label="Search teams" className="w-full rounded-xl border border-[#e7eaf0] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#9aa5b6] focus:border-[#315bb6] focus:ring-4 focus:ring-[#315bb6]/10" />
              </label>
              <button type="button" onClick={startCreating} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#284fba] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c409f]"><Plus size={16} /> New team</button>
            </div>

            <div className="max-h-[490px] space-y-1 overflow-y-auto px-3 pb-4 sm:px-4" role="listbox" aria-label="Saved teams">
              {isLoading && <div className="py-8"><BikeLoader label="Loading teams" size={100} /></div>}
              {isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorText(error, 'Teams could not be loaded.')}{' '}<button type="button" onClick={() => void refetch()} className="font-semibold underline">Try again</button></div>}
              {!isLoading && !isError && visibleTeams.length === 0 && <p className="px-3 py-8 text-center text-sm text-[#8490a3]">{teams.length ? 'No teams match your search.' : 'No teams yet. Create one to use it on a project.'}</p>}
              {visibleTeams.map((team, index) => (
                <button type="button" role="option" aria-selected={!creating && selectedId === team.id} key={team.id} onClick={() => { setSelectedId(team.id); setCreating(false); setNotice('') }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${!creating && selectedId === team.id ? 'bg-[#edf2ff] ring-1 ring-inset ring-[#cbd8fa]' : 'hover:bg-[#f1f4f8]'}`}>
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full text-sm font-bold text-white" style={{ background: colors[index % colors.length] }} aria-hidden="true">{initials(team.name).slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#26364e]">{team.name}</span>
                    <span className="block text-xs text-[#8a95a7]">{team.members.length} {team.members.length === 1 ? 'member' : 'members'}</span>
                  </span>
                  <span className="text-xs font-medium text-[#8792a3]">›</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 bg-white">
            {notice && <p role="status" className="mx-6 mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-8">{notice}</p>}
            <TeamEditor
              key={creating || !selectedTeam ? 'new-team' : selectedTeam.id}
              team={!creating ? selectedTeam : undefined}
              onSave={handleSave}
              onSaved={handleSaved}
              onDelete={!creating && selectedTeam ? () => void handleDelete(selectedTeam) : undefined}
              deleting={remove.isPending}
            />
          </div>
        </div>
      </section>
    </PageScaffoldWithChildren>
  )
}

export default TeamBuilderPage
