import { Box, Pagination as MuiPagination, Typography } from '@mui/material'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  if (total === 0) return null
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 0.5 }}>
      <Typography sx={{ color: '#718096', fontSize: 13 }}>Showing {from}–{to} of {total}</Typography>
      <MuiPagination
        count={pageCount}
        page={page}
        onChange={(_, next) => { if (next !== page) onPageChange(next) }}
        shape="rounded"
        size="small"
      />
    </Box>
  )
}

export default Pagination
