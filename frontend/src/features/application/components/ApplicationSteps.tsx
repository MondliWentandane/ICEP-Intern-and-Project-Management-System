import type { ReactNode } from 'react'
import { Box, Checkbox, Divider, FormControlLabel, FormHelperText, Link, MenuItem, TextField, Typography } from '@mui/material'
import { CircleCheck, Lock, ShieldCheck } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { Link as RouterLink } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { CareerPosition } from '@/features/public-site/data/positions'
import { qualifications, yearsOfStudy, type ApplicationInput, type ApplicationValues } from '../data/applicationSchema'
import { FileDropzone, FileRow } from './FileUploads'
import { FieldRow, FormField, InfoNote } from './FormBits'
import { TagInput } from './TagInput'

const useApplicationContext = () => useFormContext<ApplicationInput, unknown, ApplicationValues>()
const twoColumns = { display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } } as const

/** Live check for the ID and student numbers: re-validates on every keystroke and when the applicant leaves the field, so the length and invalid-ID messages update straight away. */
function useLiveNumber(name: 'idNumber' | 'studentNumber') {
  const { register, trigger } = useApplicationContext()
  return register(name, {
    onChange: () => { void trigger(name) },
    onBlur: () => { void trigger(name) },
  })
}

function LabeledSelect({ name, id, label, options, placeholder }: { name: 'qualification' | 'yearOfStudy'; id: string; label: string; options: readonly string[]; placeholder: string }) {
  const { control, trigger } = useApplicationContext()
  return (
    <Controller name={name} control={control} render={({ field, fieldState }) => (
      <FieldRow label={label} htmlFor={id}>
        <TextField select fullWidth id={id} value={field.value ?? ''} onChange={(event) => { field.onChange(event); if (fieldState.error) void trigger(name) }} onBlur={field.onBlur} inputRef={field.ref}
          error={Boolean(fieldState.error)} helperText={fieldState.error?.message}
          slotProps={{ select: { displayEmpty: true, renderValue: (selected) => (selected ? String(selected) : <Box component="span" sx={{ color: 'text.disabled' }}>{placeholder}</Box>) }, formHelperText: { sx: { mx: 0 } } }}>
          <MenuItem value="" disabled>{placeholder}</MenuItem>
          {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
      </FieldRow>
    )} />
  )
}

/** Dropzone plus the uploaded-file row for one PDF field. */
function PdfField({ name, id, dropTitle }: { name: 'cv' | 'idDocument' | 'academicRecord'; id: string; dropTitle?: string }) {
  const { watch, setValue, resetField, formState: { errors } } = useApplicationContext()
  const file = watch(name)
  return (
    <>
      <FileDropzone id={id} title={dropTitle} onFile={(next) => setValue(name, next, { shouldValidate: true, shouldDirty: true })} errorText={errors[name]?.message} />
      {file instanceof File && <FileRow file={file} name={file.name} size={file.size} status="Uploaded" onRemove={() => resetField(name)} />}
    </>
  )
}

/** One part of a step; the section tabs above the form scroll to its id. */
function FormSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Box component="section" id={id} aria-labelledby={`${id}-title`} sx={{ display: 'grid', gap: 2.5, scrollMarginTop: 56 }}>
      <Typography id={`${id}-title`} component="h4" sx={{ fontSize: 15, fontWeight: 700, color: 'primary.main' }}>{title}</Typography>
      {children}
    </Box>
  )
}

const sectionStack = { display: 'grid', gap: 4 } as const

export function PersonalStep() {
  const { register, formState: { errors } } = useApplicationContext()
  const idRegistration = useLiveNumber('idNumber')
  return (
    <Box sx={sectionStack}>
      <FormSection id="section-name" title="Name">
        <FormField id="firstName" label="Name" autoComplete="given-name" registration={register('firstName')} errorText={errors.firstName?.message} />
        <FormField id="surname" label="Surname" autoComplete="family-name" registration={register('surname')} errorText={errors.surname?.message} />
      </FormSection>
      <FormSection id="section-contact" title="Contact">
        <FormField id="email" label="Email address" type="email" autoComplete="email" registration={register('email')} errorText={errors.email?.message} hint="We'll send application updates to this address." />
        <FormField id="phone" label="Phone number" type="tel" autoComplete="tel" registration={register('phone')} errorText={errors.phone?.message} hint="Use a South African mobile number." />
      </FormSection>
      <FormSection id="section-identity" title="Identity">
        <FormField id="idNumber" label="South African ID number" inputMode="numeric" registration={idRegistration} errorText={errors.idNumber?.message} hint="Enter your 13-digit ID number as it appears on your ID." />
        <InfoNote icon={<ShieldCheck size={18} />}>Your information is used only to assess your WIL application and manage your placement.</InfoNote>
      </FormSection>
    </Box>
  )
}

