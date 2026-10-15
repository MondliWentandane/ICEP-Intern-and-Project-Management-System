import { Chip, type ChipProps } from '@mui/material'

const statusStyles: Record<string, { backgroundColor: string; color: string }> = {
  active: { backgroundColor: '#DCFCE7', color: '#166534' },
  pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  interviewee: { backgroundColor: '#FEF3C7', color: '#92400E' },
  completed: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  'past intern': { backgroundColor: '#E5E7EB', color: '#374151' },
  rejected: { backgroundColor: '#FEE2E2', color: '#991B1B' },
}

export function Badge(props: ChipProps) {
  return <Chip size="small" {...props} sx={[{ height: 26, borderRadius: '999px', fontWeight: 650, '& .MuiChip-label': { px: 1.5 } }, ...(Array.isArray(props.sx) ? props.sx : props.sx ? [props.sx] : [])]} />
}

export interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'label'> {
  status: string
  label?: ChipProps['label']
}

export function StatusBadge({ status, label, sx, ...props }: StatusBadgeProps) {
  const colors = statusStyles[status.toLowerCase()] ?? { backgroundColor: '#E5E7EB', color: '#374151' }
  return <Badge {...props} label={label ?? status} sx={[colors, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />
}

export default Badge
