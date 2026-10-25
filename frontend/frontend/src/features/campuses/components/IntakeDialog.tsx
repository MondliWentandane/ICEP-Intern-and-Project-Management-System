import { useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material'
import type { IntakeView } from '@/features/shared/workspace/types'
import type { IntakeInput } from '../intakes.service'

interface Props {
  intake: IntakeView | null
  takenNames: string[]
  onSave: (input: IntakeInput) => Promise<void>
  onClose: () => void
}

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '')

export function IntakeDialog({ intake, takenNames, onSave, onClose }: Props) {
  const [form, setForm] = useState({ name: intake?.name ?? '', startDate: toDateInput(intake?.startDate), endDate: toDateInput(intake?.endDate), isActive: intake?.isActive ?? true })
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const name = form.name.trim()
  const errors = {
    name: !name ? 'Intake name is required.' : takenNames.some((n) => n.toLowerCase() === name.toLowerCase()) ? 'An intake with this name already exists.' : '',
    startDate: !form.startDate ? 'Start date is required.' : '',
    endDate: !form.endDate ? 'End date is required.' : form.startDate && form.endDate < form.startDate ? 'End date must be on or after the start date.' : '',
  }
  const invalid = Boolean(errors.name || errors.startDate || errors.endDate)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (invalid) return
    setSaving(true)
    setError('')
    try {
      await onSave({ name, startDate: form.startDate, endDate: form.endDate, isActive: form.isActive })
      onClose()
    } catch {
      setError('Could not save the intake. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
      <DialogTitle>{intake ? 'Edit intake' : 'Add intake'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Intake name" placeholder="e.g. 2027 Intake 1" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={touched && Boolean(errors.name)} helperText={touched ? errors.name : ' '} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Start date" type="date" required fullWidth slotProps={{ inputLabel: { shrink: true } }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} error={touched && Boolean(errors.startDate)} helperText={touched ? errors.startDate : ' '} />
            <TextField label="End date" type="date" required fullWidth slotProps={{ inputLabel: { shrink: true } }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} error={touched && Boolean(errors.endDate)} helperText={touched ? errors.endDate : ' '} />
          </Stack>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active (open for placements)" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : intake ? 'Save changes' : 'Add intake'}</Button>
      </DialogActions>
      </form>
    </Dialog>
  )
}
