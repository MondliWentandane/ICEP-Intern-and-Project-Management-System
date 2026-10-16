import { Button as MuiButton, type ButtonProps } from '@mui/material'
import type { ReactNode } from 'react'

export type ButtonAppearance = 'primary' | 'secondary' | 'danger'

export interface IcepButtonProps extends Omit<ButtonProps, 'color'> {
  appearance?: ButtonAppearance
  startIcon?: ReactNode
  endIcon?: ReactNode
}

export function Button({ appearance = 'primary', variant, sx, ...props }: IcepButtonProps) {
  const appearanceSx = {
    primary: { bgcolor: '#1B3A5C', color: '#fff', '&:hover': { bgcolor: '#12283F' } },
    secondary: { borderColor: '#D1D9E2', color: '#1B3A5C', bgcolor: '#fff', '&:hover': { bgcolor: '#F5F6F8', borderColor: '#1B3A5C' } },
    danger: { bgcolor: '#DC2626', color: '#fff', '&:hover': { bgcolor: '#B91C1C' } },
  }[appearance]
  return <MuiButton {...props} variant={variant ?? (appearance === 'secondary' ? 'outlined' : 'contained')} sx={[{ minHeight: 40, px: 2.25, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }, appearanceSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />
}

export default Button
