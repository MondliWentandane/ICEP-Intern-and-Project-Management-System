import { Button as MuiButton, type ButtonProps } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

// Router link styled like the shared ICEP Button (primary/secondary). Candidate for components/ui once agreed with Manthata.
export function LinkButton({ to, relative, appearance = 'primary', sx, ...props }: Omit<ButtonProps, 'href'> & { to: string; relative?: 'route' | 'path'; appearance?: 'primary' | 'secondary' }) {
  const look = appearance === 'primary'
    ? { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }
    : { borderColor: 'divider', color: 'primary.main', bgcolor: '#fff', '&:hover': { bgcolor: '#F5F6F8', borderColor: 'primary.main' } }
  return (
    <MuiButton
      component={RouterLink}
      to={to}
      relative={relative}
      variant={appearance === 'primary' ? 'contained' : 'outlined'}
      {...props}
      sx={[{ minHeight: 40, px: 2.25, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }, look, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    />
  )
}
