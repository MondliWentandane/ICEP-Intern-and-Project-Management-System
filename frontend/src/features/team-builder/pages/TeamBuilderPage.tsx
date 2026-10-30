import { useState, type SyntheticEvent, type JSX, type ReactNode } from 'react'
import { PageScaffold } from '@/components/ui/PageScaffold'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { TeamMemberPicker } from '@/features/projects/components/TeamMemberPicker'
import type { TeamMemberInput } from '@/features/projects/data/projectsApi'
import { ModalShell, FIELD, errorText } from '@/features/projects/components/Shared'
import { useDeleteTeam, useSaveTeam, useTeams, type Team } from '@/features/team-builder/data/teamsApi'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: {
  title: string
  children?: ReactNode
}) => JSX.Element

const AVATARS = ['#0b2a5b', '#2f5fa8', '#13397d', '#5b8bd6', '#4a78c4']
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

function TeamDialog({ team, onClose }: { team?: Team; onClose: () => void }) {
  const save = useSaveTeam()
  const [name, setName] = useState(team?.name ?? '')
  const [members, setMembers] = useState<TeamMemberInput[]>(
    team?.members.map((m) => ({ internId: m.internId, projectRole: '' })) ?? [],
  )
  const [showErrors, setShowErrors] = useState(false)
  const [error, setError] = useState('')

  const nameError = name.trim().length < 3 ? 'Enter a team name (at least 3 characters).' : ''
  const membersError = members.length < 2 ? 'Pick at least 2 interns.' : ''

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (nameError || membersError) return
    setError('')
    try {
      await save.mutateAsync({ id: team?.id, name: name.trim(), internIds: members.map((m) => m.internId) })
      onClose()
    } catch (cause) {
      setError(errorText(cause, 'The team could not be saved.'))
    }
  }

  return (
    <ModalShell title={team ? 'Edit team' : 'New team'} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Team name</label>
          <input id="team-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Group 7" className={FIELD} />
          {showErrors && nameError && <p className="mt-1 text-xs text-red-700">{nameError}</p>}
        </div>
        <TeamMemberPicker value={members} onChange={setMembers} showErrors={showErrors} />
        {showErrors && membersError && <p className="text-xs text-red-700">{membersError}</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
          <button type="submit" disabled={save.isPending} className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d] disabled:opacity-60">
            {save.isPending ? 'Saving…' : 'Save team'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

export function TeamBuilderPage() {
  const { data: teams = [], isLoading, isError } = useTeams()
  const remove = useDeleteTeam()
  const [dialog, setDialog] = useState<{ team?: Team } | null>(null)

  return (
    <PageScaffoldWithChildren title="Team builder">
      <div className="mb-6 flex justify-end">
        <button type="button" onClick={() => setDialog({})} className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d]">
          New team
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl bg-[#f1f4fa] p-6"><BikeLoader label="Loading teams" /></div>
      ) : isError ? (
        <p role="alert" className="rounded-3xl bg-red-50 p-10 text-center text-red-700">Teams could not be loaded.</p>
      ) : teams.length === 0 ? (
        <p className="rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">No teams yet. Click <b>New team</b> to build one.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t: Team) => (
            <div key={t.id} className="rounded-3xl bg-white p-5 shadow-[0_1px_3px_rgba(11,42,91,.08),0_14px_30px_rgba(11,42,91,.07)]">
              <h3 className="text-lg font-bold text-[#0f1b33]">{t.name}</h3>
              <p className="mb-3 text-sm text-[#55627a]">{t.members.length} members</p>
              <div className="flex">
                {t.members.slice(0, 5).map((m, i) => (
                  <span key={m.internId} title={m.name} className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white first:ml-0" style={{ background: AVATARS[i % AVATARS.length] }}>
                    {initials(m.name)}
                  </span>
                ))}
                {t.members.length > 5 && (
                  <span className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#8a97b0] text-[11px] font-semibold text-white">+{t.members.length - 5}</span>
                )}
              </div>
              <div className="mt-4 flex gap-2 border-t border-[#e7ecf4] pt-4">
                <button type="button" onClick={() => setDialog({ team: t })} className="flex-1 rounded-full bg-[#e9eef7] px-4 py-2 text-sm font-semibold text-[#0b2a5b] hover:bg-[#dbe5f5]">Edit</button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => window.confirm(`Delete ${t.name}?`) && remove.mutate(t.id)}
                  className="flex-1 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog && <TeamDialog team={dialog.team} onClose={() => setDialog(null)} />}
    </PageScaffoldWithChildren>
  )
}

export default TeamBuilderPage
