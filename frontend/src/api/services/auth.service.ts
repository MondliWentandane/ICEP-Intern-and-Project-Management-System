import { apiClient, endpoints } from '@/api'
import type { AuthResponse, LoginCredentials, User } from '@/types'

export const Auth = {
  login: (payload: LoginCredentials) => apiClient.post<AuthResponse>(endpoints.auth.login, payload),
  me: () => apiClient.get<User>(endpoints.auth.me),
  forgotPassword: (email: string) => apiClient.post(endpoints.auth.forgotPassword, { email }),
  createPassword: (token: string, password: string) => apiClient.post(endpoints.auth.createPassword, { token, password }),
}
