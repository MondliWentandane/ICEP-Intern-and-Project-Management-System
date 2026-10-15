import { Box, Chip } from '@mui/material'
import { Code, Network, ShieldCheck } from 'lucide-react'
import { positionStatus, type CareerPosition, type PositionCategory } from '../data/positions'

const categoryIcons: Record<PositionCategory, typeof Code> = {
  'Software Development': Code,
  Cybersecurity: ShieldCheck,
  'Systems Engineering': Network,
}

export function CategoryIcon({ category }: { category: PositionCategory }) {
  const Icon = categoryIcons[category]
  return (
    <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: '#E4EBF5', color: 'primary.main' }}>
      <Icon size={20} aria-hidden="true" />
    </Box>
  )
}

const pillSx = { height: 24, borderRadius: '999px', fontSize: 12, fontWeight: 600, '& .MuiChip-label': { px: 1.25 } }

export function Pill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'info' }) {
  const colors = {
    success: { bgcolor: 'var(--icep-active-tint)', color: '#166534' },
    warning: { bgcolor: 'var(--icep-pending-tint)', color: '#B45309' },
    info: { bgcolor: 'var(--icep-completed-tint)', color: '#1D4ED8' },
  }[tone]
  const dot = tone === 'info' ? null : <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', ml: 1 }} />
  return <Chip size="small" icon={dot ?? undefined} label={label} sx={{ ...pillSx, ...colors, '& .MuiChip-icon': { color: 'inherit', mr: -0.5 } }} />
}

export function PositionStatusPill({ position }: { position: CareerPosition }) {
  const status = positionStatus(position)
  if (status === 'closing-soon') return <Pill label="Closing soon" tone="warning" />
  if (status === 'closed') return <Pill label="Closed" tone="warning" />
  return <Pill label="Open" tone="success" />
}
