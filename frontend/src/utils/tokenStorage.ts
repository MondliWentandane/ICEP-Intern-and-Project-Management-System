import type { User } from '@/types'

const TOKEN_KEY = 'icep.auth.token'
// The signed-in user is kept next to the token so a page refresh doesn't log people out.
const USER_KEY = 'icep.auth.user'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY),
  set: (token: string, remember = true, user?: User) => {
    tokenStorage.clear()
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, token)
    if (user) storage.setItem(USER_KEY, JSON.stringify(user))
  },
  /** The user saved at sign-in, only while their token is still stored. */
  getUser: (): User | null => {
    if (!tokenStorage.get()) return null
    try {
      const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
  },
}
