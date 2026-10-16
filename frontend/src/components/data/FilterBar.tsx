import { Box, InputAdornment, MenuItem, Paper, TextField } from '@mui/material'
import { Search } from 'lucide-react'

export interface FilterBarProps {
  search?: string
  onSearch?: (value: string) => void
  campuses?: string[]
  campus?: string
  onCampusChange?: (value: string) => void
  statuses?: string[]
  status?: string
  onStatusChange?: (value: string) => void
  date?: string
  onDateChange?: (value: string) => void
}

export function FilterBar({ search = '', onSearch, campuses = [], campus = '', onCampusChange, statuses = [], status = '', onStatusChange, date = '', onDateChange }: FilterBarProps) {
  return (
    <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: 'none' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.25, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(event) => onSearch?.(event.target.value)}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search size={17} color="#718096" /></InputAdornment> },
            htmlInput: { 'aria-label': 'Search records' },
          }}
          sx={{ flex: '1 1 190px', minWidth: 160 }}
        />
        {campuses.length > 0 && <TextField select size="small" value={campus} onChange={(event) => onCampusChange?.(event.target.value)} sx={{ flex: '0 1 150px', minWidth: 130 }} slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-label': 'Filter by campus' } }}><MenuItem value="">All campuses</MenuItem>{campuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>}
        {statuses.length > 0 && <TextField select size="small" value={status} onChange={(event) => onStatusChange?.(event.target.value)} sx={{ flex: '0 1 140px', minWidth: 120 }} slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-label': 'Filter by status' } }}><MenuItem value="">All status</MenuItem>{statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>}
        {onDateChange && <TextField size="small" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} sx={{ flex: '0 1 165px', minWidth: 145 }} slotProps={{ htmlInput: { 'aria-label': 'Filter by date' } }} />}
      </Box>
    </Paper>
  )
}

export default FilterBar
