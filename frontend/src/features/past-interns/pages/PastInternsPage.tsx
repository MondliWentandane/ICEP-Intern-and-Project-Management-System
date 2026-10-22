import { useMemo, useState, type ReactNode } from 'react'
import { Avatar, Box, Button as MuiButton, Chip, IconButton, InputAdornment, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Archive, CircleCheck, Clock, Download, FileX, Search } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TableEmpty, TableError, TableLoading } from '@/components/data/TableStates'
import { downloadBlob, initials } from '@/utils/format'
import { fetchPastInterns, formatPeriod, intakeYear, outcomes, summarise, toCsv, type InternOutcome } from '../data/pastInterns'

const outcomeColors: Record<InternOutcome, { bgcolor: string; color: string }> = {
  Completed: { bgcolor: 'var(--icep-active-tint)', color: '#166534' },
  Withdrawn: { bgcolor: 'var(--icep-pending-tint)', color: '#92400E' },
  Terminated: { bgcolor: 'var(--icep-rejected-tint)', color: '#991B1B' },
}

function StatTile({ icon, tint, value, label }: { icon: ReactNode; tint: { bgcolor: string; color: string }; value: string; label: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 10px rgba(26,32,44,.06)', display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 44, height: 44, flex: '0 0 44px', borderRadius: 2, display: 'grid', placeItems: 'center', ...tint }}>{icon}</Box>
      <Box><Typography component="p" sx={{ fontSize: 24, fontWeight: 750, lineHeight: 1.2 }}>{value}</Typography><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography></Box>
    </Paper>
  )
}

