import type { ReactNode } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { BikeLoader } from '@/components/ui/BikeLoader'
import { Link as RouterLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { statusMeta, toneColor } from './status'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>{actions}</Stack>}
    </Stack>
  )
}

// 'past' is the grey used for past interns everywhere (current interns stay navy).
export type Accent = 'primary' | 'pending' | 'active' | 'completed' | 'rejected' | 'past'
const accentVar: Record<Accent, string> = {
  primary: 'var(--icep-primary)',
  pending: 'var(--icep-pending)',
  active: 'var(--icep-active)',
  completed: 'var(--icep-completed)',
  rejected: 'var(--icep-rejected)',
  past: '#718096',
}

export function StatTile({ label, value, hint, icon: Icon, accent = 'primary' }: { label: string; value: string | number; hint?: string; icon: LucideIcon; accent?: Accent }) {
  const color = accentVar[accent]
  const past = accent === 'past'
  return (
    <Card variant="outlined" sx={past ? { bgcolor: '#F1F3F6', borderColor: '#E2E8F0' } : undefined}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', color, bgcolor: `color-mix(in srgb, ${color} 12%, white)`, flexShrink: 0 }}>
            <Icon size={22} aria-hidden />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
            {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function Panel({ title, action, children }: { title: string; action?: { label: string; to: string }; children: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>{title}</Typography>
          {action && <Button size="small" component={RouterLink} to={action.to}>{action.label}</Button>}
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}

export interface BarItem { label: string; value: number; accent?: Accent }

export function BarList({ items, emptyMessage = 'Nothing to show yet.' }: { items: BarItem[]; emptyMessage?: string }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (!items.length) return <EmptyNote message={emptyMessage} />
  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
          </Stack>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', overflow: 'hidden' }} role="img" aria-label={`${item.label}: ${item.value}`}>
            <Box sx={{ height: '100%', width: `${(item.value / max) * 100}%`, bgcolor: accentVar[item.accent ?? 'primary'], borderRadius: 4 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  )
}

export function StatusBadge({ status }: { status?: string }) {
  const { label, tone } = statusMeta(status)
  return <Chip size="small" variant="outlined" label={label} color={toneColor[tone]} />
}

export function EmptyNote({ message }: { message: string }) {
  return <Typography color="text.secondary" variant="body2">{message}</Typography>
}

export function LoadingBlock() {
  return <Stack sx={{ alignItems: 'center', py: 6 }}><BikeLoader /></Stack>
}

export function SampleNotice() {
  return <Alert severity="info" sx={{ mb: 2 }}>Backend not reachable, so this page is showing sample data for layout review. Real records appear once the API is connected.</Alert>
}

export function ErrorNotice({ message }: { message: string }) {
  return <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
}

export function DetailList({ items }: { items: Array<{ label: string; value?: ReactNode }> }) {
  return (
    <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      {items.map((item) => (
        <Box key={item.label}>
          <Typography component="dt" variant="caption" color="text.secondary">{item.label}</Typography>
          <Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>{item.value || '—'}</Typography>
        </Box>
      ))}
    </Box>
  )
}
