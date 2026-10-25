import { apiClient, endpoints } from '@/api'
import type { AuthResponse, LoginCredentials, User } from '@/types'

export const Auth = {
  login: async (payload: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(endpoints.auth.login, payload)
    return data
  },
  me: () => apiClient.get<User>(endpoints.auth.me),
  forgotPassword: (email: string) => apiClient.post(endpoints.auth.forgotPassword, { email }),

  // Backend: POST /api/auth/reset-password { otp, newPassword } -> 200, or 400 { error } (invalid / expired).
  resetPassword: (otp: string, newPassword: string) => apiClient.post(endpoints.auth.resetPassword, { otp, newPassword }),

  changePassword: (oldPassword: string, newPassword: string) => apiClient.put(endpoints.auth.changePassword, { oldPassword, newPassword }),
  
  createPassword: (token: string, newPassword: string) => apiClient.post(endpoints.auth.createPassword, { token, newPassword }),
}