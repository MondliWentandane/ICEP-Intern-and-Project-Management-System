import { useQuery } from '@tanstack/react-query'
import { Projects } from '@/api/services/projects.service'
import { useAuth } from '@/hooks/useAuth'

interface RawProject {
    id: string
    name: string
    groupName?: string | null
    assignments?: Array<{ projectRole?: string | null; intern?: { user?: { id?: string } } }>
}

export function useMyProjects() {
    const { user } = useAuth()
    return useQuery({
        queryKey: ['projects', 'mine', user?.id],
        enabled: Boolean(user?.id),
        queryFn: async () => {
            const body = (await Projects.list()) as unknown
            const all = (Array.isArray(body) ? body : (body as { data: RawProject[] }).data) as RawProject[]
            return all.flatMap((p) => {
                const mine = p.assignments?.find((a) => a.intern?.user?.id === user?.id)
                return mine ? [{ id: p.id, name: p.name, groupName: p.groupName ?? null, role: mine.projectRole ?? null }] : []
            })
        },
    })
}