// Lists every intern from the database so a mentor can put them in a group and give each a role.
// An intern can be in several groups: the groups they are already in are shown under their name.
import { useState } from 'react'
import { PROJECT_ROLES, useTeamCandidates, type TeamMemberInput } from '@/features/projects/data/projectsApi'

type Props = {
  value: TeamMemberInput[]
  onChange: (members: TeamMemberInput[]) => void
  /** When editing, the project being edited (so it is not listed as "another group"). */
  currentProjectId?: string
  showErrors?: boolean
}

export function TeamMemberPicker({ value, onChange, currentProjectId, showErrors }: Props) {
  const { data: interns = [], isLoading, isError, refetch } = useTeamCandidates()
  const [search, setSearch] = useState('')
  const chosen = new Map(value.map((m) => [m.internId, m.projectRole]))

  const toggle = (internId: string) =>
    onChange(chosen.has(internId) ? value.filter((m) => m.internId !== internId) : [...value, { internId, projectRole: '' }])
  const setRole = (internId: string, projectRole: string) =>
    onChange(value.map((m) => (m.internId === internId ? { ...m, projectRole } : m)))

  const term = search.trim().toLowerCase()
  const visible = term
    ? interns.filter((i) => [i.name, i.email, i.studentNumber ?? ''].some((text) => text.toLowerCase().includes(term)))
    : interns

  const input =
    'w-full rounded-2xl border border-transparent bg-[#f1f4fa] px-4 py-3 text-sm text-[#0f1b33] placeholder:text-[#55627a] focus:border-[#0b2a5b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20'

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="member-search" className="block text-sm font-medium text-[#0f1b33]">Members</label>
        <span className="text-xs text-[#55627a]">{value.length} selected</span>
      </div>
      <input id="member-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interns by name, email or student number" className={`${input} mt-1.5`} />

      <div role="group" aria-label="Interns" className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
        {isLoading && <p className="text-sm text-[#55627a]">Loading interns…</p>}
        {isError && (
          <p className="text-sm text-red-700">
            Interns could not be loaded. <button type="button" onClick={() => void refetch()} className="font-semibold underline">Try again</button>
          </p>
        )}
        {!isLoading && !isError && visible.length === 0 && (
          <p className="text-sm text-[#55627a]">{interns.length ? 'No interns match your search.' : 'There are no active interns yet.'}</p>
        )}
        {visible.map((intern) => {
          const on = chosen.has(intern.id)
          const role = chosen.get(intern.id) ?? ''
          const otherGroups = intern.groups.filter((g) => g.projectId !== currentProjectId)
          return (
            <div key={intern.id} className={`rounded-2xl border-2 px-4 py-3 transition ${on ? 'border-[#0b2a5b] bg-[#f3f6fb]' : 'border-[#e1e7f0] hover:border-[#9cc0f2]'}`}>
              <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(intern.id)} className="flex w-full items-start justify-between gap-3 text-left">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#0f1b33]">{intern.name}</span>
                  <span className="block truncate text-xs text-[#55627a]">{intern.email}{intern.studentNumber ? ` · ${intern.studentNumber}` : ''}</span>
                </span>
                <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border-2 text-[11px] font-bold ${on ? 'border-[#0b2a5b] bg-[#0b2a5b] text-white' : 'border-[#c4cede] text-transparent'}`} aria-hidden="true">✓</span>
              </button>

              {otherGroups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs font-medium text-[#b86200]">Already in:</span>
                  {otherGroups.map((g) => (
                    <span key={g.projectId} className="rounded-full bg-[#fdeccf] px-2.5 py-0.5 text-xs font-semibold text-[#b86200]">
                      {g.groupName ? `${g.groupName} · ` : ''}{g.projectName}{g.role ? ` (${g.role})` : ''}
                    </span>
                  ))}
                </div>
              )}

              {on && (
                <div className="mt-2">
                  <label htmlFor={`role-${intern.id}`} className="sr-only">Role for {intern.name}</label>
                  <select id={`role-${intern.id}`} value={role} onChange={(e) => setRole(intern.id, e.target.value)}
                    className="w-full rounded-xl border border-[#d5dbe6] bg-white px-3 py-2 text-sm text-[#0f1b33] focus:border-[#0b2a5b] focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20">
                    <option value="">Choose a role…</option>
                    {PROJECT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    {role && !(PROJECT_ROLES as readonly string[]).includes(role) && <option value={role}>{role}</option>}
                  </select>
                  {showErrors && !role && <p className="mt-1 text-xs text-red-700">Choose a role for {intern.name}.</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TeamMemberPicker
