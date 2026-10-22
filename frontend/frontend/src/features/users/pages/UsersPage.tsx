import { useMemo, useState, type FormEvent } from 'react'
import { Alert, Avatar, Box, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { BriefcaseBusiness, Plus, Search, ShieldCheck, UserRoundCog, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Campuses } from '@/api/services/campuses.service'
import { sampleCampuses } from '@/features/shared/workspace/sample'
import { useList } from '@/features/shared/workspace/useList'
import type { CampusView } from '@/features/shared/workspace/types'

type UserRole = 'ADMIN' | 'WIL_HANDLER' | 'MENTOR' | 'INTERN'
interface UserRecord { id: number; name: string; email: string; role: UserRole; campus: string }

const roleNames: Record<UserRole, string> = { ADMIN: 'Administrator', WIL_HANDLER: 'WIL Handler', MENTOR: 'Mentor', INTERN: 'Intern' }

const roleBadgeStyles: Record<UserRole, { bgcolor: string; color: string }> = {
  ADMIN: { bgcolor: 'var(--icep-completed-tint)', color: '#1E40AF' },
  WIL_HANDLER: { bgcolor: 'var(--icep-active-tint)', color: '#166534' },
  MENTOR: { bgcolor: 'var(--icep-pending-tint)', color: '#92400E' },
  INTERN: { bgcolor: '#E5E7EB', color: '#374151' },
}

const demoUsers: UserRecord[] = [
  { id: 1, name: 'Demo Administrator', email: 'admin@example.com', role: 'ADMIN', campus: 'All campuses' },
  { id: 2, name: 'Demo WIL Handler', email: 'handler@example.com', role: 'WIL_HANDLER', campus: 'Pretoria' },
  { id: 3, name: 'Demo Mentor', email: 'mentor@example.com', role: 'MENTOR', campus: 'Pretoria' },
  { id: 4, name: 'Demo Intern', email: 'intern1@example.com', role: 'INTERN', campus: 'Soshanguve South' },
]
// Intern accounts are created when an application is accepted, so they are not offered when adding a user by hand.
const assignableRoles = (Object.keys(roleNames) as UserRole[]).filter((role) => role !== 'INTERN')
const headerCellSx = { py: 1.5, fontSize: 12, fontWeight: 700, color: 'var(--icep-secondary)', textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' } as const

export function UsersPage() {
  const [users, setUsers] = useState(demoUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const campuses = useList<CampusView>(() => Campuses.list(), sampleCampuses)
  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.campus}`.toLowerCase().includes(query.trim().toLowerCase()) && (!roleFilter || user.role === roleFilter)), [users, query, roleFilter])
  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    handlers: users.filter((user) => user.role === 'WIL_HANDLER').length,
    mentorsInterns: users.filter((user) => user.role === 'MENTOR' || user.role === 'INTERN').length,
  }), [users])

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const role = String(form.get('role') ?? '') as UserRole
    const campus = String(form.get('campus') ?? '').trim()
    if (!name || !email || !role || !campus) { setError('Complete the required fields, including the campus.'); return }
    setUsers((current) => [...current, { id: Date.now(), name, email, role, campus }])
    setError('')
    setDialogOpen(false)
  }

  const stats = [
    { label: 'Total users', value: counts.total, icon: <UsersRound size={20} />, tint: { bgcolor: '#E8EEF5', color: 'var(--icep-primary)' } },
    { label: 'Administrators', value: counts.admins, icon: <ShieldCheck size={20} />, tint: { bgcolor: 'var(--icep-completed-tint)', color: '#1E40AF' } },
    { label: 'WIL handlers', value: counts.handlers, icon: <UserRoundCog size={20} />, tint: { bgcolor: 'var(--icep-active-tint)', color: '#166534' } },
    { label: 'Mentors & interns', value: counts.mentorsInterns, icon: <BriefcaseBusiness size={20} />, tint: { bgcolor: 'var(--icep-pending-tint)', color: '#92400E' } },
  ]

  return <Box sx={{ display: 'grid', gap: 2.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap' }}>
      <Box>
        <Typography component="h1" sx={{ m: 0, color: 'var(--icep-heading)', fontSize: 28, fontWeight: 750, lineHeight: 1.2 }}>Users</Typography>
        <Typography sx={{ mt: 0.75, color: 'var(--icep-secondary)' }}>Manage ICEP accounts and their access roles.</Typography>
      </Box>
      <Button startIcon={<Plus size={18} />} onClick={() => { setError(''); setDialogOpen(true) }}>Add user</Button>
    </Box>

    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
      {stats.map((stat) => <Paper key={stat.label} sx={{ minWidth: 0, p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, border: '1px solid var(--icep-border)', boxShadow: '0 2px 10px rgba(26,32,44,.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 42, height: 42, flex: '0 0 42px', borderRadius: 2, display: 'grid', placeItems: 'center', ...stat.tint }}>{stat.icon}</Box>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 23, fontWeight: 750, lineHeight: 1.2 }}>{stat.value}</Typography><Typography sx={{ mt: 0.35, fontSize: 12, color: 'var(--icep-secondary)' }}>{stat.label}</Typography></Box>
      </Paper>)}
    </Box>

    <Alert severity="info" sx={{ borderRadius: 2, alignItems: 'center', '& .MuiAlert-message': { py: 0.25 } }}>
      This page uses local demo data for now. Connect it to the backend users API after its endpoint and permissions are confirmed.
    </Alert>

    <Paper sx={{ p: 1.5, borderRadius: 3, border: '1px solid var(--icep-border)', boxShadow: '0 2px 10px rgba(26,32,44,.05)' }}>
      <Box role="search" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or campus" sx={{ flex: '1 1 260px', bgcolor: '#fff' }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="var(--icep-secondary)" aria-hidden="true" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search users' } }} />
        <TextField select size="small" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} label="Role" sx={{ minWidth: { xs: '100%', sm: 190 }, bgcolor: '#fff' }}>
          <MenuItem value="">All roles</MenuItem>{Object.entries(roleNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        {(query || roleFilter) && <Button appearance="secondary" onClick={() => { setQuery(''); setRoleFilter('') }}>Clear filters</Button>}
      </Box>
    </Paper>

    <Paper sx={{ overflow: 'hidden', borderRadius: 3, border: '1px solid var(--icep-border)', boxShadow: '0 2px 10px rgba(26,32,44,.05)' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table aria-label="ICEP users" sx={{ minWidth: 620 }}>
          <TableHead><TableRow sx={{ bgcolor: '#F8FAFC' }}>
            {['User', 'Role', 'Campus'].map((heading) => <TableCell key={heading} sx={headerCellSx}>{heading}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>{filteredUsers.map((user) => {
            const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
            return <TableRow key={user.id} hover>
              <TableCell sx={{ py: 1.5 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: '#E8EEF5', color: 'var(--icep-primary)', fontWeight: 700, fontSize: 13 }}>{initials}</Avatar>
                <Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 650, lineHeight: 1.35 }}>{user.name}</Typography><Typography sx={{ color: 'var(--icep-secondary)', fontSize: 13, overflowWrap: 'anywhere' }}>{user.email}</Typography></Box>
              </Box></TableCell>
              <TableCell><Badge label={roleNames[user.role]} sx={roleBadgeStyles[user.role]} /></TableCell>
              <TableCell sx={{ color: 'var(--icep-secondary)' }}>{user.campus}</TableCell>
            </TableRow>
          })}</TableBody>
        </Table>
      </TableContainer>
      {!filteredUsers.length && <Box sx={{ py: 6, px: 2, textAlign: 'center' }}><Typography sx={{ fontWeight: 700 }}>No users found</Typography><Typography sx={{ mt: 0.5, color: 'var(--icep-secondary)', fontSize: 14 }}>Try another search or role filter.</Typography></Box>}
    </Paper>

    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
      <form onSubmit={addUser}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add user</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="name" label="Full name" required fullWidth />
          <TextField name="email" label="Email address" type="email" required fullWidth />
          <TextField name="role" label="Role" select required defaultValue="">
            {assignableRoles.map((role) => <MenuItem key={role} value={role}>{roleNames[role]}</MenuItem>)}
          </TextField>
          <TextField name="campus" label="Campus" select required defaultValue="" fullWidth>
            {campuses.items.map((campus) => <MenuItem key={campus.id} value={campus.name}>{campus.name}</MenuItem>)}
          </TextField>
        </Box></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button appearance="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save user</Button></DialogActions>
      </form>
    </Dialog>
  </Box>
}

export default UsersPage