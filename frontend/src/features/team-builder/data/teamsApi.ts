import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient as api } from '@/api/client'

export interface TeamMember { internId: string; name: string }
export interface Team { id: string; name: string; members: TeamMember[] }
export interface TeamInput { id?: string; name: string; internIds: string[] }

const KEY = ['teams'] as const

export const useTeams = () =>
    useQuery({ queryKey: KEY, queryFn: async () => (await api.get<Team[]>('/teams')).data })

export const useSaveTeam = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, ...body }: TeamInput) =>
            (id ? await api.put<Team>(`/teams/${id}`, body) : await api.post<Team>('/teams', body)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    })
}

export const useDeleteTeam = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => { await api.delete(`/teams/${id}`) },
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    })
}