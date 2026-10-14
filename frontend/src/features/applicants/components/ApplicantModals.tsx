import { Dialog, DialogTitle } from '@mui/material'
export function ApplicantModal({ open, title, onClose }: { open: boolean; title: string; onClose: () => void }) {
  return <Dialog open={open} onClose={onClose}><DialogTitle>{title}</DialogTitle></Dialog>
}
