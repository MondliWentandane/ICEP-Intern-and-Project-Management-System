import { useMemo, useState, type FormEvent } from 'react'
import { Alert, Avatar, Box, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BriefcaseBusiness, MailCheck, Plus, Search, ShieldCheck, UserRoundCog, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TableError, TableLoading } from '@/components/data/TableStates'
import { apiErrorMessage, createUser, fetchDepartments, fetchUsers, resendInvite, type ApiUser, type StaffRole, type UserRole, type UserStatus } from '../data/usersApi'

const roleNames: Record<UserRole, string> = { ADMIN: 'Administrator', WIL_HANDLER: 'WIL Handler', MENTOR: 'Mentor', INTERN: 'Intern' }

const roleBadgeStyles: Record<UserRole, { bgcolor: string; color: string }> = {
  ADMIN: { bgcolor: 'var(--icep-completed-tint)', color: '#1E40AF' },
  WIL_HANDLER: { bgcolor: 'var(--icep-active-tint)', color: '#166534' },
  MENTOR: { bgcolor: 'var(--icep-pending-tint)', color: '#92400E' },
  INTERN: { bgcolor: '#E5E7EB', color: '#374151' },
}

const statusNames: Record<UserStatus, string> = { INVITED: 'Invite sent', ACTIVE: 'Active', INACTIVE: 'Inactive' }
const statusBadgeStyles: Record<UserStatus, { bgcolor: string; color: string }> = {
  INVITED: { bgcolor: 'var(--icep-pending-tint)', color: '#92400E' },
  ACTIVE: { bgcolor: 'var(--icep-active-tint)', color: '#166534' },
  INACTIVE: { bgcolor: '#E5E7EB', color: '#374151' },
}

