// Careers positions for the public Careers pages, loaded from the backend (GET /api/positions).
import axios from 'axios'
import { apiClient, endpoints } from '@/api'

export type PositionCategory = 'Software Development' | 'Cybersecurity' | 'Systems Engineering'

export interface CareerPosition {
  id: string
  title: string
  category: PositionCategory
  campus: string
  durationMonths: number
  startDate: string
  closingDate: string
  openings: number
  summary: string
  responsibilities: string[]
  requirements: string[]
}

export const positionCategories: PositionCategory[] = ['Software Development', 'Cybersecurity', 'Systems Engineering']
export const campuses = ['Soshanguve', 'Pretoria', 'eMalahleni', 'Polokwane', 'Mbombela', 'Ga-Rankuwa']

const DAY = 24 * 60 * 60 * 1000

export function daysUntilClosing(position: CareerPosition, now = new Date()) {
  const closing = new Date(`${position.closingDate}T23:59:59`)
  return Math.ceil((closing.getTime() - now.getTime()) / DAY)
}

export function positionStatus(position: CareerPosition): 'open' | 'closing-soon' | 'closed' {
  const days = daysUntilClosing(position)
  if (days < 0) return 'closed'
  return days <= 14 ? 'closing-soon' : 'open'
}

export async function fetchPositions(): Promise<CareerPosition[]> {
  const { data } = await apiClient.get<CareerPosition[]>(endpoints.public.positions)
  return data.filter((position) => positionStatus(position) !== 'closed')
}

export async function fetchPosition(id: string): Promise<CareerPosition | null> {
  try {
    const { data } = await apiClient.get<CareerPosition>(`${endpoints.public.positions}/${encodeURIComponent(id)}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
