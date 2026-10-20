import { useState } from 'react'
import { Box, DialogContent, Paper, Typography, type SxProps, type Theme } from '@mui/material'
import { Download, Eye, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { buildPlacementLetterHtml, printPlacementLetter, type PlacementLetterDetails } from './placementLetter'

/** Pop-up preview of the letter, with a "Download PDF" (print / save as PDF) action. */
export function PlacementLetterPreview({ details, open, onClose }: { details: PlacementLetterDetails; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md" title="WIL placement letter"
      actions={<>
        <Button appearance="secondary" onClick={onClose}>Close</Button>
        <Button startIcon={<Download size={16} />} onClick={() => printPlacementLetter(details)}>Download PDF</Button>
      </>}>
      <DialogContent dividers sx={{ p: 0, bgcolor: 'var(--icep-page)' }}>
        <Box component="iframe" title="Placement letter preview" srcDoc={buildPlacementLetterHtml(details)}
          sx={{ display: 'block', width: '100%', height: { xs: '60vh', md: '70vh' }, border: 0, bgcolor: '#fff' }} />
      </DialogContent>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', px: 3, pt: 1.5 }}>
        Tip: in the print dialog, choose "Save as PDF" as the destination to keep a copy.
      </Typography>
    </Modal>
  )
}

/** "Your WIL placement letter" card: preview the letter, or print / save it as a PDF. */
export function PlacementLetterCard({ details, sx }: { details: PlacementLetterDetails; sx?: SxProps<Theme> }) {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <Paper component="section" aria-labelledby="placement-letter-title" sx={sx}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'var(--icep-active-tint)', color: 'var(--icep-active)', flex: '0 0 44px' }}>
          <FileCheck size={22} aria-hidden="true" />
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Typography id="placement-letter-title" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>WIL placement letter</Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.25 }}>
            Your official Work-Integrated Learning placement letter for {details.positionTitle} at the {details.campus} campus.
            Submit it to your institution's WIL or experiential learning office.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button appearance="secondary" size="small" startIcon={<Eye size={16} />} onClick={() => setPreviewOpen(true)}>Preview</Button>
          <Button size="small" startIcon={<Download size={16} />} onClick={() => printPlacementLetter(details)}>Download PDF</Button>
        </Box>
      </Box>
      <PlacementLetterPreview details={details} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </Paper>
  )
}

export default PlacementLetterCard
