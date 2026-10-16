import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { fetchProfile, updateProfile, type Profile } from '../data/profile'

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['profile', user?.id]
  const query = useQuery({ queryKey, queryFn: () => fetchProfile(user!), enabled: Boolean(user) })
  const save = useMutation({
    mutationFn: (changes: Partial<Profile>) => updateProfile(user!, changes),
    onSuccess: (profile) => queryClient.setQueryData(queryKey, profile),
  })
  return { user, ...query, save }
}
