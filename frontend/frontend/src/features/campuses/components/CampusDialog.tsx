import { useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import type { CampusView } from '@/features/shared/workspace/types'
import type { CampusInput } from '../intakes.service'

interface Props {
  campus: CampusView | null
  takenNames: string[]
  onSave: (input: CampusInput) => Promise<void>
  onClose: () => void
}

export function CampusDialog({ campus, takenNames, onSave, onClose }: Props) {
  const [form, setForm] = useState({ name: campus?.name ?? '', address: campus?.address ?? '', city: campus?.city ?? campus?.location ?? '', province: campus?.province ?? '' })
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const name = form.name.trim()
  const nameError = !name ? 'Campus name is required.' : takenNames.some((n) => n.toLowerCase() === name.toLowerCase()) ? 'A campus with this name already exists.' : ''
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (nameError) return
    setSaving(true)
    setError('')
    try {
      await onSave({ name, address: form.address.trim() || undefined, city: form.city.trim() || undefined, province: form.province.trim() || undefined })
      onClose()
    } catch {
      setError('Could not save the campus. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
      <DialogTitle>{campus ? 'Edit campus' : 'Add campus'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Campus name" required autoFocus value={form.name} onChange={set('name')} error={touched && Boolean(nameError)} helperText={touched ? nameError : ' '} />
          <TextField label="Street address" value={form.address} onChange={set('address')} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="City" value={form.city} onChange={set('city')} fullWidth />
            <TextField label="Province" value={form.province} onChange={set('province')} fullWidth />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : campus ? 'Save changes' : 'Add campus'}</Button>
      </DialogActions>
      </form>
    </Dialog>
  )
}