export function StudiesStep() {
  const { register, control, formState: { errors } } = useApplicationContext()
  const studentRegistration = useLiveNumber('studentNumber')
  return (
    <Box sx={sectionStack}>
      <FormSection id="section-studies" title="Studies">
        <FormField id="studentNumber" label="Student number" inputMode="numeric" registration={studentRegistration} errorText={errors.studentNumber?.message} />
        <FormField id="category" label="Category" registration={register('category')} slotProps={{ input: { readOnly: true } }} />
        <LabeledSelect name="qualification" id="qualification" label="Qualification" options={qualifications} placeholder="e.g. Diploma in Computer Science" />
        <LabeledSelect name="yearOfStudy" id="yearOfStudy" label="Year of study" options={yearsOfStudy} placeholder="Select year" />
      </FormSection>
      <FormSection id="section-skills" title="Skills">
        <FieldRow htmlFor="skills" label={<>Skills <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>(optional)</Box></>}>
          <Controller name="skills" control={control} render={({ field, fieldState }) => (
            <TagInput id="skills" value={field.value ?? []} onChange={field.onChange} onBlur={field.onBlur} errorText={fieldState.error?.message} hint="Type a skill and press Enter to add it. Skills from coursework, projects or hobbies count too. No skills yet? You can leave this empty." />
          )} />
        </FieldRow>
      </FormSection>
      <FormSection id="section-cv" title="CV">
        <FieldRow htmlFor="cv" label="Curriculum vitae (CV)">
          <PdfField name="cv" id="cv" dropTitle="Choose a CV to upload or replace" />
        </FieldRow>
      </FormSection>
    </Box>
  )
}

export function DocumentsStep() {
  const { watch } = useApplicationContext()
  const cv = watch('cv')
  return (
    <Box sx={sectionStack}>
      {cv instanceof File && (
        <Box>
          <Typography sx={{ fontSize: 15 }}>Your CV is already attached from Your studies.</Typography>
          <FileRow file={cv} muted caption="Curriculum vitae" name={cv.name} size={cv.size} status="Uploaded" action={<CircleCheck size={20} color="#16A34A" aria-label="Attached" />} />
        </Box>
      )}
      <FormSection id="section-id-document" title="ID document">
        <FieldRow htmlFor="idDocument" label="ID document">
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.25 }}>A certified copy of your South African ID.</Typography>
          <PdfField name="idDocument" id="idDocument" />
        </FieldRow>
      </FormSection>
      <FormSection id="section-academic-record" title="Academic record">
        <FieldRow htmlFor="academicRecord" label="Academic record">
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.25 }}>Your latest official academic transcript.</Typography>
          <PdfField name="academicRecord" id="academicRecord" />
        </FieldRow>
      </FormSection>
      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: 'text.secondary' }}>
        <Lock size={15} aria-hidden="true" /> Your documents are stored securely and shared only with the ICEP placement team.
      </Typography>
    </Box>
  )
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography component="h3" sx={{ fontWeight: 700, fontSize: 17 }}>{title}</Typography>
        <Button appearance="secondary" size="small" onClick={onEdit} sx={{ minHeight: 34 }} aria-label={`Edit ${title.toLowerCase()}`}>Edit</Button>
      </Box>
      {children}
    </Box>
  )
}

function ReviewValue({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return (
    <Box sx={wide ? { gridColumn: '1 / -1' } : undefined}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 15, overflowWrap: 'anywhere' }}>{value || '—'}</Typography>
    </Box>
  )
}

