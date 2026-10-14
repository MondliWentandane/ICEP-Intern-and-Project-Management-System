import { Stack, TextField } from '@mui/material'
export function FilterBar({ search = '', onSearch }: { search?: string; onSearch?: (value: string) => void }) { return <Stack direction="row" spacing={2}><TextField size="small" label="Search" value={search} onChange={event => onSearch?.(event.target.value)} /></Stack> }
