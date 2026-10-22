import { useCallback, useState } from 'react'
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
export function useList<T>(request: () => Promise<{ data: ListResponse<T> }>, sample: T[], normalize?: (raw: T) => T) {
  const { data, loading, error, reload } = useApi<ListResponse<T>>(request)
  // Local override: lets a page edit its list in sample mode, where no backend exists to save to.
  const [local, setLocal] = useState<T[] | null>(null)
  const failed = Boolean(error) || (!loading && !isList<T>(data))
  const usingSample = !loading && failed && import.meta.env.DEV
  const loaded = asList(isList<T>(data) ? data : null)
  const base = usingSample ? sample : normalize ? loaded.map(normalize) : loaded
  const refresh = useCallback(async () => { setLocal(null); await reload() }, [reload])
  return { items: local ?? base, loading, failed: failed && !usingSample, usingSample, setItems: setLocal, refresh }
}

export function useRecord<T>(request: () => Promise<{ data: T }>, sample: T | null, dependencies: unknown[] = []) {
  const { data, loading, error } = useApi<T>(request, dependencies)
  const valid = typeof data === 'object' && data !== null && !Array.isArray(data)
  const failed = Boolean(error) || (!loading && !valid)
  const usingSample = !loading && failed && import.meta.env.DEV && sample !== null
  return { item: usingSample ? sample : valid ? data : null, loading, failed: failed && !usingSample, usingSample }
}