export function ReviewStep({ position, onEdit }: { position: CareerPosition; onEdit: (step: number) => void }) {
  const { getValues, control } = useApplicationContext()
  const values = getValues()
  const documents = [
    { caption: 'Curriculum vitae', file: values.cv },
    { caption: 'ID document', file: values.idDocument },
    { caption: 'Academic record', file: values.academicRecord },
  ]
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'var(--icep-page)', border: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>WIL placement</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 17, color: 'primary.main' }}>{position.title}</Typography>
        <Typography sx={{ fontSize: 13 }}>ICEP · {position.campus} Campus</Typography>
      </Box>
      <ReviewSection title="Personal details" onEdit={() => onEdit(0)}>
        <Box sx={{ ...twoColumns, gap: 1.5 }}>
          <ReviewValue label="Name" value={values.firstName} />
          <ReviewValue label="Surname" value={values.surname} />
          <ReviewValue label="Email address" value={values.email} />
          <ReviewValue label="Phone number" value={values.phone} />
          <ReviewValue label="South African ID number" value={values.idNumber} wide />
        </Box>
      </ReviewSection>
      <Divider />
      <ReviewSection title="Your studies" onEdit={() => onEdit(1)}>
        <Box sx={{ ...twoColumns, gap: 1.5 }}>
          <ReviewValue label="Student number" value={values.studentNumber} />
          <ReviewValue label="Campus" value={position.campus} />
          <ReviewValue label="Qualification" value={values.qualification} />
          <ReviewValue label="Year of study" value={values.yearOfStudy} />
          <ReviewValue label="Category" value={values.category} />
          <ReviewValue label="Skills" value={values.skills?.length ? values.skills.join(', ') : 'None added'} wide />
        </Box>
      </ReviewSection>
      <Divider />
      <ReviewSection title="Documents" onEdit={() => onEdit(2)}>
        {documents.map(({ caption, file }) => file instanceof File
          ? <FileRow key={caption} file={file} caption={caption} name={file.name} size={file.size} status="Attached" action={<CircleCheck size={20} color="#16A34A" aria-label="Attached" />} />
          : <Typography key={caption} color="error" sx={{ fontSize: 14 }}>{caption} is missing.</Typography>)}
      </ReviewSection>
      <Divider />
      <Controller name="consent" control={control} render={({ field, fieldState }) => (
        <Box>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', mr: 0 }}
            control={<Checkbox checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} onBlur={field.onBlur} sx={{ pt: 0.25 }} />}
            label={<Box>
              <Typography sx={{ fontSize: 15 }}>I confirm that the information provided is accurate and consent to ICEP processing my personal information and documents for this WIL application.</Typography>
              <Link component={RouterLink} to="/about" underline="hover" sx={{ fontSize: 13 }}>Read the privacy notice</Link>
            </Box>}
          />
          {fieldState.error && <FormHelperText error sx={{ mx: 0 }}>{fieldState.error.message}</FormHelperText>}
        </Box>
      )} />
    </Box>
  )
}

/** "Applying for" dropdown shown when the applicant starts from "Apply now" instead of a specific position. */
export function PositionPicker({ positions }: { positions: CareerPosition[] }) {
  const { control, trigger } = useApplicationContext()
  return (
    <Controller name="positionId" control={control} render={({ field, fieldState }) => (
      <Box sx={{ mt: 1.5, maxWidth: 460 }}>
        <Typography component="label" htmlFor="positionId" sx={{ display: 'block', fontSize: 14, color: 'text.secondary', mb: 0.75 }}>Applying for</Typography>
        <TextField select fullWidth id="positionId" value={field.value ?? ''} inputRef={field.ref} onBlur={field.onBlur}
          onChange={(event) => { field.onChange(event); if (fieldState.error) void trigger('positionId') }}
          error={Boolean(fieldState.error)} helperText={fieldState.error?.message}
          slotProps={{ select: { displayEmpty: true }, formHelperText: { sx: { mx: 0 } } }} sx={{ bgcolor: '#fff' }}>
          <MenuItem value="" disabled>Choose a position</MenuItem>
          {positions.map((position) => <MenuItem key={position.id} value={position.id}>{position.title} · {position.campus}</MenuItem>)}
        </TextField>
      </Box>
    )} />
  )
}