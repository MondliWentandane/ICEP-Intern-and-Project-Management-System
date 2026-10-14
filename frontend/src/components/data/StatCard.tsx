import { Card, CardContent, Typography } from '@mui/material'
export function StatCard({ label, value }: { label: string; value: string | number }) { return <Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4">{value}</Typography></CardContent></Card> }
