import type { AuthResponse, LoginCredentials, User } from '@/types'

const demoPassword = 'ICEPdemo1!'
const demoUsers: User[] = [
  { id: 'demo-admin', name: 'Alex Williamson', email: 'admin@icep.local', role: 'admin' },
  { id: 'demo-handler', name: 'Sam Dlamini', email: 'handler@icep.local', role: 'wil_handler' },
  { id: 'demo-mentor', name: 'Morgan Mentor', email: 'mentor@icep.local', role: 'mentor' },
  { id: 'demo-intern', name: 'Lebo Khumalo', email: 'intern@icep.local', role: 'intern' },
]

export function mockLogin(credentials: LoginCredentials): AuthResponse {
  const user = demoUsers.find((candidate) => candidate.email === credentials.email.trim().toLowerCase())
  if (!user || credentials.password !== demoPassword) throw new Error('Invalid demo credentials')
  return { token: `icep-demo:${user.id}`, user }
}

export function getMockUserFromToken(token: string | null): User | null {
  if (!token?.startsWith('icep-demo:')) return null
  const userId = token.slice('icep-demo:'.length)
  return demoUsers.find((user) => user.id === userId) ?? null
}

export const mockDemoAccounts = demoUsers.map(({ name, email, role }) => ({ name, email, role, password: demoPassword }))
