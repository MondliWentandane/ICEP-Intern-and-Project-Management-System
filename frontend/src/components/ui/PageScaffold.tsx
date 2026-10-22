import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

export function PageScaffold({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" component="h1">{title}</Typography>
      {children ? (
        <Box sx={{ mt: 3 }}>{children}</Box>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Starter page — implement the approved Figma design and connect its feature service.
        </Typography>
      )}
    </Paper>
  )
}