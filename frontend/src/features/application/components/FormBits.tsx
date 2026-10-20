import { createContext, useContext, type ReactNode } from 'react'
import { Box, Link, TextField, Typography, type TextFieldProps } from '@mui/material'
import { CircleHelp } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'

type FormFieldProps = Omit<TextFieldProps, 'label' | 'name' | 'onChange' | 'onBlur'> & {
  id: string
  label: string
  registration?: UseFormRegisterReturn
  errorText?: string
  hint?: string
}

const InlineLabelsContext = createContext(false)
/** Wrap a form in <InlineLabels value> to put labels beside their inputs from the sm breakpoint up. */
export function InlineLabels({ value, children }: { value: boolean; children: ReactNode }) {
  return <InlineLabelsContext.Provider value={value}>{children}</InlineLabelsContext.Provider>
}

/** A label plus its control; stacked by default, side by side inside <InlineLabels value>. */
export function FieldRow({ label, htmlFor, children }: { label: ReactNode; htmlFor: string; children: ReactNode }) {
  const inline = useContext(InlineLabelsContext)
  return (
    <Box sx={inline ? { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '170px minmax(0, 1fr)' }, columnGap: 2.5, alignItems: 'start' } : undefined}>
      <Typography component="label" htmlFor={htmlFor} sx={{ display: 'block', fontSize: 14, fontWeight: 500, mb: 0.75, ...(inline && { textAlign: { sm: 'right' }, pt: { sm: '17px' }, mb: { sm: 0 } }) }}>{label}</Typography>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  )
}

/** Text field with the label above the input, as in the ICEP Figma forms. */
export function FormField({ id, label, registration, errorText, hint, slotProps, ...props }: FormFieldProps) {
  const { ref, ...field } = registration ?? {}
  return (
    <FieldRow label={label} htmlFor={id}>
      <TextField
        id={id}
        fullWidth
        {...field}
        {...props}
        inputRef={ref}
        error={Boolean(errorText)}
        helperText={errorText ?? hint}
        slotProps={{ ...slotProps, formHelperText: { sx: { mx: 0 } } }}
      />
    </FieldRow>
  )
}

export function HelpLine() {
  return (
    <Typography sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: 14, mt: 3 }}>
      <CircleHelp size={16} aria-hidden="true" /> Need help with your application? Contact <Link href="mailto:icep@tut.ac.za" underline="hover">icep@tut.ac.za</Link>
    </Typography>
  )
}

export function InfoNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 2, borderRadius: 2, bgcolor: 'var(--icep-page)', color: 'text.secondary', fontSize: 14 }}>
      <Box sx={{ display: 'grid', color: 'text.secondary' }}>{icon}</Box>
      <span>{children}</span>
    </Box>
  )
}
