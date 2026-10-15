import type { ReactNode } from 'react'
import { Box, Breadcrumbs, Divider, Link, Paper, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, MapPin, UsersRound } from 'lucide-react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { TableError, TableLoading } from '@/components/data/TableStates'
import { LinkButton } from '../components/LinkButton'
import { Pill, PositionStatusPill } from '../components/PositionBits'
import { daysUntilClosing, fetchPosition, positionStatus } from '../data/positions'

const longDate = (iso: string) => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
const monthYear = (iso: string) => new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(new Date(iso))

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Box component="section"><Typography component="h2" sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}>{title}</Typography>{children}</Box>
}

function BulletList({ items }: { items: string[] }) {
  return <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 0.75 }}>{items.map((item) => <li key={item}><Typography sx={{ fontSize: 15 }}>{item}</Typography></li>)}</Box>
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Box sx={{ color: 'text.secondary', display: 'grid' }}>{icon}</Box>
      <Box><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography><Typography sx={{ fontWeight: 650, fontSize: 15 }}>{value}</Typography></Box>
    </Box>
  )
}

export function PositionDetailPage() {
  const { positionId = '' } = useParams<{ positionId: string }>()
  const { data: position, isLoading, isError, refetch } = useQuery({ queryKey: ['public', 'position', positionId], queryFn: () => fetchPosition(positionId) })

  if (isLoading) return <TableLoading />
  if (isError) return <TableError message="We couldn't load this position" onRetry={() => void refetch()} />
  if (!position) {
    return (
      <Paper sx={{ p: 5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700 }}>Position not found</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>This position may have closed or the link is incorrect.</Typography>
        <LinkButton to="/careers">Back to careers</LinkButton>
      </Paper>
    )
  }

  const days = daysUntilClosing(position)
  const closed = positionStatus(position) === 'closed'
  const applyPath = `/careers/${position.id}?apply=${position.id}`

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: 13 }}>
        <Link component={RouterLink} to="/careers" underline="hover" color="primary">Careers</Link>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{position.title}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 750 }}>{position.title}</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{position.category} · {position.campus} campus</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <PositionStatusPill position={position} />
            {!closed && <Pill tone="warning" label={days === 0 ? 'Closes today' : `Closes in ${days} ${days === 1 ? 'day' : 'days'}`} />}
            <Pill tone="info" label={`${position.durationMonths} months`} />
          </Box>
        </Box>
        {!closed && <LinkButton to={applyPath} sx={{ minHeight: 46 }}>Apply for this position</LinkButton>}
      </Paper>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' }, alignItems: 'start' }}>
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', display: 'grid', gap: 3 }}>
          <Section title="About the role"><Typography sx={{ fontSize: 15, lineHeight: 1.7 }}>{position.summary}</Typography></Section>
          <Divider />
          <Section title="Responsibilities"><BulletList items={position.responsibilities} /></Section>
          <Divider />
          <Section title="Requirements"><BulletList items={position.requirements} /></Section>
        </Paper>

        <Paper component="aside" sx={{ p: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Typography component="h2" sx={{ fontSize: 20, fontWeight: 700 }}>Position details</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gap: 2 }}>
            <DetailRow icon={<MapPin size={20} />} label="Campus" value={position.campus} />
            <DetailRow icon={<Clock size={20} />} label="Duration" value={`${position.durationMonths} months, starting ${monthYear(position.startDate)}`} />
            <DetailRow icon={<UsersRound size={20} />} label="Positions available" value={String(position.openings)} />
            <DetailRow icon={<CalendarDays size={20} />} label="Closing date" value={longDate(position.closingDate)} />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {closed ? <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>Applications for this position have closed.</Typography> : <LinkButton to={applyPath} fullWidth sx={{ minHeight: 46 }}>Apply for this position</LinkButton>}
            <LinkButton to="/careers" appearance="secondary" fullWidth sx={{ minHeight: 46 }}>Back to careers</LinkButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default PositionDetailPage
