import { useCallback, useEffect, useState } from 'react'
export function useApi<T>(request: () => Promise<{ data: T }>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<unknown>(null)
  const reload = useCallback(async () => { setLoading(true); setError(null); try { const result = await request(); setData(result.data) } catch (cause) { setError(cause) } finally { setLoading(false) } }, dependencies)
  useEffect(() => { void reload() }, [reload])
  return { data, loading, error, reload }
}
