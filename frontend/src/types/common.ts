export type ID = string
export type BadgeTone = 'success' | 'warning' | 'info' | 'error' | 'neutral'
export interface Paginated<T> { items: T[]; page: number; pageSize: number; total: number }
export interface ListParams { search?: string; page?: number; pageSize?: number; sortBy?: string; sortDirection?: 'asc' | 'desc' }
