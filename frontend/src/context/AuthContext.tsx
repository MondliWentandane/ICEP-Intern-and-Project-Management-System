import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { tokenStorage } from '@/utils/tokenStorage'

interface AuthContextValue { user: User | null; isAuthenticated: boolean; setSession: (token: string, user: User, remember?: boolean) => void; logout: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const previewRole = import.meta.env.DEV ? import.meta.env.VITE_DEV_AUTH_ROLE : undefined
  const [user, setUser] = useState<User | null>(previewRole ? { id: 'local-preview', name: 'Local preview', email: 'preview@example.com', role: previewRole } : null)
  const setSession = useCallback((token: string, nextUser: User, remember = true) => { tokenStorage.set(token, remember); setUser(nextUser) }, [])
  const logout = useCallback(() => { tokenStorage.clear(); setUser(null) }, [])
  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), setSession, logout }), [user, setSession, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
