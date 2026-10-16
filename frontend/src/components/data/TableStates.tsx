import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { Search, TriangleAlert } from 'lucide-react'

export const TableLoading = () => (
  <Paper role="status" sx={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, bgcolor: '#fff' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={24} /><Typography sx={{ fontWeight: 600 }}>Loading...</Typography></Box>
  </Paper>
)

export const TableEmpty = ({ message = 'No records found' }: { message?: string }) => (
  <Paper sx={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 3, bgcolor: '#fff', p: 3 }}>
    <Box sx={{ width: 48, height: 48, flex: '0 0 48px', borderRadius: '50%', bgcolor: '#F5F6F8', display: 'grid', placeItems: 'center', color: '#718096' }}><Search size={21} aria-hidden="true" /></Box>
    <Box><Typography sx={{ fontWeight: 700 }}>{message}</Typography><Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Try adjusting your filters, or add a new entry.</Typography></Box>
  </Paper>
)

export const TableError = ({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) => (
  <Alert severity="error" icon={<TriangleAlert size={20} />} action={onRetry ? <Button color="primary" size="small" onClick={onRetry}>Retry</Button> : undefined} sx={{ minHeight: 104, alignItems: 'center', bgcolor: '#fff', borderLeft: '4px solid #DC2626', borderRadius: 2 }}>
    <Typography sx={{ fontWeight: 700 }}>{message}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>We couldn't load the data.</Typography>
  </Alert>
)

export function TableState({ loading, error, empty, onRetry, emptyMessage }: { loading?: boolean; error?: string; empty?: boolean; onRetry?: () => void; emptyMessage?: string }) {
  if (loading) return <TableLoading />
  if (error) return <TableError message={error} onRetry={onRetry} />
  if (empty) return <TableEmpty message={emptyMessage} />
  return null
}
