import { useMemo, useState, type FormEvent } from 'react'
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'

type UserRole = 'admin' | 'wil_handler' | 'mentor' | 'intern'
interface UserRecord { id: number; name: string; email: string; role: UserRole; campus: string }
const roleNames: Record<UserRole, string> = { admin: 'Administrator', wil_handler: 'WIL Handler', mentor: 'Mentor', intern: 'Intern' }
const demoUsers: UserRecord[] = [
  { id: 1, name: 'Demo Administrator', email: 'admin@example.com', role: 'admin', campus: '-' },
  { id: 2, name: 'Demo WIL Handler', email: 'handler@example.com', role: 'wil_handler', campus: '-' },
  { id: 3, name: 'Demo Mentor', email: 'mentor@example.com', role: 'mentor', campus: 'Pretoria' },
  { id: 4, name: 'Demo Intern', email: 'intern1@example.com', role: 'intern', campus: 'Soshanguve South' },
]

export function UsersPage() {
  const [users, setUsers] = useState(demoUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.campus}`.toLowerCase().includes(query.toLowerCase()) && (!roleFilter || user.role === roleFilter)), [users, query, roleFilter])

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const role = String(form.get('role') ?? '') as UserRole
    const campus = String(form.get('campus') ?? '').trim() || '-'
    if (!name || !email || !role) { setError('Complete the required fields.'); return }
    setUsers((current) => [...current, { id: Date.now(), name, email, role, campus }])
    setError('')
    setDialogOpen(false)
  }

  return <div style={{ display: 'grid', gap: 20 }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div><h1 style={{ margin: 0, fontSize: 28 }}>Users</h1><p style={{ margin: '6px 0 0', color: '#718096' }}>Manage ICEP account roles and access.</p></div>
      <Button startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Add user</Button>
    </header>
    <Alert severity="info">This screen currently uses local demo data. Connect it to the backend users endpoint when the API contract is available.</Alert>
    <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: 'none' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or campus" sx={{ flex: '1 1 260px' }} slotProps={{ input: { startAdornment: <Search size={17} color="#718096" /> }, htmlInput: { 'aria-label': 'Search users' } }} />
        <TextField select size="small" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} label="Role" sx={{ minWidth: 180 }}>
          <MenuItem value="">All roles</MenuItem>{Object.entries(roleNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
      </div>
    </Paper>
    <Paper sx={{ overflowX: 'auto', borderRadius: 3, boxShadow: 'none', border: '1px solid #E5E9EF' }}>
      {filteredUsers.length ? <Table>
        <TableHead><TableRow>{['Name', 'Email', 'Role', 'Campus'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700, color: '#718096' }}>{heading}</TableCell>)}</TableRow></TableHead>
        <TableBody>{filteredUsers.map((user) => <TableRow key={user.id} hover><TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell><StatusBadge status={roleNames[user.role]} /></TableCell><TableCell>{user.campus}</TableCell></TableRow>)}</TableBody>
      </Table> : <div style={{ padding: 40, textAlign: 'center' }}><strong>No users found</strong><p style={{ color: '#718096', marginBottom: 0 }}>Try another search or role filter.</p></div>}
    </Paper>
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
      <form onSubmit={addUser}>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent><div style={{ display: 'grid', gap: 16, paddingTop: 8 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="name" label="Full name" required fullWidth />
          <TextField name="email" label="Email address" type="email" required fullWidth />
          <TextField name="role" label="Role" select required defaultValue=""><MenuItem value="admin">Administrator</MenuItem><MenuItem value="wil_handler">WIL Handler</MenuItem><MenuItem value="mentor">Mentor</MenuItem><MenuItem value="intern">Intern</MenuItem></TextField>
          <TextField name="campus" label="Campus (optional)" fullWidth />
        </div></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button appearance="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save user</Button></DialogActions>
      </form>
    </Dialog>
  </div>
}

export default UsersPage
