import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { tokenStorage } from '@/utils/tokenStorage'

interface AuthContextValue { user: User | null; isAuthenticated: boolean; setSession: (token: string, user: User, remember?: boolean) => void; logout: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const previewRole = import.meta.env.DEV ? import.meta.env.VITE_DEV_AUTH_ROLE : undefined
  const [user, setUser] = useState<User | null>(() => {
    if (previewRole) {
      return { id: 'local-preview', name: previewRole === 'mentor' ? 'Pat Naidoo' : 'Local preview', email: previewRole === 'mentor' ? 'pat.naidoo@icep.co.za' : 'preview@example.com', role: previewRole }
    }
    // A refresh keeps the signed-in user (an expired token gets a 401, which clears both and goes to /login).
    return tokenStorage.getUser()
  })
  const setSession = useCallback((token: string, nextUser: User, remember = true) => { tokenStorage.set(token, remember, nextUser); setUser(nextUser) }, [])
  const logout = useCallback(() => { tokenStorage.clear(); setUser(null) }, [])
  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), setSession, logout }), [user, setSession, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
