import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { getMockUserFromToken } from '@/api/services/mockAuth'
import { isMockAuthEnabled } from '@/utils/authMode'
import { tokenStorage } from '@/utils/tokenStorage'

interface AuthContextValue { user: User | null; isAuthenticated: boolean; setSession: (token: string, user: User, remember?: boolean) => void; logout: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => isMockAuthEnabled() ? getMockUserFromToken(tokenStorage.get()) : null)
  const setSession = useCallback((token: string, nextUser: User, remember = true) => { tokenStorage.set(token, remember); setUser(nextUser) }, [])
  const logout = useCallback(() => { tokenStorage.clear(); setUser(null) }, [])
  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), setSession, logout }), [user, setSession, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
