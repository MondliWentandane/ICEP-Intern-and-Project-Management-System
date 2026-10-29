import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { tokenStorage } from '@/utils/tokenStorage'
import { apiClient, endpoints } from '@/api'

interface AuthContextValue { user: User | null; isAuthenticated: boolean; setSession: (token: string, user: User, remember?: boolean) => void; logout: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const previewRole = import.meta.env.DEV ? import.meta.env.VITE_DEV_AUTH_ROLE : undefined

  const [user, setUser] = useState<User | null>(() => {
    if (previewRole) {
      return { id: 'local-preview', name: previewRole === 'mentor' ? 'Pat Naidoo' : 'Local preview', email: previewRole === 'mentor' ? 'pat.naidoo@icep.co.za' : 'preview@example.com', role: previewRole as any }
    }
    // A refresh keeps the signed-in user initially to prevent flashing the login screen...
    return tokenStorage.getUser()
  })

  const setSession = useCallback((token: string, nextUser: User, remember = true) => {
    tokenStorage.set(token, remember, nextUser)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // NEW: ...but we immediately verify that session with the backend.
  useEffect(() => {
    const token = tokenStorage.get()

    // If a token exists and we aren't in local mock/preview mode, verify it
    if (token && !previewRole) {
      apiClient.get(endpoints.auth.me)
        .then((response) => {
          // Token is valid! Update the context with the freshest user data from the database
          const freshUser = response.data.user || response.data
          setUser(freshUser)
          tokenStorage.set(token, true, freshUser)
        })
        .catch((error) => {
          // Token is expired, invalid, or account was deactivated. Wipe the session.
          console.error("Session verification failed:", error)
          logout()
        })
    }
  }, [logout, previewRole])

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), setSession, logout }), [user, setSession, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}