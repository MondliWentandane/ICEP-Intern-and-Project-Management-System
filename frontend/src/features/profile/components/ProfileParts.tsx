import { useState, type ReactNode } from 'react'
import { Alert, Avatar, Box, Breadcrumbs, Chip, Divider, IconButton, InputAdornment, Link, Paper, Typography } from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Pencil } from 'lucide-react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link as RouterLink } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/features/application/components/FormBits'
import { LinkButton } from '@/features/public-site/components/LinkButton'
import type { UserRole } from '@/types'
import { initials } from '@/utils/format'
import { cardSx } from './styles'
import { changePassword, passwordSchema, profileStatusLabel, type PasswordValues, type Profile } from '../data/profile'


export function PageHeading({ current, title, subtitle }: { current: string; title: string; subtitle: string }) {
  return (
    <Box>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: 13 }}>
        <Typography sx={{ fontSize: 13, color: 'primary.main' }}>My account</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{current}</Typography>
      </Breadcrumbs>
      <Typography component="h1" sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 750 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
    </Box>
  )
}

export function ProfileHeader({ profile, role, editing = false }: { profile: Profile; role: UserRole; editing?: boolean }) {
  return (
    <Paper sx={{ ...cardSx, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Avatar sx={{ width: 64, height: 64, bgcolor: '#DBEAFE', color: 'primary.main', fontWeight: 700, fontSize: 22 }}>{initials(profile.fullName)}</Avatar>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography component="h2" sx={{ fontSize: 21, fontWeight: 700 }}>{profile.fullName}</Typography>
        <Typography sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>{profile.email}</Typography>
        <Chip size="small" label={profileStatusLabel(role)} icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', ml: 1 }} />}
          sx={{ mt: 0.5, bgcolor: 'var(--icep-active-tint)', color: '#166534', fontWeight: 600, '& .MuiChip-icon': { color: 'inherit', mr: -0.5 } }} />
      </Box>
      {editing
        ? <Chip icon={<Pencil size={14} />} label="Editing profile" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600, '& .MuiChip-icon': { color: 'inherit' } }} />
        : <LinkButton to="edit" appearance="secondary" startIcon={<Pencil size={16} />}>Edit profile</LinkButton>}
    </Paper>
  )
}

export function DetailValue({ label, value }: { label: string; value?: ReactNode }) {
  return <Box><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography><Typography component="div" sx={{ fontSize: 15 }}>{value || '—'}</Typography></Box>
}

export function SkillChips({ skills }: { skills: string[] }) {
  if (!skills.length) return <Typography sx={{ fontSize: 15 }}>—</Typography>
  return <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>{skills.map((skill) => <Chip key={skill} size="small" label={skill} sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8' }} />)}</Box>
}

function PasswordField({ id, label, placeholder, registration, errorText, hint, autoComplete }: {
  id: string; label: string; placeholder: string; registration: UseFormRegisterReturn; errorText?: string; hint?: string; autoComplete: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <FormField id={id} label={label} placeholder={placeholder} type={visible ? 'text' : 'password'} autoComplete={autoComplete} registration={registration} errorText={errorText} hint={hint}
      slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton edge="end" size="small" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={() => setVisible((v) => !v)}>{visible ? <Eye size={18} /> : <EyeOff size={18} />}</IconButton></InputAdornment> } }} />
  )
}

export function SecurityCard() {
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })
  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setMessage(null)
    try {
      await changePassword(currentPassword, newPassword)
      reset()
      setMessage({ tone: 'success', text: 'Your password has been updated.' })
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'We could not update your password. Try again.' })
    }
  })
  return (
    <Paper component="section" aria-labelledby="security-title" sx={cardSx}>
      <Typography id="security-title" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>Security</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Choose a strong password to protect your account.</Typography>
      <Divider sx={{ my: 2 }} />
      <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: 'grid', gap: 2 }}>
        {message && <Alert severity={message.tone} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</Alert>}
        <PasswordField id="currentPassword" label="Current password" placeholder="Enter current password" autoComplete="current-password" registration={register('currentPassword')} errorText={errors.currentPassword?.message} />
        <PasswordField id="newPassword" label="New password" placeholder="Enter new password" autoComplete="new-password" registration={register('newPassword')} errorText={errors.newPassword?.message} hint="Use 8+ characters, an uppercase letter, a number and a symbol." />
        <Box><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update password'}</Button></Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Never share your password with anyone, including your coordinator.</Typography>
      </Box>
    </Paper>
  )
}

export function ProfileFootnote() {
  return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Your profile is shared with your ICEP coordinator for WIL administration. <Link component={RouterLink} to="/contact" underline="hover">Contact ICEP</Link></Typography>
}
