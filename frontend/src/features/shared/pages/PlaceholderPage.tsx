import { Paper, Typography } from '@mui/material'

export function PlaceholderPage({ title }: { title: string }) {
  return <Paper sx={{ p: 4 }}><Typography variant="h4">{title}</Typography></Paper>
}
