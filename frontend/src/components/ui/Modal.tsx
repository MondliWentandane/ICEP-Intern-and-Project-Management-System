import { Dialog, DialogActions, DialogTitle, type DialogProps } from '@mui/material'
import type { ReactNode } from 'react'

export type { DialogProps }

export interface ModalProps extends Omit<DialogProps, 'title'> {
  title?: ReactNode
  actions?: ReactNode
}

export function Modal({ title, actions, children, sx, ...props }: ModalProps) {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      {...props}
      sx={[{ '.MuiDialog-paper': { borderRadius: '12px', boxShadow: '0 2px 10px rgba(26, 32, 44, 0.06)' } }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {title && <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>}
      {children}
      {actions && <DialogActions sx={{ px: 3, pb: 2.5 }}>{actions}</DialogActions>}
    </Dialog>
  )
}

export { DialogTitle, DialogContent, DialogActions } from '@mui/material'
export default Modal
