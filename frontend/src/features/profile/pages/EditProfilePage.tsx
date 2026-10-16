import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Divider, InputAdornment, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Upload } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TableError, TableLoading } from '@/components/data/TableStates'
import { FileRow } from '@/features/application/components/FileUploads'
import { FormField } from '@/features/application/components/FormBits'
import { TagInput } from '@/features/application/components/TagInput'
import { formatBytes } from '@/features/application/data/applicationSchema'
import { LinkButton } from '@/features/public-site/components/LinkButton'
import { PageHeading, ProfileFootnote, ProfileHeader, SecurityCard } from '../components/ProfileParts'
import { cardSx } from '../components/styles'
import { editProfileSchema, intakes, qualifications, type EditProfileInput, type EditProfileValues, type Profile } from '../data/profile'
import { useProfile } from '../hooks/useProfile'

const fileDate = (file: File) => new Date(file.lastModified).toISOString()
const shortDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
const lockAdornment = { input: { endAdornment: <InputAdornment position="end"><Lock size={16} aria-label="Managed by your coordinator" /></InputAdornment> } }

function SelectField({ id, label, options, value, onChange, onBlur }: { id: string; label: string; options: string[]; value?: string; onChange: (value: string) => void; onBlur: () => void }) {
  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ display: 'block', fontSize: 14, fontWeight: 500, mb: 0.75 }}>{label}</Typography>
      <TextField select fullWidth id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} slotProps={{ select: { displayEmpty: true } }}>
        <MenuItem value="" disabled>Select {label.toLowerCase()}</MenuItem>
        {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
      </TextField>
    </Box>
  )
}

function EditForm({ profile, isIntern, onSave }: { profile: Profile; isIntern: boolean; onSave: (changes: Partial<Profile>) => Promise<unknown> }) {
  const navigate = useNavigate()
  const cvInput = useRef<HTMLInputElement>(null)
  const [saveError, setSaveError] = useState('')
  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<EditProfileInput, unknown, EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { fullName: profile.fullName, email: profile.email, phone: profile.phone, qualification: profile.qualification ?? '', intake: profile.intake ?? '', skills: profile.skills },
  })
  const newCv = useWatch({ control, name: 'newCv' })

  // Warn before leaving the page with unsaved edits (refresh/close tab).
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const onSubmit = handleSubmit(async ({ newCv: cvFile, ...values }) => {
    setSaveError('')
    try {
      await onSave({ ...values, ...(cvFile ? { cv: { name: cvFile.name, size: cvFile.size, updatedAt: fileDate(cvFile), file: cvFile } } : {}) })
      navigate('..', { relative: 'path', state: { saved: true } })
    } catch {
      setSaveError('We could not save your changes. Try again.')
    }
  })

  const cv = newCv instanceof File ? { name: newCv.name, size: newCv.size, updatedAt: fileDate(newCv) } : profile.cv
  return (
    <Paper component="section" aria-labelledby="details-title" sx={cardSx}>
      <Typography id="details-title" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>Personal details</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{isIntern ? 'Fields with a lock are managed by your coordinator.' : 'Keep your contact details up to date.'}</Typography>
      <Divider sx={{ my: 2 }} />
      <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'grid', gap: 2.25 }}>
        {saveError && <Alert severity="error">{saveError}</Alert>}
        <Box sx={{ display: 'grid', gap: 2.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <FormField id="fullName" label="Full name" autoComplete="name" registration={register('fullName')} errorText={errors.fullName?.message} />
          <FormField id="email" label="Email address" type="email" autoComplete="email" registration={register('email')} errorText={errors.email?.message} />
          <FormField id="phone" label="Phone number" type="tel" autoComplete="tel" registration={register('phone')} errorText={errors.phone?.message} />
          {isIntern && <>
            <FormField id="campus" label="Campus" value={profile.campus ?? ''} disabled slotProps={lockAdornment} />
            <FormField id="studentNumber" label="Student number" value={profile.studentNumber ?? ''} disabled slotProps={lockAdornment} />
            <Controller name="qualification" control={control} render={({ field }) => <SelectField id="qualification" label="Qualification" options={qualifications} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
          </>}
        </Box>
        {isIntern && <>
          <Controller name="intake" control={control} render={({ field }) => <SelectField id="intake" label="Intake" options={intakes} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
          <Box>
            <Typography component="label" htmlFor="skills" sx={{ display: 'block', fontSize: 14, fontWeight: 500, mb: 0.75 }}>Skills</Typography>
            <Controller name="skills" control={control} render={({ field, fieldState }) => (
              <TagInput id="skills" value={field.value ?? []} onChange={field.onChange} onBlur={field.onBlur} placeholder="+ Add skill" errorText={fieldState.error?.message} />
            )} />
          </Box>
          <Divider />
          <Box>
            {cv
              ? <FileRow muted name={cv.name} detail={`PDF · ${formatBytes(cv.size)} · Updated ${shortDate(cv.updatedAt)}`}
                  action={<Button type="button" appearance="secondary" size="small" startIcon={<Upload size={16} />} onClick={() => cvInput.current?.click()}>Replace CV</Button>} />
              : <Button type="button" appearance="secondary" startIcon={<Upload size={16} />} onClick={() => cvInput.current?.click()}>Upload CV</Button>}
            <input ref={cvInput} type="file" accept="application/pdf,.pdf" hidden aria-label="Choose a CV file"
              onChange={(event) => { const file = event.target.files?.[0]; if (file) setValue('newCv', file, { shouldValidate: true, shouldDirty: true }); event.target.value = '' }} />
            {errors.newCv && <Typography role="alert" color="error" sx={{ fontSize: 13, mt: 1 }}>{errors.newCv.message}</Typography>}
          </Box>
        </>}
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</Button>
          <LinkButton to=".." relative="path" appearance="secondary">Cancel</LinkButton>
        </Box>
      </Box>
    </Paper>
  )
}

export function EditProfilePage() {
  const { user, data: profile, isLoading, isError, refetch, save } = useProfile()
  if (!user) return null
  if (isLoading) return <TableLoading />
  if (isError || !profile) return <TableError message="We couldn't load your profile" onRetry={() => void refetch()} />
  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <PageHeading current="Edit profile" title="Edit profile" subtitle="Keep your contact information and professional details up to date." />
      <ProfileHeader profile={profile} role={user.role} editing />
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, alignItems: 'start' }}>
        <EditForm profile={profile} isIntern={user.role === 'intern'} onSave={save.mutateAsync} />
        <SecurityCard />
      </Box>
      <ProfileFootnote />
    </Box>
  )
}

export default EditProfilePage
