import { useRef, useState, type ChangeEvent } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Paperclip, Upload, X } from 'lucide-react'
import { Button } from './Button'
import { formatFileSize } from '@/utils/format'

export interface FileUploadProps {
  onChange?: (file: File | undefined) => void
  accept?: string
  label?: string
  helperText?: string
}

export function FileUpload({ onChange, accept, label = 'Upload file', helperText }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const select = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0]
    setFile(next)
    onChange?.(next)
  }
  const clear = () => {
    setFile(undefined)
    onChange?.(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Button appearance="secondary" component="label" startIcon={<Upload size={17} aria-hidden="true" />}>
        {label}
        <input ref={inputRef} hidden type="file" accept={accept} onChange={select} />
      </Button>
      {file ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, maxWidth: '100%' }}>
          <Paperclip size={15} color="#718096" aria-hidden="true" />
          <Typography noWrap component="span" sx={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{file.name}</Typography>
          <Typography component="span" sx={{ fontSize: 12, color: '#718096' }}>{formatFileSize(file.size)}</Typography>
          <IconButton size="small" aria-label={`Remove ${file.name}`} onClick={clear}><X size={15} /></IconButton>
        </Box>
      ) : (
        helperText && <Typography component="span" sx={{ fontSize: 12, color: '#718096' }}>{helperText}</Typography>
      )}
    </Box>
  )
}

export default FileUpload
