import { useMemo, useState, type FormEvent } from 'react'
import { Box, Chip, Divider, InputAdornment, MenuItem, Paper, TextField, Typography, type SxProps, type Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TableEmpty, TableError, TableLoading } from '@/components/data/TableStates'
import { useSearchParams } from 'react-router-dom'
import { LinkButton } from '../components/LinkButton'
import { CategoryIcon, PositionStatusPill } from '../components/PositionBits'
import { campuses, fetchPositions, positionCategories, type CareerPosition, type PositionCategory } from '../data/positions'
import { riseSx, useReveal } from '../story/useScrollProgress'

function PositionCard({ position, sx }: { position: CareerPosition; sx?: SxProps<Theme> }) {
  return (
    <Paper
      component="article"
      sx={[
        {
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <CategoryIcon category={position.category} />
        <PositionStatusPill position={position} />
      </Box>
      <Typography component="h3" sx={{ fontWeight: 700, fontSize: 17 }}>{position.title}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>{position.category}</Typography>
      <Divider sx={{ mt: 'auto' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, fontSize: 13, color: 'text.primary' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><MapPin size={16} aria-hidden="true" />{position.campus}</Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><Clock size={15} aria-hidden="true" />{position.durationMonths} months</Box>
      </Box>
      <LinkButton to={`/careers/${position.id}`} appearance="secondary" fullWidth endIcon={<ArrowRight size={18} />} aria-label={`View ${position.title}`}>View</LinkButton>
    </Paper>
  )
}

function PositionsGrid({ positions }: { positions: CareerPosition[] }) {
  const { ref, p } = useReveal<HTMLDivElement>()
  const step = positions.length > 1 ? Math.min(0.12, 0.5 / (positions.length - 1)) : 0.12

  return (
    <Box
      ref={ref}
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      }}
    >
      {positions.map((position, index) => (
        <PositionCard
          key={position.id}
          position={position}
          sx={{
            ...riseSx(p, index, { step, length: 0.45, distance: 32 }),
            transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
              transform: 'none',
              opacity: 1,
            },
          }}
        />
      ))}
    </Box>
  )
}

export function CareersPage() {
  const { data: positions = [], isLoading, isError, refetch } = useQuery({ queryKey: ['public', 'positions'], queryFn: fetchPositions })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<PositionCategory | ''>(() => {
    const fromLink = searchParams.get('category')
    return positionCategories.find((item) => item === fromLink) ?? ''
  })
  const [campus, setCampus] = useState('')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return positions.filter((position) =>
      (!category || position.category === category) &&
      (!campus || position.campus === campus) &&
      (!term || `${position.title} ${position.category} ${position.campus} ${position.summary}`.toLowerCase().includes(term)))
  }, [positions, search, category, campus])

  const onSearch = (event: FormEvent) => { event.preventDefault(); setSearch(searchInput) }
  const filtered = Boolean(search || category || campus)

  return (
    <Box sx={{ display: 'grid', gap: 4 }}>
      <Paper component="section" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, boxShadow: 'none' }}>
        <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>ICEP · Work-integrated learning</Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 28, md: 32 }, fontWeight: 750, mt: 0.5 }}>Find your WIL placement</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>Put your skills into practice. Explore WIL opportunities at TUT.</Typography>
        <Box component="form" role="search" onSubmit={onSearch} sx={{ display: 'flex', gap: 1.5, mt: 3, maxWidth: 700, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search positions or keywords"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} aria-hidden="true" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search positions' } }}
          />
          <Button type="submit" sx={{ minWidth: 104, minHeight: 56 }}>Search</Button>
        </Box>
      </Paper>

      <Paper component="aside" aria-label="Track an application" sx={{ p: 2.5, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography component="h2" sx={{ fontWeight: 700 }}>Already applied?</Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Check your progress with your email address and reference number. No need to apply again.</Typography>
        </Box>
        <LinkButton to="/track" appearance="secondary">Track application</LinkButton>
      </Paper>

      <Box component="section" aria-labelledby="available-positions">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }} role="group" aria-label="Filter by category">
            {[{ value: '' as const, label: 'All' }, ...positionCategories.map((item) => ({ value: item, label: item }))].map((item) => {
              const selected = category === item.value
              return <Chip key={item.label} label={item.label} clickable onClick={() => setCategory(item.value)} aria-pressed={selected}
                sx={{ height: 34, borderRadius: '999px', fontWeight: 600, border: '1px solid', borderColor: selected ? 'primary.main' : 'divider', bgcolor: selected ? 'primary.main' : '#fff', color: selected ? '#fff' : 'text.primary', '&:hover': { bgcolor: selected ? 'primary.dark' : '#F5F6F8' } }} />
            })}
          </Box>
          <TextField select size="small" value={campus} onChange={(event) => setCampus(event.target.value)} sx={{ minWidth: 180, bgcolor: '#fff' }}
            slotProps={{ select: { displayEmpty: true }, input: { startAdornment: <InputAdornment position="start"><MapPin size={17} aria-hidden="true" /></InputAdornment> }, htmlInput: { 'aria-label': 'Filter by campus' } }}>
            <MenuItem value="">All campuses</MenuItem>
            {campuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
          <Typography id="available-positions" component="h2" sx={{ fontSize: 21, fontWeight: 700 }}>Available positions</Typography>
          {!isLoading && !isError && <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{visible.length} {visible.length === 1 ? 'position' : 'positions'}</Typography>}
        </Box>

        {isLoading ? <TableLoading /> : isError ? <TableError message="We couldn't load positions" onRetry={() => void refetch()} /> : visible.length === 0 ? (
          <TableEmpty message={filtered ? 'No positions match your search' : 'No open positions right now'} />
        ) : (
          <>
            <PositionsGrid positions={visible} />
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 13, mt: 3 }}>
              {filtered ? `Showing ${visible.length} of ${positions.length} positions.` : `Showing all ${visible.length} positions. Your next chapter starts here.`}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}

export default CareersPage
