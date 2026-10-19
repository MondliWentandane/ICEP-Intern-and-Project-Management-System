import { Box, Card, CardContent, Typography } from '@mui/material'
import { TrendingUp, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: string
  highlight?: boolean
}

export function StatCard({ label, value, icon, trend, highlight = false }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', bgcolor: highlight ? '#12283F' : '#fff', color: highlight ? '#fff' : '#1A202C', boxShadow: '0 2px 10px rgba(26,32,44,.06)' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
          <Box sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: highlight ? '#1B3A5C' : '#E4E9F1', color: highlight ? '#fff' : '#1B3A5C' }}>
            {icon ?? <UsersRound size={20} aria-hidden="true" />}
          </Box>
          <Typography sx={{ color: highlight ? '#C2CCDA' : '#718096', fontSize: 14 }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography component="p" sx={{ fontSize: 28, lineHeight: 1.1, fontWeight: 750, color: highlight ? '#fff' : '#1A202C' }}>{value}</Typography>
          {trend && <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: .4, color: highlight ? '#B7E4C7' : '#16A34A', fontSize: 12, fontWeight: 700 }}><TrendingUp size={13} aria-hidden="true" />{trend}</Typography>}
        </Box>
      </CardContent>
    </Card>
  )
}