// Intern accounts are created when an application is accepted, so they are not offered when adding a user by hand.
const assignableRoles: StaffRole[] = ['ADMIN', 'WIL_HANDLER', 'MENTOR']
const headerCellSx = { py: 1.5, fontSize: 12, fontWeight: 700, color: 'var(--icep-secondary)', textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' } as const
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Mentors show their department, interns their campus. */
const placeOf = (user: ApiUser) => user.department?.name ?? user.campus ?? '—'

export function UsersPage() {
  const queryClient = useQueryClient()
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments })
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [role, setRole] = useState<StaffRole | ''>('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null)

  const filteredUsers = useMemo(() => users.filter((user) => `${user.fullName} ${user.email} ${placeOf(user)}`.toLowerCase().includes(query.trim().toLowerCase()) && (!roleFilter || user.role === roleFilter)), [users, query, roleFilter])
  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    handlers: users.filter((user) => user.role === 'WIL_HANDLER').length,
    mentorsInterns: users.filter((user) => user.role === 'MENTOR' || user.role === 'INTERN').length,
  }), [users])

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: ({ user, emailSent }) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setToast(emailSent
        ? { message: `${user.fullName} was added. A set-password email was sent to ${user.email}.`, severity: 'success' }
        : { message: `${user.fullName} was added, but the email could not be sent. Use Resend invite to try again.`, severity: 'warning' })
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not add the user.')),
  })

  const resend = useMutation({
    mutationFn: (user: ApiUser) => resendInvite(user.id),
    onSuccess: (_data, user) => setToast({ message: `A new set-password email was sent to ${user.email}.`, severity: 'success' }),
    onError: (err) => setToast({ message: apiErrorMessage(err, 'Could not send the email.'), severity: 'error' }),
  })

  const openDialog = () => { setError(''); setRole(''); setDialogOpen(true) }

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('fullName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()
    const departmentId = String(form.get('departmentId') ?? '')
    if (!fullName || !email || !role) { setError('Complete the name, email and role.'); return }
    if (!emailPattern.test(email)) { setError('Enter a valid email address.'); return }
    if (role === 'MENTOR' && !departmentId) { setError("Choose the mentor's department."); return }
    setError('')
    create.mutate({ fullName, email, role, ...(phone ? { phone } : {}), ...(role === 'MENTOR' ? { departmentId } : {}) })
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
        <Typography sx={{ mt: 0.75, color: 'var(--icep-secondary)' }}>Manage ICEP accounts and their access roles. New users get an email to set their password.</Typography>
      </Box>
      <Button startIcon={<Plus size={18} />} onClick={openDialog}>Add user</Button>
    </Box>

    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
      {stats.map((stat) => <Paper key={stat.label} sx={{ minWidth: 0, p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, border: '1px solid var(--icep-border)', boxShadow: '0 2px 10px rgba(26,32,44,.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 42, height: 42, flex: '0 0 42px', borderRadius: 2, display: 'grid', placeItems: 'center', ...stat.tint }}>{stat.icon}</Box>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 23, fontWeight: 750, lineHeight: 1.2 }}>{stat.value}</Typography><Typography sx={{ mt: 0.35, fontSize: 12, color: 'var(--icep-secondary)' }}>{stat.label}</Typography></Box>
      </Paper>)}
    </Box>

    <Paper sx={{ p: 1.5, borderRadius: 3, border: '1px solid var(--icep-border)', boxShadow: '0 2px 10px rgba(26,32,44,.05)' }}>
      <Box role="search" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or department" sx={{ flex: '1 1 260px', bgcolor: '#fff' }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="var(--icep-secondary)" aria-hidden="true" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search users' } }} />
        <TextField select size="small" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} label="Role" sx={{ minWidth: { xs: '100%', sm: 190 }, bgcolor: '#fff' }}>
          <MenuItem value="">All roles</MenuItem>{Object.entries(roleNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        {(query || roleFilter) && <Button appearance="secondary" onClick={() => { setQuery(''); setRoleFilter('') }}>Clear filters</Button>}
      </Box>
    </Paper>

    {usersQuery.isLoading ? <TableLoading label="Loading users" />
      : usersQuery.isError ? <TableError message={apiErrorMessage(usersQuery.error, "We couldn't load users")} onRetry={() => void usersQuery.refetch()} />
      : <Paper sx={{ overflow: 'hidden', borderRadius: 3, border: '1px solid var(--icep-border)', boxShadow: '0 2px 10px rgba(26,32,44,.05)' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table aria-label="ICEP users" sx={{ minWidth: 760 }}>
          <TableHead><TableRow sx={{ bgcolor: '#F8FAFC' }}>
            {['User', 'Role', 'Department / campus', 'Status', ''].map((heading, i) => <TableCell key={i} sx={headerCellSx}>{heading}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>{filteredUsers.map((user) => {
            const initials = user.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
            const sending = resend.isPending && resend.variables?.id === user.id
            return <TableRow key={user.id} hover>
              <TableCell sx={{ py: 1.5 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: '#E8EEF5', color: 'var(--icep-primary)', fontWeight: 700, fontSize: 13 }}>{initials}</Avatar>
                <Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 650, lineHeight: 1.35 }}>{user.fullName}</Typography><Typography sx={{ color: 'var(--icep-secondary)', fontSize: 13, overflowWrap: 'anywhere' }}>{user.email}</Typography></Box>
              </Box></TableCell>
              <TableCell><Badge label={roleNames[user.role]} sx={roleBadgeStyles[user.role]} /></TableCell>
              <TableCell sx={{ color: 'var(--icep-secondary)' }}>{placeOf(user)}</TableCell>
              <TableCell><Badge label={statusNames[user.status]} sx={statusBadgeStyles[user.status]} /></TableCell>
              <TableCell align="right">
                {user.status === 'INVITED' && <Button appearance="secondary" size="small" startIcon={<MailCheck size={16} />} disabled={sending} onClick={() => resend.mutate(user)}>
                  {sending ? 'Sending…' : 'Resend invite'}
                </Button>}
              </TableCell>
            </TableRow>
          })}</TableBody>
        </Table>
      </TableContainer>
      {!filteredUsers.length && <Box sx={{ py: 6, px: 2, textAlign: 'center' }}><Typography sx={{ fontWeight: 700 }}>No users found</Typography><Typography sx={{ mt: 0.5, color: 'var(--icep-secondary)', fontSize: 14 }}>{users.length ? 'Try another search or role filter.' : 'Add the first staff account with Add user.'}</Typography></Box>}
    </Paper>}

    <Dialog open={dialogOpen} onClose={() => !create.isPending && setDialogOpen(false)} fullWidth maxWidth="sm">
      <form onSubmit={addUser} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>Add user</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="fullName" label="Full name" required fullWidth autoFocus />
          <TextField name="email" label="Email address" type="email" required fullWidth helperText="They will receive a link at this address to set their password." />
          <TextField name="phone" label="Phone (optional)" fullWidth />
          <TextField label="Role" select required value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
            {assignableRoles.map((option) => <MenuItem key={option} value={option}>{roleNames[option]}</MenuItem>)}
          </TextField>
          {role === 'MENTOR' && <TextField name="departmentId" label="Department" select required defaultValue="" fullWidth
            helperText={departmentsQuery.isError ? 'Departments could not be loaded.' : undefined} error={departmentsQuery.isError}>
            {(departmentsQuery.data ?? []).map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
          </TextField>}
          <Typography sx={{ fontSize: 13, color: 'var(--icep-secondary)' }}>Interns are not added here: their account is created when their application is accepted.</Typography>
        </Box></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button appearance="secondary" disabled={create.isPending} onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add and send email'}</Button>
        </DialogActions>
      </form>
    </Dialog>

    <Snackbar open={Boolean(toast)} autoHideDuration={6000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.message}</Alert> : undefined}
    </Snackbar>
  </Box>
}

export default UsersPage
