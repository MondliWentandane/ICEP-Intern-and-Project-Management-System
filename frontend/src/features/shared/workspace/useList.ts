import type { Paginated } from '@/types'
import { useApi } from '@/hooks/useApi'

type ListResponse<T> = T[] | Paginated<T>

function isList<T>(value: unknown): value is ListResponse<T> {
  return Array.isArray(value) || (typeof value === 'object' && value !== null && Array.isArray((value as Paginated<T>).items))
}

export function asList<T>(value: ListResponse<T> | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : (value.items ?? [])
}

// Backend routes are not confirmed yet. While running the Vite dev server a failed
// request falls back to clearly labelled sample data so layouts can be reviewed.
// Production builds never show sample data; they surface the error instead.
//
// A 200 response that is not JSON of the expected shape also counts as a failure:
// without a backend proxy the Vite dev server answers /api/* with its index.html.
export function useList<T>(request: () => Promise<{ data: ListResponse<T> }>, sample: T[]) {
  const { data, loading, error } = useApi<ListResponse<T>>(request)
  const failed = Boolean(error) || (!loading && !isList<T>(data))
  const usingSample = !loading && failed && import.meta.env.DEV
  return { items: usingSample ? sample : asList(isList<T>(data) ? data : null), loading, failed: failed && !usingSample, usingSample }
}

export function useRecord<T>(request: () => Promise<{ data: T }>, sample: T | null, dependencies: unknown[] = []) {
  const { data, loading, error } = useApi<T>(request, dependencies)
  const valid = typeof data === 'object' && data !== null && !Array.isArray(data)
  const failed = Boolean(error) || (!loading && !valid)
  const usingSample = !loading && failed && import.meta.env.DEV && sample !== null
  return { item: usingSample ? sample : valid ? data : null, loading, failed: failed && !usingSample, usingSample }
}
