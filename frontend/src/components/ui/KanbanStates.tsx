import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { Search, TriangleAlert } from 'lucide-react'

export function KanbanLoading() {
  return <Paper role="status" sx={{ minHeight: 190, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: '#fff' }}><Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={22} /><Typography fontWeight={600}>Loading tasks…</Typography></Stack></Paper>
}
export function KanbanEmpty({ message = 'No tasks yet' }: { message?: string }) {
  return <Paper sx={{ minHeight: 190, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: '#fff', p: 3 }}><Stack direction="row" spacing={2} alignItems="center"><Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#F5F6F8', display: 'grid', placeItems: 'center', color: '#718096' }}><Search size={21} aria-hidden="true" /></Box><Box><Typography fontWeight={700}>{message}</Typography><Typography color="text.secondary" fontSize={13}>Tasks will appear here when they are added to the project.</Typography></Box></Stack></Paper>
}
export function KanbanError({ message = 'We could not load the task board.' }: { message?: string }) {
  return <Alert severity="error" icon={<TriangleAlert size={20} />} sx={{ minHeight: 120, alignItems: 'center', bgcolor: '#fff', borderLeft: '4px solid #DC2626', borderRadius: 2 }}><Typography fontWeight={700}>Something went wrong</Typography><Typography variant="body2" color="text.secondary">{message}</Typography></Alert>
}