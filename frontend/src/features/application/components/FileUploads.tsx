import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Box, Button, ButtonBase, Chip, Dialog, DialogContent, DialogTitle, FormHelperText, IconButton, Typography } from '@mui/material'
import { Eye, Upload, X } from 'lucide-react'
import { formatBytes } from '../data/applicationSchema'

/** Dashed drag-and-drop area for a single PDF. Validation happens in the form schema. */
export function FileDropzone({ id, title = 'Choose a file to upload or replace', onFile, errorText }: { id: string; title?: string; onFile: (file: File) => void; errorText?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }
  return (
    <Box>
      <ButtonBase
        id={id}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-describedby={errorText ? `${id}-error` : undefined}
        sx={{
          width: '100%', display: 'grid', justifyItems: 'center', gap: 0.5, p: 3, borderRadius: 2, textAlign: 'center',
          border: '1.5px dashed', borderColor: errorText ? 'error.main' : dragging ? 'primary.main' : 'divider',
          bgcolor: dragging ? '#EEF2F8' : 'var(--icep-page)', transition: 'background-color .15s ease, border-color .15s ease',
          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        <Upload size={22} color="#1B3A5C" aria-hidden="true" />
        <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Drag and drop your file here, or browse files</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>PDF only · Maximum 5 MB</Typography>
      </ButtonBase>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = '' }}
      />
      {errorText && <FormHelperText id={`${id}-error`} error sx={{ mx: 0 }}>{errorText}</FormHelperText>}
    </Box>
  )
}

export function PdfBadge() {
  return <Box aria-hidden="true" sx={{ width: 38, height: 38, flex: '0 0 38px', display: 'grid', placeItems: 'center', borderRadius: 1.5, bgcolor: 'var(--icep-rejected-tint)', color: 'error.main', fontSize: 11, fontWeight: 800 }}>PDF</Box>
}

/** One uploaded file: PDF badge, optional caption, name, size, status chip and a trailing action. */
export function FileRow({ caption, name, size, status, detail, file, onRemove, action, muted = false }: {
  caption?: string; name: string; size?: number; status?: 'Uploaded' | 'Attached'; detail?: string; file?: File; onRemove?: () => void; action?: ReactNode; muted?: boolean
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewTitleId = useId()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: muted ? 'var(--icep-page)' : '#fff', mt: 1.5 }}>
      <PdfBadge />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {caption && <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{caption}</Typography>}
        <Typography sx={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, color: 'text.secondary' }}>
          <span>{detail ?? `PDF · ${size === undefined ? '' : formatBytes(size)}`}</span>
          {status && <Chip label={status} size="small" sx={{ height: 20, fontSize: 12, bgcolor: 'var(--icep-active-tint)', color: '#166534' }} />}
        </Box>
      </Box>
      {file && (
        <>
          <Button size="small" startIcon={<Eye size={16} />} onClick={() => setPreviewUrl(URL.createObjectURL(file))}>
            Preview
          </Button>
          <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} fullWidth maxWidth="md" aria-labelledby={previewTitleId}>
            <DialogTitle id={previewTitleId}>{name}</DialogTitle>
            <DialogContent sx={{ height: '75vh', p: 0 }}>
              {previewUrl && <Box component="iframe" src={previewUrl} title={`Preview of ${name}`} sx={{ width: '100%', height: '100%', border: 0 }} />}
            </DialogContent>
          </Dialog>
        </>
      )}
      {action}
      {onRemove && <IconButton aria-label={`Remove ${name}`} onClick={onRemove} size="small"><X size={18} /></IconButton>}
    </Box>
  )
}
