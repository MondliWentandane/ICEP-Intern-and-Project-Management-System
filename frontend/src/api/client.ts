import axios from 'axios'
import { tokenStorage } from '@/utils/tokenStorage'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 20000 })
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
apiClient.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) tokenStorage.clear()
  return Promise.reject(error)
})
