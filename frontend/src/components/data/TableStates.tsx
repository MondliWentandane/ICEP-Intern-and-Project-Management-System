import { Alert, CircularProgress, Stack, Typography } from '@mui/material'
export const TableLoading = () => <CircularProgress aria-label="Loading" />
export const TableEmpty = ({ message = 'No records found' }: { message?: string }) => <Typography color="text.secondary">{message}</Typography>
export const TableError = ({ message = 'Could not load records' }: { message?: string }) => <Alert severity="error">{message}</Alert>
export function TableState({ loading, error, empty }: { loading?: boolean; error?: string; empty?: boolean }) { if (loading) return <Stack sx={{ alignItems: 'center' }}><TableLoading /></Stack>; if (error) return <TableError message={error} />; if (empty) return <TableEmpty />; return null }