function FilterSelect({ label, value, onChange, all, options }: { label: string; value: string; onChange: (value: string) => void; all: string; options: string[] }) {
  return (
    <TextField select value={value} onChange={(event) => onChange(event.target.value)} sx={{ flex: '1 1 170px', bgcolor: '#fff' }} slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-label': label } }}>
      <MenuItem value="">{all}</MenuItem>
      {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
    </TextField>
  )
}

const headCellSx = { fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' } as const

const rowRise = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`
/** Rows rise in one by one and pop out in ICEP navy on hover (same as Applicants and Interns). */
const rowSx = (index: number) => ({
  animation: `${rowRise} .4s cubic-bezier(.2,.8,.2,1) ${index * 45}ms backwards`,
  transition: 'background-color .25s ease, transform .3s cubic-bezier(.2,.8,.2,1), filter .3s ease',
  '&.MuiTableRow-hover:hover': {
    position: 'relative', zIndex: 1, bgcolor: 'primary.main',
    transform: 'scale(1.006, 1.04)', filter: 'drop-shadow(0 8px 14px rgba(27,58,92,.3))',
  },
  '&:hover .MuiTableCell-root, &:hover .MuiTypography-root': { color: '#fff', borderBottomColor: 'transparent' },
  '&:hover .muted': { color: '#C8D5E6' },
  '&:hover .MuiAvatar-root': { bgcolor: 'rgba(255,255,255,.16)', color: '#fff' },
  '&:hover .MuiIconButton-root': { color: '#fff', borderColor: 'rgba(255,255,255,.6)' },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none', '&.MuiTableRow-hover:hover': { transform: 'none' } },
})

export function PastInternsPage() {
  const { data: records = [], isLoading, isError, refetch } = useQuery({ queryKey: ['past-interns'], queryFn: fetchPastInterns })
  const [search, setSearch] = useState('')
  const [campus, setCampus] = useState('')
  const [year, setYear] = useState('')
  const [outcome, setOutcome] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(8)

  const campuses = useMemo(() => [...new Set(records.map((record) => record.campus))].sort(), [records])
  const years = useMemo(() => [...new Set(records.map(intakeYear))].sort().reverse(), [records])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return records.filter((record) =>
      (!term || `${record.name} ${record.email}`.toLowerCase().includes(term)) &&
      (!campus || record.campus === campus) && (!year || intakeYear(record) === year) && (!outcome || record.outcome === outcome))
  }, [records, search, campus, year, outcome])
  const stats = useMemo(() => summarise(records), [records])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const hasFilters = Boolean(search || campus || year || outcome)
  const updateFilter = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(0) }
  const clearFilters = () => { setSearch(''); setCampus(''); setYear(''); setOutcome(''); setPage(0) }
  const exportCsv = () => downloadBlob(new Blob([`﻿${toCsv(filtered)}`], { type: 'text/csv;charset=utf-8' }), `past-interns-${new Date().toISOString().slice(0, 10)}.csv`)

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ color: 'text.secondary' }}>Archive of completed internships and final records.</Typography>
        <Button appearance="secondary" startIcon={<Download size={18} />} onClick={exportCsv} disabled={isLoading || !filtered.length}>Export CSV</Button>
      </Box>

      {!isLoading && !isError && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
          <StatTile icon={<Archive size={20} />} tint={{ bgcolor: '#DBEAFE', color: '#1D4ED8' }} value={String(stats.completed)} label="Completed internships" />
          <StatTile icon={<CircleCheck size={20} />} tint={{ bgcolor: 'var(--icep-active-tint)', color: '#166534' }} value={`${stats.completionRate}%`} label="Completion rate" />
          <StatTile icon={<Clock size={20} />} tint={{ bgcolor: 'var(--icep-pending-tint)', color: '#B45309' }} value={`${stats.averageMonths} mo`} label="Average duration" />
          <StatTile icon={<FileX size={20} />} tint={{ bgcolor: 'var(--icep-rejected-tint)', color: '#B91C1C' }} value={String(stats.missingReports)} label="Missing final reports" />
        </Box>
      )}

      <Box role="search" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField value={search} onChange={(event) => updateFilter(setSearch)(event.target.value)} placeholder="Search name or email" sx={{ flex: '2 1 240px', bgcolor: '#fff' }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} aria-hidden="true" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search past interns' } }} />
        <FilterSelect label="Filter by campus" value={campus} onChange={updateFilter(setCampus)} all="All campuses" options={campuses} />
        <FilterSelect label="Filter by intake year" value={year} onChange={updateFilter(setYear)} all="All intake years" options={years} />
        <FilterSelect label="Filter by outcome" value={outcome} onChange={updateFilter(setOutcome)} all="All outcomes" options={outcomes} />
        <MuiButton onClick={clearFilters} disabled={!hasFilters} sx={{ textTransform: 'none', fontWeight: 600 }}>Clear filters</MuiButton>
      </Box>

      {isLoading ? <TableLoading /> : isError ? <TableError message="We couldn't load past interns" onRetry={() => void refetch()} /> : !filtered.length ? (
        <TableEmpty message={hasFilters ? 'No past interns match your filters' : 'No past interns yet'} />
      ) : (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(26,32,44,.06)', overflow: 'hidden' }}>
          <TableContainer>
            <Table aria-label="Past interns">
              <TableHead><TableRow>
                {['Intern', 'Campus', 'Project', 'Mentor', 'Period', 'Outcome'].map((heading) => <TableCell key={heading} sx={headCellSx}>{heading}</TableCell>)}
                <TableCell sx={headCellSx}><Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Open</Box></TableCell>
              </TableRow></TableHead>
              <TableBody>
                {pageRows.map((record, index) => (
                  <TableRow key={record.id} hover sx={rowSx(index)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, bgcolor: '#E4E9F1', color: 'primary.main' }}>{initials(record.name)}</Avatar>
                        <Box><Typography sx={{ fontSize: 14 }}>{record.name}</Typography><Typography className="muted" sx={{ fontSize: 12, color: 'text.secondary' }}>{record.email}</Typography></Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{record.campus}</TableCell>
                    <TableCell>{record.project}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{record.mentor}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatPeriod(record)}</TableCell>
                    <TableCell><Chip size="small" label={record.outcome} sx={{ fontWeight: 650, ...outcomeColors[record.outcome] }} /></TableCell>
                    <TableCell align="right">
                      <IconButton component={RouterLink} to={`../interns/${record.id}`} relative="path" aria-label={`Open ${record.name}'s record`} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <ArrowRight size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }} aria-live="polite">
              Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length} records
            </Typography>
            <Box component="nav" aria-label="Pagination" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography component="label" htmlFor="rows-per-page" sx={{ fontSize: 13, color: 'text.secondary' }}>Rows per page</Typography>
              <TextField select size="small" id="rows-per-page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0) }}>
                {[8, 16, 24].map((size) => <MenuItem key={size} value={size}>{size}</MenuItem>)}
              </TextField>
              <Button appearance="secondary" size="small" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button>
              {Array.from({ length: pageCount }, (_, index) => (
                <Button key={index} size="small" appearance={index === currentPage ? 'primary' : 'secondary'} aria-current={index === currentPage ? 'page' : undefined} aria-label={`Page ${index + 1}`}
                  onClick={() => setPage(index)} sx={{ minWidth: 36, px: 1 }}>{index + 1}</Button>
              ))}
              <Button appearance="secondary" size="small" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>Next</Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  )
}

export default PastInternsPage
