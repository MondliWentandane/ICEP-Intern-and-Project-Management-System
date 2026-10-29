import { useState, type JSX, type ReactNode } from 'react'
import { PageScaffold } from '@/components/ui/PageScaffold'
import { useMyProjects } from '@/features/projects/data/useMyProjects'
import { ProjectTaskList } from '@/features/tasks/pages/components/ProjectTaskList'

const PageScaffoldWithChildren = PageScaffold as unknown as (props: {
  title: string
  children?: ReactNode
}) => JSX.Element

export function InternTaskBoardPage() {
  const { data: projects = [], isLoading } = useMyProjects()
  const [selected, setSelected] = useState('')
  const projectId = projects.find((p: { id: string }) => p.id === selected)?.id ?? projects[0]?.id

  return (
    <PageScaffoldWithChildren title="Task board">
      {isLoading ? (
        <p className="text-[#55627a]">Loading…</p>
      ) : !projectId ? (
        <p className="rounded-3xl bg-[#f1f4fa] p-10 text-center text-[#55627a]">No project assigned yet.</p>
      ) : (
        <>
          {projects.length > 1 && (
            <select aria-label="Project" value={projectId} onChange={(e) => setSelected(e.target.value)} className="mb-4 rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <ProjectTaskList projectId={projectId} />
        </>
      )}
    </PageScaffoldWithChildren>
  )
}

export default InternTaskBoardPage