import { Pagination as MuiPagination } from '@mui/material'
export function Pagination({ count = 1, onChange }: { count?: number; onChange?: (page: number) => void }) { return <MuiPagination count={count} onChange={(_, page) => onChange?.(page)} /> }
