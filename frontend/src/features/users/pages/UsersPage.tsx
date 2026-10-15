import { useMemo, useState, type FormEvent } from 'react'
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'

type UserRole = 'admin' | 'wil_handler' | 'mentor' | 'intern'
interface UserRecord { id: number; name: string; email: string; role: UserRole; campus: string }
const roleNames: Record<UserRole, string> = { admin: 'Administrator', wil_handler: 'WIL Handler', mentor: 'Mentor', intern: 'Intern' }
const demoUsers: UserRecord[] = [
  { id: 1, name: 'Demo Administrator', email: 'admin@example.com', role: 'admin', campus: '—' },
  { id: 2, name: 'Demo WIL Handler', email: 'handler@example.com', role: 'wil_handler', campus: '—' },
  { id: 3, name: 'Demo Mentor', email: 'mentor@example.com', role: 'mentor', campus: 'Pretoria' },
  { id: 4, name: 'Demo Intern', email: 'intern1@example.com', role: 'intern', campus: 'Soshanguve South' },
]

export function UsersPage() {
  const [users, setUsers] = useState(demoUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email} ${user.campus}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!roleFilter || user.role === roleFilter)
  }), [users, query, roleFilter])

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const role = String(formData.get('role') ?? '') as UserRole
    const campus = String(formData.get('campus') ?? '').trim() || '—'
    if (!name || !email || !role) { setError('Complete the required fields.'); return }
    setUsers((current) => [...current, { id: Date.now(), name, email, role, campus }])
    setError('')
    setDialogOpen(false)
  }

  return <Stack spacing={2.5}>
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
      <Box><Typography component="h1" variant="h4" fontWeight={700}>Users</Typography><Typography color="text.secondary" mt={0.5}>Manage ICEP account roles and access.</Typography></Box>
      <Button startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Add user</Button>
    </Box>
    <Alert severity="info">This screen currently uses local demo data. Connect it to the backend users endpoint when the API contract is available.</Alert>
    <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: 'none' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
        <TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or campus" sx={{ flex: 1 }} slotProps={{ input: { startAdornment: <Search size={17} color="#718096" /> }, htmlInput: { 'aria-label': 'Search users' } }} />
        <TextField select size="small" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} label="Role" sx={{ minWidth: 180 }}>
          <MenuItem value="">All roles</MenuItem>{Object.entries(roleNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
      </Stack>
    </Paper>
    <Paper sx={{ overflowX: 'auto', borderRadius: 3, boxShadow: 'none', border: '1px solid #E5E9EF' }}>
      {filteredUsers.length ? <Table>
        <TableHead><TableRow>{['Name', 'Email', 'Role', 'Campus'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700, color: '#718096' }}>{heading}</TableCell>)}</TableRow></TableHead>
        <TableBody>{filteredUsers.map((user) => <TableRow key={user.id} hover><TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell><StatusBadge status={roleNames[user.role]} /></TableCell><TableCell>{user.campus}</TableCell></TableRow>)}</TableBody>
      </Table> : <Box p={5} textAlign="center"><Typography fontWeight={700}>No users found</Typography><Typography color="text.secondary" mt={0.5}>Try another search or role filter.</Typography></Box>}
    </Paper>
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={addUser}>
        <DialogTitle>Add user</DialogTitle><DialogContent><Stack spacing={2} pt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="name" label="Full name" required fullWidth />
          <TextField name="email" label="Email address" type="email" required fullWidth />
          <TextField name="role" label="Role" select required defaultValue=""><MenuItem value="admin">Administrator</MenuItem><MenuItem value="wil_handler">WIL Handler</MenuItem><MenuItem value="mentor">Mentor</MenuItem><MenuItem value="intern">Intern</MenuItem></TextField>
          <TextField name="campus" label="Campus (optional)" fullWidth />
        </Stack></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button appearance="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save user</Button></DialogActions>
      </Box>
    </Dialog>
  </Stack>
}

export default UsersPage