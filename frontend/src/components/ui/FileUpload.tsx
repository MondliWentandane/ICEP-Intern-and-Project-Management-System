import { Button } from '@mui/material'
export function FileUpload({ onChange }: { onChange?: (file: File | undefined) => void }) { return <Button component="label">Choose file<input hidden type="file" onChange={event => onChange?.(event.target.files?.[0])} /></Button> }
