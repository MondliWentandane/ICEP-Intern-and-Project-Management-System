import { Chip, type ChipProps } from '@mui/material'
export function Badge(props: ChipProps) { return <Chip size="small" {...props} /> }
export const StatusBadge = Badge
