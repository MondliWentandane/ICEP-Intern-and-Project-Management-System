import { useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import type { NewProject } from '@/components/ui/CreateProjectButton'
import { teamError } from '@/features/projects/data/projectsApi'
import { useTeams } from '@/features/team-builder/data/teamsApi'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { ModalShell, FIELD, errorText } from './Shared'

function CreateDialog({ onCreate, onClose }: { onCreate: (p: NewProject) => Promise<unknown>; onClose: () => void }) {
  const { data: teams = [], isLoading } = useTeams()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [statement, setStatement] = useState('')
  const [teamId, setTeamId] = useState('')
  const [scrumId, setScrumId] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const team = teams.find((t: { id: string }) => t.id === teamId)
  const nameError = name.trim().length < 3 ? 'Enter a project name (at least 3 characters).' : ''
  const statementError = statement.trim().length < 20 ? 'Describe the problem in at least 20 characters.' : ''

  const next = (e: SyntheticEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (nameError || statementError) return
    setShowErrors(false)
    setStep(2)
  }

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    if (!team) { setShowErrors(true); return }
    const members = team.members.map((m: { internId: string }) => ({
      internId: m.internId,
      projectRole: m.internId === scrumId ? 'Scrum Master' : '',
    }))
    const invalid = teamError(members)
    if (invalid) {
      setError(typeof invalid === 'string' ? invalid : 'This team cannot be assigned. Check its members.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onCreate({ name: name.trim(), problemStatement: statement.trim(), groupName: team.name, members })
      onClose()
    } catch (cause) {
      setError(errorText(cause, 'The project could not be created. Please try again.'))
      setSaving(false)
    }
  }

  const cancel = (
    <button type="button" onClick={onClose} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Cancel</button>
  )

  return (
    <ModalShell title={step === 1 ? 'New project · Details' : 'New project · Team'} onClose={onClose}>
      {step === 1 ? (
        <form onSubmit={next} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="np-name" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Project name</label>
            <input id="np-name" value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
            {showErrors && nameError && <p className="mt-1 text-xs text-red-700">{nameError}</p>}
          </div>
          <div>
            <label htmlFor="np-statement" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Problem statement</label>
            <textarea id="np-statement" rows={5} value={statement} onChange={(e) => setStatement(e.target.value)} className={`${FIELD} resize-none`} />
            {showErrors && statementError && <p className="mt-1 text-xs text-red-700">{statementError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {cancel}
            <button type="submit" className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d]">Next</button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => void submit(e)} noValidate className="mt-5 space-y-4">
          {isLoading ? (
            <BikeLoader label="Loading teams" size={95} />
          ) : teams.length === 0 ? (
            <p className="rounded-2xl bg-[#f1f4fa] p-4 text-sm text-[#55627a]">
              No teams yet. <Link to="../team-builder" className="font-semibold text-[#0b2a5b] underline">Build a team</Link> first, then create the project.
            </p>
          ) : (
            <div role="radiogroup" aria-label="Team" className="space-y-2">
            {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={t.id === teamId}
                  onClick={() => { setTeamId(t.id); setScrumId('') }}
                  className={`w-full rounded-2xl border-2 px-4 py-3 text-left ${t.id === teamId ? 'border-[#0b2a5b] bg-[#f3f6fb]' : 'border-transparent bg-[#f1f4fa] hover:bg-[#e9eef7]'}`}
                >
                  <span className="block text-sm font-semibold text-[#0f1b33]">{t.name}</span>
                  <span className="block text-xs text-[#55627a]">{t.members.map((m) => m.name).join(', ')}</span>
                </button>
              ))}
            </div>
          )}
          {showErrors && !team && teams.length > 0 && <p className="text-xs text-red-700">Pick a team.</p>}

          {team && (
            <div>
              <label htmlFor="np-scrum" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">Scrum master (optional)</label>
              <select id="np-scrum" value={scrumId} onChange={(e) => setScrumId(e.target.value)} className={FIELD}>
                <option value="">No scrum master yet</option>
                {team.members.map((m) => <option key={m.internId} value={m.internId}>{m.name}</option>)}
              </select>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">Back</button>
            <button type="submit" disabled={saving || teams.length === 0} className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d] disabled:opacity-60">
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  )
}

export function CreateProjectFlow({ onCreate }: { onCreate: (p: NewProject) => Promise<unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-[#0b2a5b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#13397d]">
        Create project
      </button>
      {open && <CreateDialog onCreate={onCreate} onClose={() => setOpen(false)} />}
    </>
  )
}
