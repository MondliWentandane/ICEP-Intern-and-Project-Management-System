import axios from 'axios'
import { endpoints } from './endpoints'
import { tokenStorage } from '@/utils/tokenStorage'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 20000 })
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth requests own their error handling (a wrong password must stay on the login form),
// so the 401 redirect below only applies to session expiry on protected endpoints.
const authRequestUrls = new Set<string>([endpoints.auth.login, endpoints.auth.createPassword, endpoints.auth.forgotPassword])
apiClient.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    tokenStorage.clear()
    const requestUrl = error.config?.url ?? ''
    if (!authRequestUrls.has(requestUrl) && window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(error)
})
