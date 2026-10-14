import { Paper, Typography } from '@mui/material'
export function PageScaffold({ title }: { title: string }) { return <Paper sx={{ p: 4 }}><Typography variant="h4" component="h1">{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Starter page — implement the approved Figma design and connect its feature service.</Typography></Paper> }
