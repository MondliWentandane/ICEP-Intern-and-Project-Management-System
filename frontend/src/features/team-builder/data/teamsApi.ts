import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient as api } from '@/api/client'
import { tokenStorage } from '@/utils/tokenStorage'

export interface TeamMember { internId: string; name: string; projectRole: string }
export interface Team { id: string; name: string; description: string; members: TeamMember[] }
export interface TeamInput { id?: string; name: string; description: string; members: { internId: string; projectRole: string }[] }

interface ApiTeam {
    id: string
    name: string
    description?: string | null
    members?: Array<{
        internId: string
        projectRole?: string | null
        intern?: { user?: { fullName?: string | null } }
    }>
}

const toTeam = (team: ApiTeam): Team => ({
    id: team.id,
    name: team.name,
    description: team.description ?? '',
    members: (team.members ?? []).map((member) => ({
        internId: member.internId,
        name: member.intern?.user?.fullName ?? 'Intern',
        projectRole: member.projectRole ?? '',
    })),
})

const KEY = ['teams'] as const

export const useTeams = () =>
    useQuery({
        queryKey: [...KEY, tokenStorage.getUser()?.id ?? null],
        enabled: Boolean(tokenStorage.get()),
        queryFn: async () => (await api.get<ApiTeam[]>('/teams')).data.map(toTeam),
    })

export const useSaveTeam = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, ...body }: TeamInput) =>
            toTeam((id ? await api.put<ApiTeam>(`/teams/${encodeURIComponent(id)}`, body) : await api.post<ApiTeam>('/teams', body)).data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    })
}

export const useDeleteTeam = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => { await api.delete(`/teams/${encodeURIComponent(id)}`) },
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    })
}
