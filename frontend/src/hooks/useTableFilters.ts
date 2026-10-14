import { useMemo, useState } from 'react'
export function useTableFilters<T>(rows: T[], searchableText: (row: T) => string, pageSize = 10) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0)
  const filtered = useMemo(() => rows.filter((row) => searchableText(row).toLowerCase().includes(search.toLowerCase())), [rows, search, searchableText])
  return { search, setSearch, page, setPage, pageSize, filtered, pageRows: filtered.slice(page * pageSize, (page + 1) * pageSize), total: filtered.length }
}
